// @flow
'use strict';

// const requireFromString = require('require-from-string');

// TODO: parse content if non-js file
function requireJs(content: string, filepath: string) {
  // let result = requireFromString(content, filepath);
  let result = require(filepath);

  /**
   * Handle ES Modules
   */
  if (typeof result === 'object' && result.__esModule) {
    if (result.default) {
      result = result.default;
    } else {
      throw new Error(`${filepath} must use default export with ES Modules`);
    }
  }

  return result;
}

module.exports = requireJs;
