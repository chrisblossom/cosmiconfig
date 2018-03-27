import os from 'os';
import path from 'path';
import cosmiconfig from '../src';
import { createExplorer as createExplorerMock } from '../src/createExplorer';

// Mock `createExplorer` because we want to check what it is called with.
jest.mock('../src/createExplorer');

describe('cosmiconfig', () => {
  const moduleName = 'foo';
  const stopDir = os.homedir();

  afterEach(() => {
    // Clean up a mock's usage data between tests
    jest.clearAllMocks();
  });

  it('creates explorer with default options if not specified', () => {
    cosmiconfig(moduleName);

    expect(createExplorerMock).toHaveBeenCalledTimes(1);
    expect(createExplorerMock).toHaveBeenCalledWith({
      packageProp: moduleName,
      rc: `.${moduleName}rc`,
      js: `${moduleName}.config.js`,
      rcStrictJson: false,
      rcExtensions: false,
      stopDir,
      cache: true,
    });
  });

  it('creates explorer with preference for given options over defaults', () => {
    const configPath = path.join(__dirname, 'fixtures/foo.json');
    cosmiconfig(moduleName, {
      rc: `.${moduleName}barrc`,
      js: `${moduleName}bar.config.js`,
      rcStrictJson: true,
      rcExtensions: true,
      stopDir: __dirname,
      cache: false,
      configPath,
    });

    expect(createExplorerMock).toHaveBeenCalledWith({
      packageProp: moduleName,
      rc: `.${moduleName}barrc`,
      js: `${moduleName}bar.config.js`,
      rcStrictJson: true,
      rcExtensions: true,
      stopDir: __dirname,
      cache: false,
      configPath,
    });
  });
});
