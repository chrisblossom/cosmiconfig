// @flow

import os from 'os';
import { createExplorer } from './createExplorer';

import type { CosmiconfigResult, ExplorerOptions } from './types';

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
  const optionsWithDefaults: ExplorerOptions = {
    packageProp: moduleName,
    rc: `.${moduleName}rc`,
    js: `${moduleName}.config.js`,
    rcStrictJson: false,
    rcExtensions: false,
    stopDir: os.homedir(),
    cache: true,

    ...options,
  };

  return createExplorer(optionsWithDefaults);
}

module.exports = cosmiconfig;
