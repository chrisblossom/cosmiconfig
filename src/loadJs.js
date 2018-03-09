// @flow
'use strict';

const requireJs = require('./requireJs');
const readFile = require('./readFile');

module.exports = function loadJs(
  filepath: string,
  options: { sync?: boolean }
): Promise<?cosmiconfig$Result> | ?cosmiconfig$Result {
  function parseJsFile(content: ?string): ?cosmiconfig$Result {
    if (!content) return null;

    return {
      config: requireJs(content, filepath),
      filepath,
    };
  }

  return !options.sync
    ? readFile(filepath).then(parseJsFile)
    : parseJsFile(readFile.sync(filepath));
};
