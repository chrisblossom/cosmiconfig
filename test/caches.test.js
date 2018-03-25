'use strict';

const fs = require('fs');
const util = require('./util');
const cosmiconfig = require('../src');

const temp = new util.TempDir();

beforeEach(() => {
  temp.createDir('a/b/c/d/e/f/');
  temp.createFile('a/b/c/d/package.json', '{ "false": "hope" }');
  temp.createFile('a/b/c/d/.foorc', '{ "foundInD": true }');
  temp.createFile('a/b/package.json', '{ "foo": { "foundInB": true } }');
});

afterEach(() => {
  // Reset all spyOn mocks to initial implementation
  jest.restoreAllMocks();

  // Clean temp directory after each test
  temp.clean();
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.remove();
});

describe('cache is not used initially', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual([
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const cachedSearch = cosmiconfig('foo').search;
    return cachedSearch(searchPath).then(result => {
      checkResult(readFileSpy, result);
    });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const cachedSearchSync = cosmiconfig('foo', { sync: true }).search;
    const result = cachedSearchSync(searchPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is used for already-visited directories', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy, result) => {
    expect(readFileSpy).toHaveBeenCalledTimes(0);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const cachedSearch = cosmiconfig('foo').search;
    // First pass, prime the cache ...
    return cachedSearch(searchPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        return cachedSearch(searchPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const cachedSearchSync = cosmiconfig('foo', { sync: true }).search;
    // First pass, prime the cache ...
    cachedSearchSync(searchPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    const result = cachedSearchSync(searchPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is used when some directories in search are already visted', () => {
  const firstSearchPath = temp.absolutePath('a/b/c/d/e');
  const secondSearchPath = temp.absolutePath('a/b/c/d/e/f');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual([
      'a/b/c/d/e/f/package.json',
      'a/b/c/d/e/f/.foorc',
      'a/b/c/d/e/f/foo.config.js',
    ]);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const cachedSearch = cosmiconfig('foo').search;
    // First pass, prime the cache ...
    return cachedSearch(firstSearchPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        return cachedSearch(secondSearchPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const cachedSearchSync = cosmiconfig('foo', { sync: true }).search;
    // First pass, prime the cache ...
    cachedSearchSync(firstSearchPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    const result = cachedSearchSync(secondSearchPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is not used when directly loading an unvisited file', () => {
  const firstSearchPath = temp.absolutePath('a/b/c/d/e');
  const loadPath = temp.absolutePath('a/b/package.json');
  const checkResult = (readFileSpy, result) => {
    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/package.json'),
      config: { foundInB: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    // First pass, prime the cache ...
    return explorer
      .search(firstSearchPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        return explorer.load(loadPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { sync: true });
    // First pass, prime the cache ...
    explorer.search(firstSearchPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    const result = explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('cache is not used in a new cosmiconfig instance', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual([
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    return cosmiconfig('foo')
      .search(searchPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        return cosmiconfig('foo').search(searchPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    cosmiconfig('foo', { sync: true }).search(searchPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    const result = cosmiconfig('foo', { sync: true }).search(searchPath);
    checkResult(readFileSpy, result);
  });
});

describe('clears file cache on calling clearLoadCache', () => {
  const loadPath = temp.absolutePath('a/b/c/d/.foorc');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual(['a/b/c/d/.foorc']);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    return explorer
      .load(loadPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        explorer.clearLoadCache();
        return explorer.load(loadPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.load(loadPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    explorer.clearLoadCache();
    const result = explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('clears file cache on calling clearCaches', () => {
  const loadPath = temp.absolutePath('a/b/c/d/.foorc');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual(['a/b/c/d/.foorc']);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    return explorer
      .load(loadPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        explorer.clearCaches();
        return explorer.load(loadPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.load(loadPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    explorer.clearCaches();

    const result = explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });
});

describe('clears directory cache on calling clearSearchCache', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual([
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    return explorer
      .search(searchPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        explorer.clearSearchCache();
        return explorer.search(searchPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.search(searchPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    explorer.clearSearchCache();
    const result = explorer.search(searchPath);
    checkResult(readFileSpy, result);
  });
});

describe('clears directory cache on calling clearCaches', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual([
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo');
    return explorer
      .search(searchPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        explorer.clearCaches();
        return explorer.search(searchPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { sync: true });
    explorer.search(searchPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    explorer.clearCaches();
    const result = explorer.search(searchPath);
    checkResult(readFileSpy, result);
  });
});

describe('with cache disabled', () => {
  const explorer = cosmiconfig('foo', { cache: false });

  test('does not throw an error when clearFileCache is called', () => {
    expect(() => explorer.clearLoadCache()).not.toThrow();
  });

  test('does not throw an error when clearDirectoryCache is called', () => {
    expect(() => explorer.clearSearchCache()).not.toThrow();
  });

  test('does not throw an error when clearCaches is called', () => {
    expect(() => explorer.clearCaches()).not.toThrow();
  });
});

describe('with cache disabled, does not cache directory results', () => {
  const searchPath = temp.absolutePath('a/b/c/d/e');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual([
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo', { cache: false });
    return explorer
      .search(searchPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        return explorer.search(searchPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { cache: false, sync: true });
    explorer.search(searchPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    const result = explorer.search(searchPath);
    checkResult(readFileSpy, result);
  });
});

describe('with cache disabled, does not cache file results', () => {
  const loadPath = temp.absolutePath('a/b/c/d/.foorc');
  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual(['a/b/c/d/.foorc']);
    expect(result).toEqual({
      filepath: temp.absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const explorer = cosmiconfig('foo', { cache: false });
    return explorer
      .load(loadPath)
      .then(() => {
        // Reset readFile spy and search again.
        readFileSpy.mockClear();
        return explorer.load(loadPath);
      })
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const explorer = cosmiconfig('foo', { cache: false, sync: true });
    explorer.load(loadPath);
    // Reset readFile spy and search again.
    readFileSpy.mockClear();
    const result = explorer.load(loadPath);
    checkResult(readFileSpy, result);
  });
});
