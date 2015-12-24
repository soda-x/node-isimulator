/**
 * Created by pigcan(xuanji.jw@taobao.com) on 7/7/15.
 * simulator
 */

'use strict';

require('colorful').colorful();

//var co =  require('co');
var exec = require('co-exec');
var log = require('spm-log');
var sleep = require('co-sleep');
var fs = require('co-fs-extra');
var spin = require('io-spin');
var thunkify = require('thunkify');
var Download = require('download');
var path = require('path');
var join = require('path').join;
var os = require('os');
var tmp = os.tmpdir();

function  IOSSim(options) {
  log.config(options);
  this.prefix = options.prefix || 'ns';
  this.application = options.application || 'mobilesafari';
  this.os = options.os || '';
  this.device = options.device || 'iPhone-6';
  this.appPath = options.appPath || join(tmp, 'ns');
  this.downloadURL = options.downloadURL || '';
  this.scheme = options.scheme || 'http://m.google.com';
  this.sid = '';
  this.macVersion = '';
  this.xcodeVersion = '';
  this.xcodePath = '';
}

//exports.IOSSim =  co.wrap(function* (prefix, application, device, os, instance) {
//  return yield  IOSSim(prefix, application, device, os).bind(instance);
//});

module.exports = IOSSim;

IOSSim.setupOS = function * (self){
  var runtime = yield self.getRuntime(self.os);
  var os = self.os || runtime.match(/^com\.apple\.CoreSimulator\.SimRuntime\.iOS-(.+)$/im)[1];
  self.os = os;
};

IOSSim.setupEnv = function * (self){
  var xcodePath = yield exec('xcode-select -p');
  xcodePath = xcodePath.replace('\n','');

  log.debug('XcodePath', xcodePath);
  self.xcodePath = xcodePath;

  var versionInfo = yield exec(join(xcodePath,'/usr/bin/xcodebuild') + ' -version');
  var xcodeVersionInfo = versionInfo.match(/^.*Xcode (.+)$/im)[1];
  var macVersion = yield exec('sw_vers -productVersion');
  macVersion = macVersion.replace('\n','');

  log.debug('Xcode', xcodeVersionInfo);
  self.xcodeVersion = xcodeVersionInfo;

  log.debug('Mac', macVersion);
  self.macVersion = macVersion;
};

IOSSim.prototype.start = function * (url, cb) {
  yield IOSSim.setupEnv(this);
  yield IOSSim.setupOS(this);
  var simulatorName = this.prefix + 'sim--' + this.device + '--' + this.os;
  yield this.launchSimulator(simulatorName);

  if(this.application === 'mobilesafari'){
    console.log('Loading the page....\n');
    cb && cb(this.sid);
    spin.start('Loading', 'Spin2');
    yield sleep(5000);
    yield exec('xcrun simctl openurl booted ' + url);
    spin.stop();
    console.log();
    console.log(('  \u2714  All done !').to.green.color);
  } else{
    yield this.downloadAPP(this.sid, this.appPath, this.downloadURL);
    console.log('Loading the page....\n');
    cb && cb(this.sid);
    spin.start('Loading', 'Spin2');
    yield sleep(5000);
    yield this.launchAPP();
    spin.stop();
  }

};

IOSSim.prototype.isAnyDeviceBooted = function * () {
  var isAnyDeviceBooted = false;
  var sid;
  var bootedDevices = [];
  log.debug('info', 'Finding all  simulators which is booted.......');
  var simulators = yield this.findSimulators();
  if (simulators && simulators.length) {
    //检查是否有已经booted的sim
    simulators.forEach(function (s) {
      if ((/booted/i).test(s.status)) {
        sid = s.sid;
        isAnyDeviceBooted = true;
        bootedDevices.push(s);
      }
    });
  }

  return [isAnyDeviceBooted, bootedDevices];
};


IOSSim.prototype.isCurrentSimulatorTheSimulatorNeededToOpen = function *() {
  var res = yield  this.isAnyDeviceBooted();

  //var isBooted = res[0];
  var isTheSimulatorNeededToOpen = false;
  var currentSid = this.sid;
  for (var i = res[1].length - 1; i >= 0; i--) {
    if (res[1][i].sid === currentSid) isTheSimulatorNeededToOpen = true;
  }

  return [res, isTheSimulatorNeededToOpen];
};

