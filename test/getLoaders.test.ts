/* eslint-disable @typescript-eslint/no-empty-function */

import { getLoaders } from '../src/getLoaders';
import { getLoaderFunctionsByName } from './util';

const loaderFileRequired = {
  jsLoader: false,
  jsonLoader: false,
  yamlLoader: false,
};

describe('getLoaders', () => {
  beforeEach(() => {
    loaderFileRequired.jsLoader = false;
    loaderFileRequired.jsonLoader = false;
    loaderFileRequired.yamlLoader = false;

    jest.doMock('../src/loaders/jsLoader', () => {
      loaderFileRequired.jsLoader = true;
      return {
        jsLoader() {},
      };
    });

    jest.doMock('../src/loaders/jsonLoader', () => {
      loaderFileRequired.jsonLoader = true;
      return {
        jsonLoader() {},
      };
    });

    jest.doMock('../src/loaders/yamlLoader', () => {
      loaderFileRequired.yamlLoader = true;
      return {
        yamlLoader() {},
      };
    });
  });

  test('gets default loaders', () => {
    const result = getLoaders();

    expect(loaderFileRequired).toEqual({
      jsLoader: true,
      jsonLoader: true,
      yamlLoader: true,
    });

    expect(getLoaderFunctionsByName(result)).toEqual({
      '.js': 'jsLoader',
      '.json': 'jsonLoader',
      '.yaml': 'yamlLoader',
      '.yml': 'yamlLoader',
      noExt: 'yamlLoader',
    });
  });

  test('does not require loader if explicitly set to null or undefined', () => {
    const customLoaders = {
      '.js': undefined,
      '.json': null,
      '.yaml': null,
      '.yml': null,
      noExt: null,
    };

    const result = getLoaders(customLoaders);
    expect(getLoaderFunctionsByName(result)).toEqual({
      '.js': undefined,
      '.json': null,
      '.yaml': null,
      '.yml': null,
      noExt: null,
    });

    expect(loaderFileRequired).toEqual({
      jsLoader: false,
      jsonLoader: false,
      yamlLoader: false,
    });
  });

  test('adds custom loaders', () => {
    const loaders = {
      '.ts': function tsLoaderCustom() {},
      '.js': null,
    };

    const result = getLoaders(loaders);
    expect(getLoaderFunctionsByName(result)).toEqual({
      '.js': null,
      '.ts': 'tsLoaderCustom',
      '.json': 'jsonLoader',
      '.yaml': 'yamlLoader',
      '.yml': 'yamlLoader',
      noExt: 'yamlLoader',
    });

    expect(loaderFileRequired).toEqual({
      jsLoader: false,
      jsonLoader: true,
      yamlLoader: true,
    });
  });
});
