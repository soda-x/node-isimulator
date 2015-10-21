#!/usr/bin/env node --harmony

'use strict';

require('colorful').colorful();

var program = require('commander');
var join = require('path').join;
var log = require('spm-log');
var os = require('os');
var tmp = os.tmpdir();
var co = require('co');
var IOSSim = require('./index');


program
  .version(require('./package').version, '-v, --version')
  .option('--prefix [prefix]', 'simulator prefix, defualt: ns')
  .option('--application [application]', 'open which application in simulator, defualt: mobilesafari')
  .option('--os [os]', 'specify simulator SDK version, defualt: latest sdk in local')
  .option('--device [device]', 'device type, defualt: iPhone-6')
  .option('--download-url <downloadURL>', '.app file online download address')
  .option('--app-path [appPath]', '.app file saved local path, defualt: path/to/tmpdir/ns')
  .option('--scheme [scheme]', 'app scheme, ex. http://m.alipay.com  taobao://m.taobao.com/?url=xxxx')
  .option('--simdoctor', 'simulator doctor')
  .option('--verbose', 'show more logging');



program.parse(process.argv);

log.config(program);


if(program.simdoctor){
  var IOSChecker = require('./doctor').IOSChecker;
  var isMac = process.platform === 'darwin';
  if (!isMac) {
    log.warn('iOS Checks cannot be run on Windows.');
    console.log();
    process.exit(-1);
  }
  var iosChecker = new IOSChecker();
  log.info('Running iOS Checks');
  console.log();
  co(function *(){
    try {
      yield iosChecker.runAllChecks.bind(iosChecker)();
      console.log();
      console.log('  \u2714  '.to.green.color,'All Checks Were Done.');
    } catch(e) {
      console.error('error',e);
      process.exit(-1);
    }
  }).then(function() {
  }, function(err) {
    log.error('error', err.message);
  });

  return;
}

var options = {
  prefix: program.prefix || 'ns',
  application: program.application || 'mobilesafari',
  os: program.os || '',
  device: program.device || 'iPhone-6',
  downloadURL: program.downloadUrl || '',
  appPath: program.appPath || join(tmp, 'ns'),
  scheme: program.scheme || 'http://m.baidu.com'
};

var sim  = new IOSSim(options);


co(sim.start(options.scheme, function(){

})).then(function() {
}, function(err) {
  log.error('error', err.message);
});