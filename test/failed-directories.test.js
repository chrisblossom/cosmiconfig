'use strict';

const util = require('./util');
const cosmiconfig = require('../src');

const testFuncsRunner = util.testFuncsRunner;
const testSyncAndAsync = util.testSyncAndAsync;
const spyOnReadFile = util.spyOnReadFile;
const spyOnStat = util.spyOnStat;

const temp = new util.TempDir();

beforeEach(() => {
  temp.createDir('a/b/c/d/e/f/');
});

afterEach(() => {
  /**
   * Reset all spyOn mocks to initial implementation
   */
  jest.restoreAllMocks();
  jest.resetAllMocks();
  jest.resetModules();

  /**
   * Clean temp directory after each test
   */
  temp.clean();
});

afterAll(() => {
  /**
   * Remove temp.dir created for tests
   */
  temp.remove();
});

describe('cosmiconfig', () => {
  describe('search from directory', () => {
    testSyncAndAsync('gives up if it cannot find the file', sync => () => {
      const readFileSpy = spyOnReadFile(sync);
      const statSpy = spyOnStat(sync);

      const startDir = temp.absolutePath('a/b');
      const search = cosmiconfig('foo', {
        stopDir: temp.absolutePath('.'),
        sync,
      }).search;

      expect.hasAssertions();
      return testFuncsRunner(sync, search(startDir), [
        result => {
          expect(statSpy).toHaveBeenCalledTimes(1);
          expect(statSpy.mock.calls[0][0]).toBe(startDir);

          util.assertSearchSequence(readFileSpy, temp.dir, [
            'a/b/package.json',
            'a/b/.foorc',
            'a/b/foo.config.js',
            'a/package.json',
            'a/.foorc',
            'a/foo.config.js',
            './package.json',
            './.foorc',
            './foo.config.js',
          ]);
          expect(result).toBe(null);
        },
      ]);
    });

    testSyncAndAsync('stops at stopDir and gives up', sync => () => {
      const readFileSpy = spyOnReadFile(sync);

      const startDir = temp.absolutePath('a/b');
      const search = cosmiconfig('foo', {
        stopDir: temp.absolutePath('a'),
        sync,
      }).search;

      expect.hasAssertions();
      return testFuncsRunner(sync, search(startDir), [
        result => {
          util.assertSearchSequence(readFileSpy, temp.dir, [
            'a/b/package.json',
            'a/b/.foorc',
            'a/b/foo.config.js',
            'a/package.json',
            'a/.foorc',
            'a/foo.config.js',
          ]);
          expect(result).toBe(null);
        },
      ]);
    });

    it('returns an empty config result for empty rc file', () => {
      temp.createFile('a/b/package.json', '');
      temp.createFile('a/b/.foorc', '');

      const startDir = temp.absolutePath('a/b');
      const search = sync =>
        cosmiconfig('foo', { stopDir: temp.absolutePath('a'), sync }).search(
          startDir,
          { ignoreEmpty: false }
        );
      const expectedResult = {
        config: undefined,
        filepath: temp.absolutePath('a/b/.foorc'),
        isEmpty: true,
      };

      expect.assertions(2);
      expect(search(true)).toEqual(expectedResult);
      return expect(search(false)).resolves.toEqual(expectedResult);
    });

    it('throws error for invalid YAML in rc file', () => {
      temp.createFile('a/b/.foorc', 'found: true: broken');

      const startDir = temp.absolutePath('a/b');
      const search = sync =>
        cosmiconfig('foo', { stopDir: temp.absolutePath('a'), sync }).search(
          startDir
        );

      expect.assertions(2);
      try {
        search(true);
      } catch (err) {
        expect(err.name).toBe('YAMLException');
      }
      return search(false).catch(err => {
        expect(err.name).toBe('YAMLException');
      });
    });

    it('throws error for invalid JSON in rc file with rcStrictJson', () => {
      temp.createFile('a/b/.foorc', '{ "found": true, }');

      const startDir = temp.absolutePath('a/b');
      const search = sync =>
        cosmiconfig('foo', {
          stopDir: temp.absolutePath('a'),
          rcStrictJson: true,
          sync,
        }).search(startDir);

      expect.assertions(2);
      expect(() => search(true)).toThrow(/JSON Error/);
      return search(false).catch(err => {
        expect(err.message).toMatch(/JSON Error/);
      });
    });

    it('throws error for invalid package.json', () => {
      temp.createFile('a/b/package.json', '{ "foo": "bar", }');

      const startDir = temp.absolutePath('a/b');
      const search = sync =>
        cosmiconfig('foo', { stopDir: temp.absolutePath('a'), sync }).search(
          startDir
        );

      expect.assertions(2);
      expect(() => search(true)).toThrow(/JSON Error/);
      return search(false).catch(err => {
        expect(err.message).toMatch(/JSON Error/);
      });
    });

    it('throws error for invalid JS in .config.js file', () => {
      temp.createFile(
        'a/b/foo.config.js',
        'module.exports = { found: true: false,'
      );

      const startDir = temp.absolutePath('a/b');
      const search = sync =>
        cosmiconfig('foo', { stopDir: temp.absolutePath('a'), sync }).search(
          startDir
        );

      expect.assertions(2);
      try {
        search(true);
      } catch (err) {
        expect(err.name).toBe('SyntaxError');
      }

      jest.resetModules();

      return search(false).catch(err => {
        expect(err.name).toBe('SyntaxError');
      });
    });

    it('returns an empty config result for empty .config.js file', () => {
      temp.createFile('a/b/foo.config.js', '');

      const startDir = temp.absolutePath('a/b');
      const search = sync =>
        cosmiconfig('foo', { stopDir: temp.absolutePath('a'), sync }).search(
          startDir,
          { ignoreEmpty: false }
        );
      const expectedResult = {
        config: undefined,
        filepath: temp.absolutePath('a/b/foo.config.js'),
        isEmpty: true,
      };

      expect.assertions(2);
      expect(search(true)).toEqual(expectedResult);
      return expect(search(false)).resolves.toEqual(expectedResult);
    });

    describe('with rcExtensions', () => {
      const startDir = temp.absolutePath('a/b/c/d/e/f');
      const search = options => {
        const searchOptions =
          options.ignoreEmpty != null
            ? { ignoreEmpty: options.ignoreEmpty }
            : {};

        return cosmiconfig('foo', {
          stopDir: temp.absolutePath('.'),
          rcExtensions: true,
          sync: options.sync,
        }).search(startDir, searchOptions);
      };
      it('throws error for invalid JSON in .foorc.json', () => {
        temp.createFile('a/b/c/d/e/f/.foorc.json', '{ "found": true,, }');

        expect.assertions(2);
        expect(() => search({ sync: true })).toThrow(/JSON Error/);
        return search({ sync: false }).catch(err => {
          expect(err.message).toMatch(/JSON Error/);
        });
      });

      it('throws error for invalid YAML in .foorc.yml', () => {
        // This proves the default 'ignoreEmpty' skips over these files as expected
        temp.createFile('a/b/c/d/e/f/.foorc.json', '');
        temp.createFile('a/b/c/d/e/f/.foorc.yaml', '');

        temp.createFile('a/b/c/d/e/f/.foorc.yml', 'found: thing: true');

        expect.assertions(2);
        try {
          search({ sync: true });
        } catch (err) {
          expect(err.name).toBe('YAMLException');
        }
        return search({ sync: false }).catch(err => {
          expect(err.name).toBe('YAMLException');
        });
      });

      it('throws error for invalid JS in .foorc.js', () => {
        temp.createFile(
          'a/b/c/d/e/f/.foorc.js',
          'module.exports = found: true };'
        );

        expect.assertions(2);
        try {
          search({ sync: true });
        } catch (err) {
          expect(err.name).toBe('SyntaxError');
        }

        jest.resetModules();

        return search({ sync: false }).catch(err => {
          expect(err.name).toBe('SyntaxError');
        });
      });

      it('returns an empty config result for an empty json', () => {
        temp.createFile('a/b/c/d/e/f/.foorc.json', '');

        expect.assertions(2);

        const expectedResult = {
          config: undefined,
          filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.json'),
          isEmpty: true,
        };
        expect(search({ ignoreEmpty: false, sync: true })).toEqual(
          expectedResult
        );
        return expect(
          search({ ignoreEmpty: false, sync: false })
        ).resolves.toEqual(expectedResult);
      });

      it('returns an empty config result for empty yaml', () => {
        temp.createFile('a/b/c/d/e/f/.foorc.yaml', '');

        expect.assertions(2);

        const expectedResult = {
          config: undefined,
          filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yaml'),
          isEmpty: true,
        };
        expect(search({ ignoreEmpty: false, sync: true })).toEqual(
          expectedResult
        );
        return expect(
          search({ ignoreEmpty: false, sync: false })
        ).resolves.toEqual(expectedResult);
      });

      it('returns an empty config result for empty js', () => {
        temp.createFile('a/b/c/d/e/f/.foorc.js', '');

        expect.assertions(2);

        const expectedResult = {
          config: undefined,
          filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
          isEmpty: true,
        };
        expect(search({ ignoreEmpty: false, sync: true })).toEqual(
          expectedResult
        );
        return expect(
          search({ ignoreEmpty: false, sync: false })
        ).resolves.toEqual(expectedResult);
      });
    });
  });
});
