// @flow
'use strict';

function requireJs(filepath: string) {
  const config = require(filepath);

  return config;
}

module.exports = requireJs;
