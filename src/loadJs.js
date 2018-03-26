// @flow
'use strict';

const readFile = require('./readFile');
const createParseFile = require('./createParseFile');

module.exports = function loadJs(
  filepath: string,
  jsLoader: string => ?Object,
  options: { ignoreEmpty: boolean, sync?: boolean }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
  function requireJsWrapper(content, filePath) {
    const config = jsLoader(filePath);

    return config;
  }

  const parseJsFile = createParseFile(
    filepath,
    requireJsWrapper,
    options.ignoreEmpty
  );

  /**
   * use readFile to verify the file exists
   */
  return !options.sync
    ? readFile(filepath).then(parseJsFile)
    : parseJsFile(readFile.sync(filepath));
};
