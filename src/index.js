// @flow
'use strict';

const os = require('os');
const createExplorer = require('./createExplorer');

type Options = {
  packageProp?: string | false,
  rc?: string | false,
  js?: string | false,
  rcStrictJson?: boolean,
  rcExtensions?: boolean,
  stopDir?: string,
  cache?: boolean,
  transform?: CosmiconfigResult => CosmiconfigResult,
  configPath?: string,
};

function cosmiconfig(moduleName: string, options: Options) {
  const optionsWithDefaults: ExplorerOptions = Object.assign(
    {
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      rcStrictJson: false,
      rcExtensions: false,
      stopDir: os.homedir(),
      cache: true,
    },
    options
  );

  return createExplorer(optionsWithDefaults);
}

module.exports = cosmiconfig;
