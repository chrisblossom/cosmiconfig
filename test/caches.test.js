'use strict';

const util = require('./util');
const cosmiconfig = require('../src');

const testFuncsRunner = util.testFuncsRunner;
const testSyncAndAsync = util.testSyncAndAsync;

const temp = new util.TempDir();

beforeEach(() => {
  temp.createDir('a/b/c/d/e/f/');
  temp.createFile('a/b/c/d/package.json', '{ "false": "hope" }');
  temp.createFile('a/b/c/d/.foorc', '{ "foundInD": true }');
  temp.createFile('a/b/package.json', '{ "foo": { "foundInB": true } }');
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

const cachedSearch = cosmiconfig('foo').search;
const cachedSearchSync = cosmiconfig('foo', { sync: true }).search;
const cachedLoad = cosmiconfig('foo').load;
const cachedLoadSync = cosmiconfig('foo', { sync: true }).load;
const cachedSearchFor = sync =>
  sync === true ? cachedSearchSync : cachedSearch;
const cachedLoadFor = sync => (sync === true ? cachedLoadSync : cachedLoad);

describe('cosmiconfig', () => {
  describe('cache', () => {
    testSyncAndAsync('is not used initially', sync => () => {
      const search = cachedSearchFor(sync);
      const searchPath = temp.absolutePath('a/b/c/d/e');

      const readFileSpy = util.spyOnReadFile(sync);

      expect.hasAssertions();
      return testFuncsRunner(sync, search(searchPath), [
        result => {
          util.assertSearchSequence(readFileSpy, temp.dir, [
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
        },
      ]);
    });

    testSyncAndAsync('is used for already visited directories', sync => () => {
      const search = cachedSearchFor(sync);
      // E and D visited above
      const searchPath = temp.absolutePath('a/b/c/d/e');
      const readFileSpy = util.spyOnReadFile(sync);

      expect.hasAssertions();
      return testFuncsRunner(sync, search(searchPath), [
        result => {
          expect(readFileSpy).toHaveBeenCalledTimes(0);
          expect(result).toEqual({
            filepath: temp.absolutePath('a/b/c/d/.foorc'),
            config: { foundInD: true },
          });
        },
      ]);
    });

    testSyncAndAsync(
      'is used when some directories in search are already visted',
      sync => () => {
        const search = cachedSearchFor(sync);
        // E and D visited above, not F
        const searchPath = temp.absolutePath('a/b/c/d/e/f');
        const readFileSpy = util.spyOnReadFile(sync);

        expect.hasAssertions();
        return testFuncsRunner(sync, search(searchPath), [
          result => {
            util.assertSearchSequence(readFileSpy, temp.dir, [
              'a/b/c/d/e/f/package.json',
              'a/b/c/d/e/f/.foorc',
              'a/b/c/d/e/f/foo.config.js',
            ]);
            expect(result).toEqual({
              filepath: temp.absolutePath('a/b/c/d/.foorc'),
              config: { foundInD: true },
            });
          },
        ]);
      }
    );

    testSyncAndAsync('is not used for unvisited config file', sync => () => {
      const load = cachedLoadFor(sync);
      // B not yet visited
      const configFile = temp.absolutePath('a/b/package.json');
      const readFileSpy = util.spyOnReadFile(sync);

      expect.hasAssertions();
      return testFuncsRunner(sync, load(configFile), [
        result => {
          expect(readFileSpy).toHaveBeenCalledTimes(1);
          expect(result).toEqual({
            filepath: temp.absolutePath('a/b/package.json'),
            config: { foundInB: true },
          });
        },
      ]);
    });

    testSyncAndAsync(
      'is not used in a new cosmiconfig instance',
      sync => () => {
        const search = cosmiconfig('foo', { sync }).search;
        const searchPath = temp.absolutePath('a/b/c/d/e');
        const readFileSpy = util.spyOnReadFile(sync);

        expect.hasAssertions();
        return testFuncsRunner(sync, search(searchPath), [
          result => {
            util.assertSearchSequence(readFileSpy, temp.dir, [
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
          },
        ]);
      }
    );

    testSyncAndAsync('still works on old instance', sync => () => {
      const search = cachedSearchFor(sync);
      const searchPath = temp.absolutePath('a/b/c/d/e');
      const readFileSpy = util.spyOnReadFile(sync);

      expect.hasAssertions();
      return testFuncsRunner(sync, search(searchPath), [
        result => {
          expect(readFileSpy).toHaveBeenCalledTimes(0);
          expect(result).toEqual({
            filepath: temp.absolutePath('a/b/c/d/.foorc'),
            config: { foundInD: true },
          });
        },
      ]);
    });

    testSyncAndAsync(
      'clears load cache on calling clearLoadCache',
      sync => () => {
        const explorer = cosmiconfig('foo', { sync });
        const searchPath = temp.absolutePath('a/b/c/d/.foorc');
        const readFileSpy = util.spyOnReadFile(sync);

        const expectedResult = {
          filepath: temp.absolutePath('a/b/c/d/.foorc'),
          config: { foundInD: true },
        };

        function expectation(result) {
          util.assertSearchSequence(readFileSpy, temp.dir, ['a/b/c/d/.foorc']);
          expect(result).toEqual(expectedResult);
        }

        expect.hasAssertions();
        return testFuncsRunner(sync, explorer.load(searchPath), [
          expectation,
          () => explorer.load(searchPath),
          expectation,
          () => {
            explorer.clearLoadCache();
          },
          () => explorer.load(searchPath),
          result => {
            util.assertSearchSequence(readFileSpy, temp.dir, [
              'a/b/c/d/.foorc',
              'a/b/c/d/.foorc',
            ]);
            expect(result).toEqual(expectedResult);
          },
        ]);
      }
    );

    testSyncAndAsync(
      'clears search cache on calling clearSearchCache',
      sync => () => {
        const explorer = cosmiconfig('foo', { sync });
        const searchPath = temp.absolutePath('a/b/c/d/e');
        const readFileSpy = util.spyOnReadFile(sync);

        const expectedResult = {
          filepath: temp.absolutePath('a/b/c/d/.foorc'),
          config: { foundInD: true },
        };

        function expectation(result) {
          util.assertSearchSequence(readFileSpy, temp.dir, [
            'a/b/c/d/e/package.json',
            'a/b/c/d/e/.foorc',
            'a/b/c/d/e/foo.config.js',
            'a/b/c/d/package.json',
            'a/b/c/d/.foorc',
          ]);
          expect(result).toEqual(expectedResult);
        }

        expect.hasAssertions();
        return testFuncsRunner(sync, explorer.search(searchPath), [
          expectation,
          () => explorer.search(searchPath),
          expectation,
          () => {
            explorer.clearSearchCache();
          },
          () => explorer.search(searchPath),
          result => {
            util.assertSearchSequence(readFileSpy, temp.dir, [
              'a/b/c/d/e/package.json',
              'a/b/c/d/e/.foorc',
              'a/b/c/d/e/foo.config.js',
              'a/b/c/d/package.json',
              'a/b/c/d/.foorc',
              'a/b/c/d/e/package.json',
              'a/b/c/d/e/.foorc',
              'a/b/c/d/e/foo.config.js',
              'a/b/c/d/package.json',
              'a/b/c/d/.foorc',
            ]);
            expect(result).toEqual(expectedResult);
          },
        ]);
      }
    );

    testSyncAndAsync(
      'clears both load and search cache on calling clearCaches',
      sync => () => {
        const explorer = cosmiconfig('foo', { sync });
        const searchPathFile = temp.absolutePath('a/b/c/d/.foorc');
        const searchPathDir = temp.absolutePath('a/b/c/d/e');
        const readFileSpy = util.spyOnReadFile(sync);

        const expectedResult = {
          filepath: temp.absolutePath('a/b/c/d/.foorc'),
          config: { foundInD: true },
        };

        function freshLoadFileExpect(result) {
          util.assertSearchSequence(readFileSpy, temp.dir, ['a/b/c/d/.foorc']);
          expect(result).toEqual(expectedResult);
          readFileSpy.mockClear();
        }

        function freshLoadDirExpect(result) {
          util.assertSearchSequence(readFileSpy, temp.dir, [
            'a/b/c/d/e/package.json',
            'a/b/c/d/e/.foorc',
            'a/b/c/d/e/foo.config.js',
            'a/b/c/d/package.json',
            'a/b/c/d/.foorc',
          ]);
          expect(result).toEqual(expectedResult);
          readFileSpy.mockClear();
        }

        function loadFromFile() {
          return explorer.load(searchPathFile);
        }

        function loadFromDir() {
          return explorer.search(searchPathDir);
        }

        expect.hasAssertions();
        return testFuncsRunner(sync, loadFromFile(), [
          freshLoadFileExpect,
          loadFromFile,
          result => {
            // cachedSearchFileExpect
            expect(readFileSpy).not.toHaveBeenCalled();
            expect(result).toEqual(expectedResult);
          },
          loadFromDir,
          freshLoadDirExpect,
          loadFromDir,
          result => {
            // cachedSearchDirExpect
            expect(readFileSpy).not.toHaveBeenCalled(); // so no need to clear
            expect(result).toEqual(expectedResult);
          },
          () => {
            explorer.clearCaches();
          },
          loadFromDir,
          freshLoadDirExpect,
          loadFromFile,
          freshLoadFileExpect,
        ]);
      }
    );
  });

  describe('cache disabled', () => {
    const explorer = cosmiconfig('foo', { cache: false });

    it('does not throw an error when clearLoadCache is called', () => {
      expect(() => explorer.clearLoadCache()).not.toThrow();
    });

    it('does not throw an error when clearSearchCache is called', () => {
      expect(() => explorer.clearSearchCache()).not.toThrow();
    });
    it('does not throw an error when clearCaches is called', () => {
      expect(() => explorer.clearCaches()).not.toThrow();
    });

    testSyncAndAsync('does not cache search results', sync => () => {
      const search = cosmiconfig('foo', { sync, cache: false }).search;
      const searchPath = temp.absolutePath('a/b/c/d');
      const readFileSpy = util.spyOnReadFile(sync);

      const expectedResult = {
        filepath: temp.absolutePath('a/b/c/d/.foorc'),
        config: { foundInD: true },
      };

      function expectation(result) {
        util.assertSearchSequence(readFileSpy, temp.dir, [
          'a/b/c/d/package.json',
          'a/b/c/d/.foorc',
        ]);
        expect(result).toEqual(expectedResult);
        readFileSpy.mockClear();
      }

      expect.hasAssertions();
      return testFuncsRunner(sync, search(searchPath), [
        expectation,
        () => search(searchPath),
        expectation,
      ]);
    });

    testSyncAndAsync('does not cache load results', sync => () => {
      const explorer = cosmiconfig('foo', { sync, cache: false });
      const searchPath = temp.absolutePath('a/b/c/d/.foorc');
      const readFileSpy = util.spyOnReadFile(sync);

      const expectedResult = {
        filepath: temp.absolutePath('a/b/c/d/.foorc'),
        config: { foundInD: true },
      };

      function expectation(result) {
        util.assertSearchSequence(readFileSpy, temp.dir, ['a/b/c/d/.foorc']);
        expect(result).toEqual(expectedResult);
        readFileSpy.mockClear();
      }

      expect.hasAssertions();
      return testFuncsRunner(sync, explorer.load(searchPath), [
        expectation,
        () => explorer.load(searchPath),
        expectation,
      ]);
    });
  });
});
