import { Loaders, LoadersSync } from './types';
import { jsLoader } from './loaders/jsLoader';
import { jsonLoader } from './loaders/jsonLoader';
import { yamlLoader } from './loaders/yamlLoader';

const defaultLoaders = {
  '.js': jsLoader,
  '.json': jsonLoader,
  '.yaml': yamlLoader,
  '.yml': yamlLoader,
  noExt: yamlLoader,
} as const;

function getLoaders(
  loaders: Loaders | LoadersSync = {},
): Loaders | LoadersSync {
  return {
    ...defaultLoaders,
    ...loaders,
  };
}

export { getLoaders };
