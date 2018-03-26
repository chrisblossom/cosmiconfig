// @flow
'use strict';

const path = require('path');
const loadDefinedFile = require('./loadDefinedFile');
const loader = require('./loader');

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
