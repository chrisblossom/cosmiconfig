'use strict';

const path = require('path');
const fsReal = require.requireActual('fs');
const del = require('del');
const makeDir = require('make-dir');
const createTempDir = require('tempy').directory;

const cosmiconfig = require('../src');

const absolutePath = (exports.absolutePath = str => path.join(__dirname, str));

exports.TempDir = class TempDir {
  constructor() {
    this.dir = createTempDir();
    this.createDir = this.createDir.bind(this);
    this.createFile = this.createFile.bind(this);
    this.absolutePath = this.absolutePath.bind(this);
    this.clean = this.clean.bind(this);
    this.remove = this.remove.bind(this);
  }

  createDir(dir) {
    const dirname = this.absolutePath(dir);
    makeDir.sync(dirname);
  }

  createFile(file, contents) {
    const filePath = this.absolutePath(file);
    const fileDir = path.parse(filePath).dir;
    makeDir.sync(fileDir);
    fsReal.writeFileSync(filePath, contents);
  }

  absolutePath(dir) {
    return path.join(this.dir, dir);
  }

  clean() {
    const cleanPattern = this.absolutePath('**/*');
    del.sync(cleanPattern, {
      force: true,
      dot: true,
    });
  }

  remove() {
    del.sync(this.dir, { force: true, dot: true });
  }
};

exports.configFileLoader = function configFileLoader(options, file) {
  const load = cosmiconfig(null, options).load;
  return load(absolutePath(file));
};

const chainFuncsSync = (result, func) => func(result);
const chainFuncsAsync = (result, func) => result.then(func);

exports.testFuncsRunner = (sync, init, funcs) =>
  funcs.reduce(sync === true ? chainFuncsSync : chainFuncsAsync, init);

/**
 * A utility function to run a given test in both sync and async.
 *
 * @param {string} name
 * @param {Function} testFn
 */
exports.testSyncAndAsync = function testSyncAndAsync(name, testFn) {
  describe('sync', () => {
    it(name, testFn(true));
  });

  describe('async', () => {
    it(name, testFn(false));
  });
};

exports.assertSearchSequence = function assertSearchSequence(
  readFileSpy,
  dirname,
  searchPaths,
  startCount
) {
  startCount = startCount || 0;

  expect(readFileSpy).toHaveBeenCalledTimes(searchPaths.length + startCount);

  searchPaths.forEach((searchPath, idx) => {
    expect(readFileSpy.mock.calls[idx + startCount][0]).toBe(
      path.join(dirname, searchPath)
    );
  });
};

exports.spyOnReadFile = function spyOnReadFile(sync) {
  const fs = require('fs');
  if (sync === true) {
    return jest.spyOn(fs, 'readFileSync');
  } else {
    return jest.spyOn(fs, 'readFile');
  }
};

exports.spyOnStat = function spyOnStat(sync) {
  const fs = require('fs');
  if (sync === true) {
    return jest.spyOn(fs, 'statSync');
  } else {
    return jest.spyOn(fs, 'stat');
  }
};
