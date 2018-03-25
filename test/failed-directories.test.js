'use strict';

const fs = require('fs');
const util = require('./util');
const cosmiconfig = require('../src');

const temp = new util.TempDir();

beforeEach(() => {
  temp.createDir('a/b/c/d/e/f/');
});

afterEach(() => {
  // Reset all spyOn mocks to initial implementation
  jest.restoreAllMocks();

  // Clean temp directory before each test
  temp.clean();
});

afterAll(() => {
  // Remove temp.dir created for tests
  temp.remove();
});

describe('gives up if it cannot find the file', () => {
  const startDir = temp.absolutePath('a/b');

  const checkResult = (statSpy, readFileSpy, result) => {
    const statPath = temp.getSpyPathCalls(statSpy);
    expect(statPath).toEqual(['a/b']);

    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual([
      'a/b/package.json',
      'a/b/.foorc',
      'a/b/foo.config.js',
      'a/package.json',
      'a/.foorc',
      'a/foo.config.js',
      'package.json',
      '.foorc',
      'foo.config.js',
    ]);
    expect(result).toBe(null);
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const statSpy = jest.spyOn(fs, 'stat');
    return cosmiconfig('foo', {
      stopDir: temp.absolutePath('.'),
    })
      .search(startDir)
      .then(result => {
        checkResult(statSpy, readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const statSpy = jest.spyOn(fs, 'statSync');
    const result = cosmiconfig('foo', {
      stopDir: temp.absolutePath('.'),
      sync: true,
    }).search(startDir);
    checkResult(statSpy, readFileSpy, result);
  });
});

describe('stops at stopDir and gives up', () => {
  const startDir = temp.absolutePath('a/b');

  const checkResult = (readFileSpy, result) => {
    const searchPath = temp.getSpyPathCalls(readFileSpy);
    expect(searchPath).toEqual([
      'a/b/package.json',
      'a/b/.foorc',
      'a/b/foo.config.js',
      'a/package.json',
      'a/.foorc',
      'a/foo.config.js',
    ]);
    expect(result).toBe(null);
  };

  test('async', () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    return cosmiconfig('foo', {
      stopDir: temp.absolutePath('a'),
    })
      .search(startDir)
      .then(result => {
        checkResult(readFileSpy, result);
      });
  });

  test('sync', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync');
    const result = cosmiconfig('foo', {
      stopDir: temp.absolutePath('a'),
      sync: true,
    }).search(startDir);
    checkResult(readFileSpy, result);
  });
});

describe('throws error for invalid YAML in rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/.foorc', 'found: true: broken');
  });

  const startDir = temp.absolutePath('a/b');

  const checkError = error => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', { stopDir: temp.absolutePath('a') })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        stopDir: temp.absolutePath('a'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid JSON in rc file with rcStrictJson', () => {
  beforeEach(() => {
    temp.createFile('a/b/.foorc', 'found: true: broken');
  });

  const startDir = temp.absolutePath('a/b');

  const checkError = error => {
    expect(error.name).toMatch(/JSONError/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', {
      rcStrictJson: true,
      stopDir: temp.absolutePath('a'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        rcStrictJson: true,
        stopDir: temp.absolutePath('a'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid package.json', () => {
  beforeEach(() => {
    temp.createFile('a/b/package.json', '{ "foo": "bar", }');
  });

  const startDir = temp.absolutePath('a/b');

  const checkError = error => {
    expect(error.name).toMatch(/JSONError/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', {
      stopDir: temp.absolutePath('a'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        stopDir: temp.absolutePath('a'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('throws error for invalid JS in .config.js file', () => {
  beforeEach(() => {
    temp.createFile(
      'a/b/foo.config.js',
      'module.exports = { found: true: false,'
    );
  });

  const startDir = temp.absolutePath('a/b');

  const checkError = error => {
    expect(error.name).toBe('SyntaxError');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', {
      stopDir: temp.absolutePath('a'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        stopDir: temp.absolutePath('a'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('with rcExtensions, throws error for invalid JSON in .foorc.json', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.json', '{ "found": true,, }');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');

  const checkError = error => {
    expect(error.message).toMatch(/JSON Error/);
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('.'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        rcExtensions: true,
        stopDir: temp.absolutePath('.'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('with rcExtensions, throws error for invalid YAML in .foorc.yml', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yml', 'found: thing: true');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');

  const checkError = error => {
    expect(error.name).toBe('YAMLException');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('.'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        rcExtensions: true,
        stopDir: temp.absolutePath('.'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('with rcExtensions, throws error for invalid JS in .foorc.js', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.js', 'module.exports = found: true };');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');

  const checkError = error => {
    expect(error.name).toBe('SyntaxError');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('.'),
    })
      .search(startDir)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig('foo', {
        rcExtensions: true,
        stopDir: temp.absolutePath('.'),
        sync: true,
      }).search(startDir);
    } catch (error) {
      checkError(error);
    }
  });
});

describe('with ignoreEmpty: false, returns an empty config result for an empty rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/.foorc', '');
  });

  const startDir = temp.absolutePath('a/b');

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/.foorc'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', { stopDir: temp.absolutePath('a') })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', {
      stopDir: temp.absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});

describe('with ignoreEmpty: false, returns an empty config result for an empty .config.js file', () => {
  beforeEach(() => {
    temp.createFile('a/b/foo.config.js', '');
  });

  const startDir = temp.absolutePath('a/b');

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/foo.config.js'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', { stopDir: temp.absolutePath('a') })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', {
      stopDir: temp.absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});

describe('with ignoreEmtpy and rcExtensions, returns an empty config result for an empty .json rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.json', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.json'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('a'),
    })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});

describe('with ignoreEmtpy and rcExtensions, returns an empty config result for an empty .yaml rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.yaml', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yaml'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('a'),
    })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});

describe('with ignoreEmtpy and rcExtensions, returns an empty config result for an empty .js rc file', () => {
  beforeEach(() => {
    temp.createFile('a/b/c/d/e/f/.foorc.js', '');
  });

  const startDir = temp.absolutePath('a/b/c/d/e/f');

  const checkResult = result => {
    expect(result).toEqual({
      config: undefined,
      filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
      isEmpty: true,
    });
  };

  test('async', () => {
    return cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('a'),
    })
      .search(startDir, { ignoreEmpty: false })
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', {
      rcExtensions: true,
      stopDir: temp.absolutePath('a'),
      sync: true,
    }).search(startDir, { ignoreEmpty: false });
    checkResult(result);
  });
});
