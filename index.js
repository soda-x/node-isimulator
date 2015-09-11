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
var path = require('path');
var fs = require('co-fs-extra');
var spin = require('io-spin');
var thunkify = require('thunkify');
var Download = require('download');

function  IOSSim(prefix, application, device, os, appPath, downloadURL, bundleId, scheme, appId) {
  this.prefix = prefix || 'spider';
  this.application = application || 'mobilesafari';
  this.os = os;
  this.device = device || 'iPhone-6';
  this.appPath = appPath;
  this.downloadURL = downloadURL;
  this.bundleId = bundleId;
  this.scheme = scheme;
  this.appId = appId;
  this.sid = '';
}

//exports.IOSSim =  co.wrap(function* (prefix, application, device, os, instance) {
//  return yield  IOSSim(prefix, application, device, os).bind(instance);
//});

exports.IOSSim = IOSSim;

IOSSim.setup = function * (self){
  var runtime = yield self.getRuntime(self.os);
  var os = self.os || runtime.match(/^com\.apple\.CoreSimulator\.SimRuntime\.iOS-(.+)$/im)[1];
  self.os = os;
  return os;
};

IOSSim.prototype.start = function * (url, cb) {
  var os = yield IOSSim.setup(this);
  var simulatorName = this.prefix + 'sim--' + this.device + '--' + os;
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
  yield this.openSimulator(sid);


  //(!APVER && isBooted) ? launchPortal(did) : launchSim(did, function () {
  //  launchPortal(did);
  //});
};

IOSSim.prototype.openSimulator = function * (sid, cb) {
  try {

    yield this.killSimulator();
    log.debug('info', 'Finally xcrun instruments -w ' + sid);
    // not sure why use blow command always gets err
    yield exec('xcrun instruments -w ' + sid);
    console.log();
    console.log(('  \u2714  Successfully launched the simulator ' + sid).to.green.color);
    cb && cb();
  } catch (err) {
    console.log();
    console.log(('  \u2714  Successfully launched the simulator ' + sid).to.green.color);
    cb && cb();
    log.debug('warn', 'Run xcrun instruments -w udid always got err');
    //process.exit(-1);
  }

  //downloadPortal(null, cb);
};

IOSSim.prototype.killSimulator = function * () {
  try {
    log.debug('info', 'Try to open simulator first need to check is any booted devices, then check is any launched simulator app');
    // 如此做的原因是, 很可能模拟器退出了但是模拟器的状态却为booted
    // The reason why always need to check booted or launched is the simulator maybe booted while the simulator app is not launched
    var res = yield  this.isAnyDeviceBooted();
    var isBooted = res[0];
    //var bootedDevice = isBooted ? res[1] : 0;
    var grepOpenedSimulatorApp = yield exec('ps -ax | grep "iOS Simulator"');
    var matchedApp = grepOpenedSimulatorApp.match(/^.+\/Applications\/Xcode.+((iOS\s+Simulator)|Simulator.+)$/igm);

    var isOpenedSimulatorApp =   matchedApp  && matchedApp.length >= 1 ? true : false;

    log.debug('info', 'Is any booted devices ' + isBooted + ' Is any launched simulator app ' + isOpenedSimulatorApp);

    if(isBooted){
      log.debug('info', 'Try to shutdown booted simulators');
      yield  exec('xcrun simctl shutdown booted');
    }

    if(isOpenedSimulatorApp){
      log.debug('info', 'Try to quit simulator app');
      var macVersion = yield exec('sw_vers -productVersion');
      if (macVersion.match('10.11') !== null){
        log.debug('info', 'Mac os version is  10.11, use killall Simulator');
        yield exec('killall "Simulator"');
      } else {
        log.debug('info', 'Mac os version is under 10.11, use killall iOS Simulator');
        yield exec('killall "iOS Simulator"');
      }
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
  //if (IS_ROOT) {
  //  console.log('ERROR: 请勿使用sudo命令执行！\r\n'.red);
  //  return;
  //}
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
    log.debug('warn', '\u2716  Exception: launch app failed');
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