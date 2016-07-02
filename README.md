# node-isimulator

[![NPM version](https://img.shields.io/npm/v/node-isimulator.svg?style=flat)](https://www.npmjs.com/package/node-isimulator) [![Build Status](https://img.shields.io/travis/pigcan/node-isimulator.svg?style=flat)](https://travis-ci.org/node-isimulator) [![Coverage Status](https://coveralls.io/repos/github/pigcan/node-isimulator/badge.svg?branch=master)](https://coveralls.io/github/pigcan/node-isimulator?branch=master) [![NPM downloads](http://img.shields.io/npm/dm/node-isimulator.svg?style=flat)](https://npmjs.com/package/node-isimulator) [![Dependency Status](https://david-dm.org/pigcan/node-isimulator.svg)](https://david-dm.org/pigcan/node-isimulator)

Use node.js to control iOS simulator

---

## Install

```bash
$ npm install node-isimulator --S
```

## Usage

```js
import start, { simUtil } from 'node-isimulator';
```

### start - `async` function - return udid

```js
await start(options);
```

#### Configuration - default of start option

```js
{
  prefix: 'ns',
  sdk: '',
  device: 'iPhone 6',
  application: 'mobilesafari',
  bundleId: '',
  downloadURL: '',
  scheme: '',
}
```

`prefix`: prefix of simulator name, e.g. ${prefix}sim--${device}-${sdk} => nssim--iPhone-6--9-2 

`sdk`: runtime version, defualt latest 

`device`: device type, defualt iPhone 6. e.g. iPhone 5s / iPhone 6s Plus

`application`: device should open which application, defualt mobilesafari. e.g. yourAppName

`bundleId`: application bundleId

`downloadURL`: application's path, it could be a url or relative/absolute path.

`scheme`: application's scheme. e.g. http://domain.com / taobao://xxxx / alipay://xxxx

### simUtil - simulator util object

`simUtil.chalkError`: eroor log util. e.g. console.log(simUtil.chalkError('error'));

`simUtil.chalkInfo`: info log util. e.g. console.log(simUtil.chalkInfo('info'));

`simUtil.chalkWarning`: warning log util. e.g. console.log(simUtil.chalkWarning('warning'));

`simUtil.chalkProcessing`: processing log util. e.g. console.log(simUtil.chalkProcessing('process'));


-----

`simUtil.isExistedADir(string)`: is existed a dir named ${name}. e.g. simUtil.isExistedADir('xx'), return true or false.

`simUtil.isURL(string)`: is url or not. return true or false. e.g. http://m.x.com

`simUtil.isScheme(string)`: is scheme or not. return true or false. tb://xxxx/xxxx

`simUtil.downAppFromUrl(url)`: `async func` download `zip` file from internet then decompress in local tmp path and return the local tmp path.

`simUtil.getBootedDeviceString()`: `async func` get booted devicestring. e.g.
```js
{
  'C09B34E5-7DCB-442E-B79C-AB6BC0357417': {
    name: 'iPhone 4s',
    sdk: '9.2'
    state: 'Booted',
  },
}
```

`simUtil.isInstalledAppNamed(udid, bundleId)`: `async func` check the device which udid is ${udid} is installed an application which bundleId is ${bundleId}, return true or false.

`simUtil.getLatestSDK()`: `async func` get the latest sdk. e.g. 9.3

`simUtil.getUdidBySimName(string)`: `async func` get device udid named ${string}

----

from [appium-ios-simulator](https://github.com/appium/appium-ios-simulator)

`simUtil.getSimulator(udid)`: `async func` [read](https://github.com/appium/appium-ios-simulator/blob/master/README.md)

`simUtil.killAllSimulators()`: `async func` [read](https://github.com/appium/appium-ios-simulator/blob/master/README.md)

`simUtil.endAllSimulatorDaemons()`: `async func` [read](https://github.com/appium/appium-ios-simulator/blob/master/README.md)

from [node-simctl](https://github.com/appium/node-simctl)

`simUtil.removeApp(udid, bundleId)`: `async func` [read](https://github.com/appium/node-simctl/blob/master/README.md)

`simUtil.createDevice(name, deviceType, runtime)`: `async func` [read](https://github.com/appium/node-simctl/blob/master/README.md)

`simUtil.deleteDevice(udid)`: `async func` [read](https://github.com/appium/node-simctl/blob/master/README.md)

`simUtil.getDevices()`: `async func` [read](https://github.com/appium/node-simctl/blob/master/README.md)

`simUtil.openUrl(udid, url)`: `async func` [read](https://github.com/appium/node-simctl/blob/master/README.md)

`simUtil.launch(udid, bundleId)`: `async func` [read](https://github.com/appium/node-simctl/blob/master/README.md)

`simUtil.installApp(udid, appPath)`: `async func` [read](https://github.com/appium/node-simctl/blob/master/README.md)

## LISENCE

Copyright (c) 2016-2114 pigcan. Licensed under the MIT license.
