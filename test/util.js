'use strict';

const fsReal = require.requireActual('fs');
const path = require('path');
const del = require('del');
const makeDir = require('make-dir');
const createTempDir = require('tempy').directory;

exports.absolutePath = str => path.join(__dirname, str);

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