IOSSim.prototype.launchSimulator = function * (name) {
  var sid;
  var simulatorName = name || this.prefix + 'sim--' + this.device + '--' + this.os;

  log.debug('info', 'Checking is installed ' + simulatorName);

  var simulators = yield this.findSimulators(simulatorName);

  if (simulators && simulators.length) {
    //已经安装，则获取sid
    log.debug('info', 'Had been installed');
    sid = simulators[0].sid;
  } else {
    //未安装则创建一个
    log.debug('info', 'Have not been installed a simulator named ' + simulatorName + ' then try to create it');
    sid = yield this.createSimulator();
  }
  log.debug('info', 'Try to open simulator');
  this.sid = sid;
  var res = yield this.isCurrentSimulatorTheSimulatorNeededToOpen();
  if (!res[1]) {
    yield this.killSimulator();
    yield this.openSimulator(sid);
  } else {
    console.log(('  \u2714  Successfully use the current simulator ' + sid).to.green.color);
    log.debug('info', 'use the current opened simulator');
  }
};

IOSSim.prototype.openSimulator = function * (sid) {
  try {
    var xcodePath = this.xcodePath;
    var appPath = xcodePath;
    log.debug('launch simulator', 'Finally launch simulator');
    if (this.macVersion.match('10.11') !== null || this.xcodeVersion.match('7.') !== null){
      appPath = appPath + '/Applications/Simulator.app';
    } else {
      appPath = appPath + '/Applications/iOS Simulator.app';
    }
    yield exec('open ' + appPath + ' --args -CurrentDeviceUDID ' + sid);
    log.debug('open', 'open ' + appPath + ' --args -CurrentDeviceUDID ' + sid);
    console.log();
    console.log(('  \u2714  Successfully launched the simulator ' + sid).to.green.color);
  } catch (err) {
    console.log();
    console.log(('  \u2716  Exception: launch Simulator').to.red.color, err);
    //log.debug('warn', 'Run xcrun instruments -w udid always got err');
    process.exit(-1);
  }

  //downloadPortal(null, cb);
};

IOSSim.prototype.endAllSimulatorDaemons = function * () {
  var patterns = ['com.apple.iphonesimulator', 'com.apple.CoreSimulator'];
  for(var pattern in patterns) {
    var launchCtlCommand = 'launchctl list | grep ' + pattern + ' | cut -f 3 | xargs -n 1 launchctl';
    var stopCommand = launchCtlCommand + ' stop';
    var removeCommand = launchCtlCommand + ' remove';
    console.log(stopCommand, removeCommand);
    try {
      yield exec(launchCtlCommand);
    } catch(err) {
      log.warn('Could not stop ' + pattern + ' daemons, carrying on anyway!');
    }
    try {
      yield exec(removeCommand);
    } catch(err) {
      log.warn('Could not remove ' + pattern + ' daemons, carrying on anyway!');
    }
  }
};

IOSSim.prototype.killSimulator = function * () {
  try {
    //yield this.endAllSimulatorDaemons();
    log.debug('info', 'Try to open simulator first need to check is any launched simulator app');

    // var res = yield  this.isAnyDeviceBooted();

    //var isBooted = bootedDevice[0];


    var grepOpenedSimulatorApp = yield exec('ps -ax | grep -E "iOS Simulator|Simulator"');
    var matchedApp = grepOpenedSimulatorApp.match(/^.+\/Applications\/Xcode.+((iOS\s+Simulator)|Simulator.+)$/igm);
    var isOpenedSimulatorApp =   matchedApp  && matchedApp.length >= 1 ? true : false;

    //log.debug('info', 'Is any booted devices ' + isBooted + ' Is any launched simulator app ' + isOpenedSimulatorApp);
    log.debug('info', ' Is any launched simulator app ' + isOpenedSimulatorApp);

    //if(isBooted){
    //  log.debug('info', 'Try to shutdown booted simulators');
    //  yield  exec('xcrun simctl shutdown booted');
    //}

    if (isOpenedSimulatorApp) {
      //if (isBooted === false && isOpenedSimulatorApp === true) {
      //  log.warn('warn', ':( your simulator needs some rest, please try several seconds later');
      //  process.exit(-1);
      //} else {
      log.debug('info', 'Try to quit simulator app');
      if (this.macVersion.match('10.11') !== null || this.xcodeVersion.match('7.') !== null){
        log.debug('info', 'use killall Simulator');
        yield exec('pkill -9 -f "Simulator"');
      } else {
        log.debug('info', 'use killall iOS Simulator');
        yield exec('pkill -9 -f  "iOS Simulator"');
      }
      //}

    }

  } catch (err) {
    console.log();
    console.log(('  \u2716  Exception: kill Simulator').to.red.color);
    log.debug('error', err + '\n' + err.stack);
    process.exit(-1);
  }
};

