// @flow

export type CosmiconfigResult = {
  config: any,
  filepath: string,
  isEmpty?: boolean,
} | null;

export type ExplorerOptions = {
  packageProp: string | false,
  rc: string | false,
  js: string | false,
  rcStrictJson: boolean,
  rcExtensions: boolean,
  stopDir: string,
  cache: boolean,
  transform?: CosmiconfigResult => CosmiconfigResult,
  configPath?: string,
};

export type LoaderResult = {
  config: Object | null,
  filepath: string,
};
