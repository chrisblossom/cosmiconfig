/* eslint-disable @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires */

import { Loaders, LoadersSync } from './types';

const defaultLoaders = {
  '.js': 'jsLoader',
  '.json': 'jsonLoader',
  '.yaml': 'yamlLoader',
  '.yml': 'yamlLoader',
  noExt: 'yamlLoader',
} as const;

function getLoaders(
  customLoaders: Loaders | LoadersSync = {},
): Loaders | LoadersSync {
  const result: Loaders | LoadersSync = { ...customLoaders };

  Object.entries(defaultLoaders).forEach(([extension, loader]) => {
    if (
      Object.prototype.hasOwnProperty.call(customLoaders, extension) === false
    ) {
      const requireLoader = require(`./loaders/${loader}`);

      result[extension] = requireLoader[loader];
    } else if (typeof customLoaders[extension] === 'function') {
      result[extension] = customLoaders[extension];
    }
  });

  return result;
}

export { getLoaders, defaultLoaders };