IOSSim.prototype.createSimulator = function * (rt) {

  var runtime = rt || (yield this.getRuntime(this.os));

  try {
    //目前暂时先不处理设备与os关系这一层. 例如:iPhone6 不能使用 7.1 这个runtime的.
    var stdout = yield exec('xcrun simctl create "' + this.prefix + 'sim--"' + this.device + '--' + this.os +' com.apple.CoreSimulator.SimDeviceType.' + this.device + ' ' + runtime);

    console.log();
    console.log(('  \u2714  Successfully create ' + stdout.replace(/\n/ig, '')).to.green.color);
    return stdout;

  } catch (err) {
    console.log();
    console.log('  \u2716  Exception: devlopment enviroment, use doctor to check it out. Or maybe OS version and device is not matched'.to.red.color);
    log.debug('error', err + '\n' + err.stack);
    process.exit(-1);
  }
};

IOSSim.prototype.removeSimulator = function * (simulatorName) {
  if (!!simulatorName){
    var simulators = yield this.findSimulators();
    if (simulators && simulators.length) {
      var isExisted = false;
      for (var i = 0; i < simulators.length; i++) {
        if (simulators[i].name === simulatorName) {
          isExisted = true;
          try {
            yield exec('xcrun simctl delete ' + simulators[i].sid);
            log.debug('info', 'Deleted simulator ' + simulators[i].name + ' ' + simulators[i].sid +' successfully');
          } catch (err) {
            console.log();
            console.log('  \u2716  Exception: devlopment enviroment, use doctor to check it out. Or maybe OS version and device is not matched'.to.red.color);
            log.debug('error', err + '\n' + err.stack);
            process.exit(-1);
          }
        }
      }
      if (!isExisted) {
        console.log();
        console.log(('  \u2716  Not existed specified simulator ' +this.prefix).to.yellow.color);
      }
    } else {
      console.log();
      console.log(('  \u2716  Not existed any '+ this.prefix + ' simulator').to.yellow.color);
    }
  } else {
    console.log();
    console.log(('  \u2716  Missing required parameter (simulatorName) ex: '+ this.prefix +'sim--iPhone-6--8.1').to.yellow.color);
  }
};


IOSSim.prototype.getRuntime = function * (version) {
  try {
    var stdout = yield exec('xcrun simctl list runtimes');

    var runtimes = stdout.match(/^iOS.*\d\.\d.*$/gm);

    var runtime;

    if (version) {
      for (var i = 0; i < runtimes.length; i++) {
        var rex = new RegExp(version, 'g');
        if (rex.test(runtimes[i])) {
          runtime = runtimes[i];
          break;
        }
      }
    } else {
      runtime = runtimes[runtimes.length - 1];
    }
    if (!runtime) {
      console.log();
      console.log(('  \u2716  Missed iOS ' + version + ' SDK, pre-install this SDK by Xcode please.').to.red.color);
      process.exit(-1);
    } else {
      runtime = runtime.match(/\((com\.apple.+)\)/i)[1];
    }
    console.log();
    log.debug('info', 'Use runtime - ' + runtime);
    return runtime;
  } catch (err) {
    console.log();
    console.log('  \u2716  Exception: devlopment enviroment, use doctor to check it out'.to.red.color);
    log.debug('error', err + '\n' + err.stack);
    process.exit(-1);
  }
};

