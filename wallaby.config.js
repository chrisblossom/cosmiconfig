module.exports = wallaby => {
  return {
    files: [
      'src/**/*.js',
      'test/**/*.snap',
      {
        pattern: 'test/**/*',
        instrument: false,
      },
      '!test/**/*.test.js',
    ],

    tests: [
      'test/**/*.test.js',
      // 'test/successful-directories.test.js'
      // 'test/failed-directories.test.js'
      // 'test/failed-files.test.js'
      // 'test/successful-files.test.js'
      // 'test/caches.test.js'
      // 'test/funcRunner.test.js'
      // 'test/index.test.js'
      // 'test/resolveDir.test.js'
    ],

    compilers: {
      '**/*.js': wallaby.compilers.babel(),
    },

    env: {
      type: 'node',
      runner: 'node',
    },

    testFramework: 'jest',

    setup(w) {
      /**
       * https://github.com/wallabyjs/public/issues/1268#issuecomment-323237993
       */
      if (w.projectCacheDir !== process.cwd()) {
        process.chdir(w.projectCacheDir);
      }

      process.env.NODE_ENV = 'test';
      const jestConfig = require('./package.json').jest;

      // Tried this, didn't work
      // jestConfig.transform = {
      //   "^.+\\.jsx?$": "babel-jest"
      // };

      jestConfig.collectCoverage = false;
      delete jestConfig.coverageThreshold;
      delete jestConfig.collectCoverageFrom;
      w.testFramework.configure(jestConfig);
    },
  };
};
