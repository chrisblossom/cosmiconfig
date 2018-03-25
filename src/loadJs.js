// @flow
'use strict';

const requireJs = require('./requireJs');
const readFile = require('./readFile');
const createParseFile = require('./createParseFile');

function requireJsWrapper(content, filePath) {
  return requireJs(filePath);
}

module.exports = function loadJs(
  filepath: string,
  options: { ignoreEmpty: boolean, sync?: boolean }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
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
