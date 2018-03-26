// @flow
'use strict';

const path = require('path');
const getDirectory = require('./getDirectory');
const loaderSeries = require('./loaderSeries');

type SearchOptions = {
  ignoreEmpty: boolean,
};

function defaultSearchOptions(userOptions: SearchOptions): SearchOptions {
  return Object.assign({ ignoreEmpty: true }, userOptions);
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

module.exports = {
  search,
  searchSync,
};
