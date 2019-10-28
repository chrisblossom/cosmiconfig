import importFresh from 'import-fresh';
import { LoaderSync } from '../index';

const jsLoader: LoaderSync = function jsLoader(filepath) {
  const result = importFresh(filepath);
  return result;
};

export { jsLoader };
