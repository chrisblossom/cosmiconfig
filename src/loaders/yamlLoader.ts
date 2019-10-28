import { parse as parseYaml } from 'yaml';
import { LoaderSync } from '../index';

const yamlLoader: LoaderSync = function yamlLoader(filepath, content) {
  try {
    const result = parseYaml(content, { prettyErrors: true });
    return result;
  } catch (error) {
    error.message = `YAML Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

export { yamlLoader };
