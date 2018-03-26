// @flow
'use strict';

const path = require('path');
const loadDefinedFile = require('./loadDefinedFile');
const getDirectory = require('./getDirectory');
const loader = require('./loader');
const loaderSeries = require('./loaderSeries');

type SearchOptions = {
  ignoreEmpty: boolean,
};

function defaultSearchOptions(userOptions: SearchOptions): SearchOptions {
  return Object.assign(
    {
      ignoreEmpty: true,
    },
    userOptions
  );
}

const configPathPackagePropError =
  'Please specify the packageProp option. The configPath argument cannot point to a package.json file if packageProp is false.';

module.exports = function createExplorer(options: ExplorerOptions) {
  const loadCache: Map<string, Promise<CosmiconfigResult>> = new Map();
  const loadSyncCache: Map<string, CosmiconfigResult> = new Map();
  const searchCache: Map<string, Promise<CosmiconfigResult>> = new Map();
  const searchSyncCache: Map<string, CosmiconfigResult> = new Map();
  const transform = options.transform || identity;
  const packageProp = options.packageProp;

  function clearLoadCache() {
    loadCache.clear();
    loadSyncCache.clear();
  }

  function clearSearchCache() {
    searchCache.clear();
    searchSyncCache.clear();
  }

  function clearCaches() {
    clearLoadCache();
    clearSearchCache();
  }

  function cacheWrapper<T>(cache: Map<string, T>, key: string, fn: () => T): T {
    if (options.cache) {
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
    }

    const result = fn();

    if (options.cache) {
      cache.set(key, result);
    }
    return result;
  }

  function search(
    searchPath: string,
    userSearchOptions: SearchOptions
  ): Promise<CosmiconfigResult> {
    searchPath = searchPath || process.cwd();
    const searchOptions = defaultSearchOptions(userSearchOptions);
    const absoluteSearchPath = path.resolve(process.cwd(), searchPath);
    return getDirectory(absoluteSearchPath).then(dir => {
      return searchDirectory(dir, searchOptions);
    });
  }

  function searchSync(
    searchPath: string,
    userSearchOptions: SearchOptions
  ): CosmiconfigResult {
    searchPath = searchPath || process.cwd();
    const searchOptions = defaultSearchOptions(userSearchOptions);
    const absoluteSearchPath = path.resolve(process.cwd(), searchPath);
    const dir = getDirectory.sync(absoluteSearchPath);
    return searchDirectorySync(dir, searchOptions);
  }

  const tryLoadingPackageJsonProp = args => () => {
    const sync = args.sync;
    const directory = args.directory;

    if (options.packageProp === false) {
      return null;
    }

    return sync === false
      ? loader.loadPackageProp(directory, packageProp)
      : loader.loadPackagePropSync(directory, packageProp);
  };

  const tryLoadingRcFile = args => () => {
    const sync = args.sync;
    const directory = args.directory;
    const searchOptions = args.searchOptions;

    if (options.rc === false) {
      return null;
    }

    const filePath = path.join(directory, options.rc);
    const opts = {
      strictJson: options.rcStrictJson,
      extensions: options.rcExtensions,
      ignoreEmpty: searchOptions.ignoreEmpty,
    };

    return sync === false
      ? loader.loadRcFile(filePath, opts)
      : loader.loadRcFileSync(filePath, opts);
  };

  const tryLoadingJsFile = args => () => {
    const sync = args.sync;
    const directory = args.directory;

    if (options.js === false) {
      return null;
    }

    const filePath = path.join(directory, options.js);

    return sync === false
      ? loader.loadJsFile(filePath)
      : loader.loadJsFileSync(filePath);
  };

  const tryNextDirectory = args => () => {
    const sync = args.sync;
    const directory = args.directory;
    const searchOptions = args.searchOptions;

    const nextDirectory = path.dirname(directory);
    if (nextDirectory === directory || directory === options.stopDir) {
      return null;
    }

    return sync === false
      ? searchDirectory(nextDirectory, searchOptions)
      : searchDirectorySync(nextDirectory, searchOptions);
  };

  const getSeries = args => {
    const sync = args.sync;
    const directory = args.directory;
    const searchOptions = args.searchOptions;

    return [
      tryLoadingPackageJsonProp({ sync, directory }),
      tryLoadingRcFile({ sync, directory, searchOptions }),
      tryLoadingJsFile({ sync, directory }),
      tryNextDirectory({ sync, directory, searchOptions }),
    ];
  };

  function searchDirectory(
    directory: string,
    searchOptions: SearchOptions
  ): Promise<CosmiconfigResult> {
    return cacheWrapper(searchCache, directory, () => {
      const sync = false;

      const series = getSeries({ sync, directory, searchOptions });

      const resultPromise = loaderSeries(series, {
        ignoreEmpty: searchOptions.ignoreEmpty,
      });

      return resultPromise.then(transform);
    });
  }

  function searchDirectorySync(
    directory: string,
    searchOptions: SearchOptions
  ): CosmiconfigResult {
    return cacheWrapper(searchSyncCache, directory, () => {
      const sync = true;

      const series = getSeries({ sync, directory, searchOptions });

      const rawResult = loaderSeries.sync(series, {
        ignoreEmpty: searchOptions.ignoreEmpty,
      });

      return transform(rawResult);
    });
  }

  function getAbsoluteConfigPath(configPath?: string): string {
    if (!configPath && options.configPath) {
      configPath = options.configPath;
    }

    if (typeof configPath !== 'string' || configPath === '') {
      throw new Error(
        `configPath must be a nonempty string\nconfigPath: ${JSON.stringify(
          configPath
        )}`
      );
    }

    return path.resolve(process.cwd(), configPath);
  }

  function load(configPath?: string): Promise<CosmiconfigResult> {
    return Promise.resolve().then(() => {
      const absoluteConfigPath = getAbsoluteConfigPath(configPath);

      return cacheWrapper(loadCache, absoluteConfigPath, () => {
        let resultPromise;
        if (path.basename(absoluteConfigPath) === 'package.json') {
          if (!packageProp) {
            throw new Error(configPathPackagePropError);
          }
          resultPromise = loader.loadPackageProp(
            path.dirname(absoluteConfigPath),
            packageProp
          );
        } else {
          resultPromise = loadDefinedFile(absoluteConfigPath);
        }
        return resultPromise.then(transform);
      });
    });
  }

  function loadSync(configPath?: string): CosmiconfigResult {
    const absoluteConfigPath = getAbsoluteConfigPath(configPath);

    return cacheWrapper(loadSyncCache, absoluteConfigPath, () => {
      let rawResult;
      if (path.basename(absoluteConfigPath) === 'package.json') {
        if (!packageProp) {
          throw new Error(configPathPackagePropError);
        }
        rawResult = loader.loadPackagePropSync(
          path.dirname(absoluteConfigPath),
          packageProp
        );
      } else {
        rawResult = loadDefinedFile.sync(absoluteConfigPath);
      }

      return transform(rawResult);
    });
  }

  return {
    search,
    searchSync,
    load,
    loadSync,
    clearLoadCache,
    clearSearchCache,
    clearCaches,
  };
};

function identity(x) {
  return x;
}