IOSSim.prototype.downloadAPP = function * (sid, appLocalPath, appOnlineURL, cb){
  var baseName = path.basename(appLocalPath);
  if (!(fs.existsSync(appLocalPath))) {

    log.info('info', ('Downloading ' + appOnlineURL + ' to ' + appLocalPath).to.yellow.color);
    spin.start('Downloading', 'Spin2');

    var download = new Download({ extract: true, strip: 1, mode: '755' })
      .get(appOnlineURL)
      .dest(appLocalPath);
    var runError = false;
    var run = thunkify(function(y){
      download.run(function(err){
        spin.stop();
        if (err) {
          runError = true;
          console.log();
          console.log('  \u2716  Exception: an error was encountered processing the command to download the app'.to.red.color);
        }else{
          console.log();
          console.log(('  \u2714  Successfully download ' + baseName).to.green.color);
          y && y();
        }
      });
    });
    yield run();

    if (!runError) {
      yield  this.installAPP(sid, appLocalPath, baseName);
      cb && cb();
    }
  } else {
    console.log();
    console.log(('  \u2714  Already successfully downloaded ' + baseName).to.green.color);
    yield  this.installAPP(sid, appLocalPath, baseName);
    cb && cb();
  }

};

var findAppInSim = function * (sid, appName){
  try {
    var stdout = yield exec('find ~/Library/Developer/CoreSimulator/Devices/' + sid + ' -name ' + appName + '.app');
    log.debug('info', '\nfind ~/Library/Developer/CoreSimulator/Devices/' + sid + ' -name ' + appName + '.app --- ' + stdout);
    return stdout;
  } catch(err) {
    console.log();
    console.log('  \u2716  Exception: an error was encountered processing the command to find the app in sim'.to.red.color);
    log.debug('error', err + '\n' + err.stack);
    process.exit(-1);
  }
};

IOSSim.prototype.installAPP = function * (sid, appPath, appName) {

  log.debug('info', '\nsid: ' + sid + '\nappPath: ' + appPath + '\nappName: ' + appName);
  var isInstalledApp = (yield findAppInSim(sid, appName)).length > 0 ? true : false;
  if (!isInstalledApp){
    try {
      yield exec('xcrun simctl install booted ' + appPath);
      console.log();
      console.log(('  \u2714  Successfully installed ' + appName).to.green.color);
    } catch (err) {
      console.log();
      console.log(('  \u2716  Exception: failed to install the ' + appName).to.red.color);
      log.debug('error', err + '\n' + err.stack);
      process.exit(-1);
    }
  }

};

IOSSim.prototype.launchAPP = function * () {

  try {
    console.log('xcrun simctl openurl booted "' + this.scheme +'"');
    yield exec('xcrun simctl openurl booted "' + this.scheme + '"');
    console.log();
    console.log(('  \u2714  All done !').to.green.color);
  } catch (err) {
    console.log();
    console.log('\u2716  Exception: launch app failed'.to.red.color);
    log.debug('error', err + '\n' + err.stack);
  }
};

IOSSim.prototype.findSimulators = function * (simulatorName) {

  try {
    var stdout = yield exec('xcrun simctl list devices');
    var rex = new RegExp(this.prefix+'sim--.*?--.*?$', 'igm');
    if(simulatorName && rex.test(simulatorName)){
      rex = new RegExp(simulatorName + '.*?$', 'igm');
    }
    var matchedSims = stdout.match(rex);

    if (matchedSims) {
      var simulators = [];
      var itemRex = new RegExp('^(' + this.prefix + 'sim--(.*?)--(.*?))\\s+\\((.*?)\\)\\s+\\((.*?)\\)$', 'i');
      matchedSims.forEach(function (simulator) {
        var info = simulator.match(itemRex);
        log.debug('info', 'Find simulators matched info ' + info[0]);
        var name = info[1];
        var device = info[2];
        var os = info[3];
        var sid = info[4];
        var status = info[5];
        simulators.push(
          {
            name: name,
            device: device,
            os: os,
            sid: sid,
            status: status
          }
        );
      }.bind(this));
      return simulators;
    } else {
      return [];
    }
  } catch (err) {
    console.log();
    console.log('  \u2716  Exception: xcrun simctl list devices'.to.red.color);
    log.debug('error', err + '\n' + err.stack);
    process.exit(-1);
  }
};