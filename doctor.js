/**
 * Created by pigcan on 7/2/15.
 * https://github.com/appium/appium/blob/master/lib/doctor/ios.js
 */

'use strict';

require('colorful').colorful();

//var path = require('path');
var fs = require('fs');
//var co =  require('co');
var exec = require('co-exec');
var log = require('spm-log');
var thunkify = require('thunkify');
var inquirer = require('inquirer');

function IOSChecker() {
  this.osVersion = null;
}
exports.IOSChecker = IOSChecker;

IOSChecker.prototype.runAllChecks = function *() {
  yield this.getMacOSXVersion.bind(this)();
  yield this.checkForXcode.bind(this)();
  yield this.checkForXcodeCommandLineTools.bind(this)();
};

IOSChecker.prototype.getMacOSXVersion = function * () {
  try {
    var version = yield exec('sw_vers -productVersion');
    if (version.match('10.8') !== null) {
      this.osVersion = '10.8';
      console.log('  \u2714  '.to.green.color,'Mac OS X 10.8 is installed.');
    } else if (version.match('10.9') !== null) {
      this.osVersion = '10.9';
      console.log('  \u2714  '.to.green.color,'Mac OS X 10.9 is installed.');
    } else if ((version.match('10.10') !== null) || (version.match('10.10.1') !== null)) {
      this.osVersion = '10.10';
      console.log('  \u2714  '.to.green.color,'Mac OS X 10.10 is installed.');
    } else {
      console.log('  \u2716   Could not detect Mac OS X Version.'.to.red.color);
      process.exit(-1);
    }
  } catch(e) {
    console.log(('  \u2716   Unknown SW Version Command: ' + e).to.red.color);
    process.exit(-1);
  }

};

function iq(callback) {
  inquirer.prompt([{
    type: 'comfirm',
    message: 'Do You Want To Install Xcode?',
    name: 'noXcode',
    default: 'y/n'
  }], function (answers) {
    var isNeedDwonload = answers.noXcode;
    if (isNeedDwonload.match('y|Y')) {
      callback();
    }else{
      process.exit(-1);
    }
  });
}

IOSChecker.prototype.checkForXcode = function * () {
  var self = this;
  try {
    var stdout = yield exec('xcode-select --print-path', { maxBuffer: 524288});
    var xcodePath = stdout.replace('\n', '');
    if (fs.existsSync(xcodePath)) {
      console.log('  \u2714  '.to.green.color,'Xcode is installed at ' + xcodePath);
    } else {
      console.log('  \u2716   Xcode is not installed.'.to.red.color);
      var _iq = thunkify(iq);
      yield _iq();
      yield self.installAboutXcode.bind(self)();

    }
  } catch(e) {
    log.error('xcode-select', e);
    process.exit(-1);
  }
};

function iq2(callback) {
  inquirer.prompt([{
    type: 'comfirm',
    message: 'Do You Want To Install Xcode Command Line Tools?',
    name: 'noXcodeCommandLine',
    default: 'y/n'
  }], function (answers) {
    var isNeedDwonload = answers.noXcodeCommandLine;
    if (isNeedDwonload.match('y|Y')) {
      callback();
    }else{
      process.exit(-1);
    }
  });
}
IOSChecker.prototype.checkForXcodeCommandLineTools = function * () {
  var self = this;
  var pkgName = this.osVersion === '10.8' ? 'com.apple.pkg.DeveloperToolsCLI' : 'com.apple.pkg.CLTools_Executables';
  try {
    var stdout = yield  exec('pkgutil --pkg-info=' + pkgName, { maxBuffer: 524288});
    var match = stdout.match(/install-time/);
    if (match !== null) {
      console.log('  \u2714  '.to.green.color,'Xcode Command Line Tools Are Installed.');
    } else {
      console.log('  \u2716   Xcode Command Line Tools Are NOT Installed'.to.red.color);
      var _iq = thunkify(iq2);
      yield _iq();
      yield self.installAboutXcode.bind(self)();
    }
  } catch(e) {
    log.error('pkgutil --pkg-info= ' + pkgName + ' ' + e);
    process.exit(-1);
  }
};


IOSChecker.prototype.installAboutXcode = function * () {
  try {
    yield exec('xcode-select --install', { maxBuffer: 524288});
  } catch(e) {
    log.error('xcode-select --install ' + e);
    process.exit(-1);
  }
};

