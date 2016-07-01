import { getDevices } from 'node-simctl';
import asyncjs from 'async';
import { parseFile as rawParsePlist } from 'bplist-parser';
import exec from 'sync-exec';

import download from 'download';
import chalk from 'chalk';

export const chalkError = chalk.red;
export const chalkInfo = chalk.green;
export const chalkWarning = chalk.yellow;
export const chalkProcessing = chalk.blue;

import { join, basename } from 'path';
import { statSync } from 'fs';
import { tmpdir } from 'os';
import { parse } from 'url';

export function isExistedADir(path) {
  let isDirectory;
  try {
    if (statSync(path).isDirectory()) {
      isDirectory = true;
    } else {
      isDirectory = false;
    }
  } catch (err) {
    isDirectory = false;
  }

  return isDirectory;
}

export function isURL(string) {
  const matcher = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/;

  return matcher.test(string);
}

// return local path ex: /tmpDir/simulator/xxxxx
export async function downAppFromUrl(url) {
  // try to cache
  const tmpDir = tmpdir();
  // /ftp/x/y/z.app.zip => ftp_x_y_z.app.zip
  let pathname = parse(url).pathname;
  const filename = basename(pathname);
  pathname = pathname.slice(1).replace(/\//g, '_');
  const appDownloadLocalPathname = join(tmpDir, 'simulator', pathname);

  return new Promise((resolve, reject) => {
    if (!isExistedADir(appDownloadLocalPathname)) {
      console.log(chalkInfo(`node-isimulator: try to downloaded ${filename}`));
      console.log(chalkProcessing(`node-isimulator: downloading ${filename} ...`));
      const downloadOpts = {
        extract: true,
        strip: 0,
        mode: '755',
      };
      // download then install from local path
      download(url, appDownloadLocalPathname, downloadOpts).then((outputs) => {
        console.log(chalkInfo(`node-isimulator: success downloaded ${filename}`));
        const decomporessName = outputs[0].path;
        resolve(join(appDownloadLocalPathname, decomporessName));
      }, (err) => {
        console.error(chalkError(`node-isimulator: failed to download ${filename} ${err}`));
        reject(`failed to download ${filename} ${err}`);
      });
    } else {
      const cmd = `ls ${appDownloadLocalPathname}`;
      const result = exec(cmd);
      if (result.stderr) {
        reject(new Error(`ls ${appDownloadLocalPathname}`));

        return;
      }
      if (result.stdout === '') {
        console.log(chalkWarning(`node-isimulator: downloaded ${filename} is broken, try again.`));
        reject(new Error(`ls ${appDownloadLocalPathname}`));
        const rmDir = join(appDownloadLocalPathname, '../');
        exec(`rm -rf ${rmDir}`);

        return;
      }
      console.log(chalkInfo(`node-isimulator: already downloaded ${filename}`));
      const decompressFilename = result.stdout.trim().split('\n')[0];
      resolve(join(appDownloadLocalPathname, decompressFilename, '/'));
    }
  });
}

// {
//   'C09B34E5-7DCB-442E-B79C-AB6BC0357417': {
//     name: 'iPhone 4s',
//     sdk: '9.2'
//     state: 'Booted',
//   },
// }
export async function getBootedDeviceString() {
  const devices = await getDevices();

  return Object.keys(devices).reduce((bootedList, sdk) => {
    const bootedDevices = devices[sdk].reduce((preBootedDevice, deviceString) => {
      const _deviceString = deviceString;
      const boot = {};
      if (_deviceString.state === 'Booted') {
        _deviceString.sdk = sdk;
        boot[`${_deviceString.udid}`] = { ...{}, ..._deviceString };
      }

      return { ...preBootedDevice, ...boot };
    }, {});

    return { ...bootedList, ...bootedDevices };
  }, {});
}

const parsePlist = file => new Promise((resolve, reject) => {
  rawParsePlist(file, (err, obj) => {
    if (err) {
      reject(new Error(`Unable to parse Info.plist: ${err}`));
    }
    resolve(obj);
  });
});

export async function isInstalledAppNamed(udid, bundleId) {
  const cmd = `find ~/Library/Developer/CoreSimulator/Devices/${udid}/data/Containers/Bundle/Application/ -d 3 -iname Info.plist`;
  const result = exec(cmd);

  return new Promise((resolve, reject) => {
    if (result.stderr) {
      reject(new Error(`Unable to exec find Info.plist: ${result.stderr}`));

      return;
    }
    if (result.stdout === '') {
      resolve(false);

      return;
    }
    asyncjs.some(result.stdout.trim().split('\n'), async (i, cb) => {
      let listObj;
      try {
        listObj = await parsePlist(i);
      } catch (err) {
        reject(err);

        return;
      }
      if (listObj[0].CFBundleIdentifier === bundleId) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    }, (err, rst) => {
      if (err) reject(err);
      resolve(rst);
    });
  });
}

export async function getLatestSDK() {
  const devices = await getDevices();

  return Object.keys(devices).sort().reverse()[0];
}

export async function getUdidBySimName(simName) {
  const devices = await getDevices();

  return Object.keys(devices).reduce((matchedList, sdk) => {
    const mDevices = devices[sdk].reduce((preMatchedDevice, deviceString) => {
      if (deviceString.name === simName) {
        preMatchedDevice.push(deviceString.udid);
      }

      return preMatchedDevice;
    }, []);

    return matchedList.concat(mDevices);
  }, []);
}

export {
  getSimulator,
  killAllSimulators,
  endAllSimulatorDaemons,
} from 'appium-ios-simulator';

export {
  removeApp,
  createDevice,
  deleteDevice,
  getDevices,
  openUrl,
  launch,
  installApp,
} from 'node-simctl';
