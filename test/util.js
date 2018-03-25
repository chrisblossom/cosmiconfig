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
    this.getSpyPathCalls = this.getSpyPathCalls.bind(this);
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

  getSpyPathCalls(spy) {
    const calls = spy.mock.calls;

    const result = calls.map(searchPath => {
      const pathname = searchPath[0];

      return path.relative(this.dir, pathname);
    });

    return result;
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
