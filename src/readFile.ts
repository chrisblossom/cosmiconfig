import fs from 'fs';

interface Options {
  throwNotFound?: boolean;
}

function readFileAsync(
  filepath: string,
  options: Options = {},
): Promise<string | null> {
  const throwNotFound = options.throwNotFound || false;

  return new Promise((resolve, reject): void => {
    fs.readFile(filepath, 'utf8', (err, content): void => {
      if (err && err.code === 'ENOENT' && !throwNotFound) {
        resolve(null);

        return;
      }

      if (err) {
        reject(err);

        return;
      }

      resolve(content);
    });
  });
}

function readFileSync(filepath: string, options: Options = {}): string | null {
  const throwNotFound = options.throwNotFound || false;

  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT' && !throwNotFound) {
      return null;
    }

    throw err;
  }
}

export { readFileAsync, readFileSync };
