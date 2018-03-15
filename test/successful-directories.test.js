'use strict';

const util = require('./util');
const cosmiconfig = require('../src');

const testFuncsRunner = util.testFuncsRunner;
const testSyncAndAsync = util.testSyncAndAsync;
const spyOnReadFile = util.spyOnReadFile;

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
   * Clean temp directory before each test
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
    const search = (sync, startDir) =>
      cosmiconfig('foo', { stopDir: temp.absolutePath('.'), sync }).search(
        startDir
      );

    // testSyncAndAsync(
    //   'finds rc file in third searched dir, with a package.json lacking prop',
    //   sync => () => {
    //     temp.createFile('a/b/c/d/package.json', '{ "false": "hope" }');
    //     temp.createFile('a/b/c/d/.foorc', '{ "found": true }');
    //
    //     const readFileSpy = spyOnReadFile(sync);
    //     const startDir = temp.absolutePath('a/b/c/d/e/f');
    //
    //     expect.hasAssertions();
    //     return testFuncsRunner(sync, search(sync, startDir), [
    //       result => {
    //         util.assertSearchSequence(readFileSpy, temp.dir, [
    //           'a/b/c/d/e/f/package.json',
    //           'a/b/c/d/e/f/.foorc',
    //           'a/b/c/d/e/f/foo.config.js',
    //           'a/b/c/d/e/package.json',
    //           'a/b/c/d/e/.foorc',
    //           'a/b/c/d/e/foo.config.js',
    //           'a/b/c/d/package.json',
    //           'a/b/c/d/.foorc',
    //         ]);
    //
    //         expect(result).toEqual({
    //           config: { found: true },
    //           filepath: temp.absolutePath('a/b/c/d/.foorc'),
    //         });
    //       },
    //     ]);
    //   }
    // );
    //
    // testSyncAndAsync(
    //   'finds package.json prop in second searched dir',
    //   sync => () => {
    //     temp.createFile(
    //       'a/b/c/d/e/package.json',
    //       '{ "author": "Todd", "foo": { "found": true } }'
    //     );
    //
    //     const readFileSpy = spyOnReadFile(sync);
    //     const startDir = temp.absolutePath('a/b/c/d/e/f');
    //
    //     expect.hasAssertions();
    //     return testFuncsRunner(sync, search(sync, startDir), [
    //       result => {
    //         util.assertSearchSequence(readFileSpy, temp.dir, [
    //           'a/b/c/d/e/f/package.json',
    //           'a/b/c/d/e/f/.foorc',
    //           'a/b/c/d/e/f/foo.config.js',
    //           'a/b/c/d/e/package.json',
    //         ]);
    //
    //         expect(result).toEqual({
    //           config: { found: true },
    //           filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    //         });
    //       },
    //     ]);
    //   }
    // );
    //
    testSyncAndAsync('finds JS file in first searched dir', sync => () => {
      temp.createFile(
        'a/b/c/d/e/f/foo.config.js',
        'module.exports = { found: true };'
      );

      const readFileSpy = spyOnReadFile(sync);
      const startDir = temp.absolutePath('a/b/c/d/e/f');

      expect.hasAssertions();
      return testFuncsRunner(sync, search(sync, startDir), [
        result => {
          // console.log(readFileSpy.mock.calls)
          util.assertSearchSequence(readFileSpy, temp.dir, [
            'a/b/c/d/e/f/package.json',
            'a/b/c/d/e/f/.foorc',
            'a/b/c/d/e/f/foo.config.js',
          ]);

          expect(result).toEqual({
            config: { found: true },
            filepath: temp.absolutePath('a/b/c/d/e/f/foo.config.js'),
          });
        },
      ]);
    });
    //
    // testSyncAndAsync(
    //   'finds JS ES Modules file in first searched dir',
    //   sync => () => {
    //     temp.createFile(
    //       'a/b/c/d/e/f/foo.config.js',
    //       `Object.defineProperty(exports, '__esModule',{value: true});
    //        const config={found:true};exports.default=config;`
    //     );
    //
    //     const readFileSpy = spyOnReadFile(sync);
    //     const startDir = temp.absolutePath('a/b/c/d/e/f');
    //
    //     expect.hasAssertions();
    //     return testFuncsRunner(sync, search(sync, startDir), [
    //       result => {
    //         util.assertSearchSequence(readFileSpy, temp.dir, [
    //           'a/b/c/d/e/f/package.json',
    //           'a/b/c/d/e/f/.foorc',
    //           'a/b/c/d/e/f/foo.config.js',
    //         ]);
    //
    //         expect(result).toEqual({
    //           config: { found: true },
    //           filepath: temp.absolutePath('a/b/c/d/e/f/foo.config.js'),
    //         });
    //       },
    //     ]);
    //   }
    // );
    //
    // testSyncAndAsync(
    //   'finds package.json in second dir searched, with alternate names',
    //   sync => () => {
    //     temp.createFile(
    //       'a/b/c/d/e/package.json',
    //       '{ "heeha": { "found": true } }'
    //     );
    //
    //     const readFileSpy = spyOnReadFile(sync);
    //     const startDir = temp.absolutePath('a/b/c/d/e/f');
    //
    //     expect.hasAssertions();
    //     return testFuncsRunner(
    //       sync,
    //       cosmiconfig('foo', {
    //         rc: '.wowza',
    //         js: 'wowzaConfig.js',
    //         packageProp: 'heeha',
    //         stopDir: temp.absolutePath('.'),
    //         sync,
    //       }).search(startDir),
    //       [
    //         result => {
    //           util.assertSearchSequence(readFileSpy, temp.dir, [
    //             'a/b/c/d/e/f/package.json',
    //             'a/b/c/d/e/f/.wowza',
    //             'a/b/c/d/e/f/wowzaConfig.js',
    //             'a/b/c/d/e/package.json',
    //           ]);
    //
    //           expect(result).toEqual({
    //             config: { found: true },
    //             filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    //           });
    //         },
    //       ]
    //     );
    //   }
    // );
    //
    // testSyncAndAsync(
    //   'finds rc file in third searched dir, skipping packageProp, with rcStrictJson',
    //   sync => () => {
    //     temp.createFile('a/b/c/d/.foorc', '{ "found": true }');
    //
    //     const readFileSpy = spyOnReadFile(sync);
    //     const startDir = temp.absolutePath('a/b/c/d/e/f');
    //
    //     expect.hasAssertions();
    //     return testFuncsRunner(
    //       sync,
    //       cosmiconfig('foo', {
    //         packageProp: false,
    //         rcStrictJson: true,
    //         stopDir: temp.absolutePath('.'),
    //         sync,
    //       }).search(startDir),
    //       [
    //         result => {
    //           util.assertSearchSequence(readFileSpy, temp.dir, [
    //             'a/b/c/d/e/f/.foorc',
    //             'a/b/c/d/e/f/foo.config.js',
    //             'a/b/c/d/e/.foorc',
    //             'a/b/c/d/e/foo.config.js',
    //             'a/b/c/d/.foorc',
    //           ]);
    //
    //           expect(result).toEqual({
    //             config: { found: true },
    //             filepath: temp.absolutePath('a/b/c/d/.foorc'),
    //           });
    //         },
    //       ]
    //     );
    //   }
    // );
    //
    // testSyncAndAsync(
    //   'finds rc file in third searched dir, skipping packageProp, with rcStrictJson',
    //   sync => () => {
    //     temp.createFile(
    //       'a/b/c/d/e/package.json',
    //       '{ "author": "Todd", "foo": { "found": true } }'
    //     );
    //
    //     const readFileSpy = spyOnReadFile(sync);
    //     const startDir = temp.absolutePath('a/b/c/d/e/f');
    //
    //     expect.hasAssertions();
    //     return testFuncsRunner(
    //       sync,
    //       cosmiconfig('foo', {
    //         js: false,
    //         rc: false,
    //         stopDir: temp.absolutePath('.'),
    //         sync,
    //       }).search(startDir),
    //       [
    //         result => {
    //           util.assertSearchSequence(readFileSpy, temp.dir, [
    //             'a/b/c/d/e/f/package.json',
    //             'a/b/c/d/e/package.json',
    //           ]);
    //
    //           expect(result).toEqual({
    //             config: { found: true },
    //             filepath: temp.absolutePath('a/b/c/d/e/package.json'),
    //           });
    //         },
    //       ]
    //     );
    //   }
    // );
    //
    // testSyncAndAsync('finds JS file traversing from cwd', sync => () => {
    //   const originalCwd = process.cwd;
    //   expect.hasAssertions();
    //
    //   temp.createFile(
    //     'a/b/c/d/e/foo.config.js',
    //     'module.exports = { found: true };'
    //   );
    //
    //   try {
    //     const readFileSpy = spyOnReadFile(sync);
    //     process.cwd = jest.fn(() => temp.absolutePath('a/b/c/d/e/f'));
    //
    //     return testFuncsRunner(sync, search(sync), [
    //       result => {
    //         util.assertSearchSequence(readFileSpy, temp.dir, [
    //           'a/b/c/d/e/f/package.json',
    //           'a/b/c/d/e/f/.foorc',
    //           'a/b/c/d/e/f/foo.config.js',
    //           'a/b/c/d/e/package.json',
    //           'a/b/c/d/e/.foorc',
    //           'a/b/c/d/e/foo.config.js',
    //         ]);
    //
    //         expect(result).toEqual({
    //           config: { found: true },
    //           filepath: temp.absolutePath('a/b/c/d/e/foo.config.js'),
    //         });
    //       },
    //     ]);
    //   } finally {
    //     process.cwd = originalCwd;
    //   }
    // });

    // RC file with specified extension
    describe.skip('with rcExtensions', () => {
      const search = (sync, startDir) =>
        cosmiconfig('foo', {
          stopDir: temp.absolutePath('.'),
          rcExtensions: true,
          sync,
        }).search(startDir);

      testSyncAndAsync(
        'finds .foorc.json in second searched dir',
        sync => () => {
          temp.createFile('a/b/c/d/e/.foorc.json', '{ "found": true }');

          const readFileSpy = spyOnReadFile(sync);
          const startDir = temp.absolutePath('a/b/c/d/e/f');

          expect.hasAssertions();
          return testFuncsRunner(sync, search(sync, startDir), [
            result => {
              util.assertSearchSequence(readFileSpy, temp.dir, [
                'a/b/c/d/e/f/package.json',
                'a/b/c/d/e/f/.foorc',
                'a/b/c/d/e/f/.foorc.json',
                'a/b/c/d/e/f/.foorc.yaml',
                'a/b/c/d/e/f/.foorc.yml',
                'a/b/c/d/e/f/.foorc.js',
                'a/b/c/d/e/f/foo.config.js',
                'a/b/c/d/e/package.json',
                'a/b/c/d/e/.foorc',
                'a/b/c/d/e/.foorc.json',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: temp.absolutePath('a/b/c/d/e/.foorc.json'),
              });
            },
          ]);
        }
      );

      testSyncAndAsync(
        'finds .foorc.yaml in first searched dir',
        sync => () => {
          temp.createFile('a/b/c/d/e/f/.foorc.yaml', 'found: true');

          const readFileSpy = spyOnReadFile(sync);
          const startDir = temp.absolutePath('a/b/c/d/e/f');

          expect.hasAssertions();
          return testFuncsRunner(sync, search(sync, startDir), [
            result => {
              util.assertSearchSequence(readFileSpy, temp.dir, [
                'a/b/c/d/e/f/package.json',
                'a/b/c/d/e/f/.foorc',
                'a/b/c/d/e/f/.foorc.json',
                'a/b/c/d/e/f/.foorc.yaml',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yaml'),
              });
            },
          ]);
        }
      );

      testSyncAndAsync(
        'finds .foorc.yaml in first searched dir',
        sync => () => {
          temp.createFile('a/b/c/d/e/f/.foorc.yml', 'found: true');

          const readFileSpy = spyOnReadFile(sync);
          const startDir = temp.absolutePath('a/b/c/d/e/f');

          expect.hasAssertions();
          return testFuncsRunner(sync, search(sync, startDir), [
            result => {
              util.assertSearchSequence(readFileSpy, temp.dir, [
                'a/b/c/d/e/f/package.json',
                'a/b/c/d/e/f/.foorc',
                'a/b/c/d/e/f/.foorc.json',
                'a/b/c/d/e/f/.foorc.yaml',
                'a/b/c/d/e/f/.foorc.yml',
              ]);

              expect(result).toEqual({
                config: { found: true },
                filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.yml'),
              });
            },
          ]);
        }
      );

      testSyncAndAsync('finds .foorc.js in first searched dir', sync => () => {
        temp.createFile(
          'a/b/c/d/e/f/.foorc.js',
          'module.exports = { found: true };'
        );
        const readFileSpy = spyOnReadFile(sync);
        const startDir = temp.absolutePath('a/b/c/d/e/f');

        expect.hasAssertions();
        return testFuncsRunner(sync, search(sync, startDir), [
          result => {
            util.assertSearchSequence(readFileSpy, temp.dir, [
              'a/b/c/d/e/f/package.json',
              'a/b/c/d/e/f/.foorc',
              'a/b/c/d/e/f/.foorc.json',
              'a/b/c/d/e/f/.foorc.yaml',
              'a/b/c/d/e/f/.foorc.yml',
              'a/b/c/d/e/f/.foorc.js',
            ]);

            expect(result).toEqual({
              config: { found: true },
              filepath: temp.absolutePath('a/b/c/d/e/f/.foorc.js'),
            });
          },
        ]);
      });
    });
  });
});
