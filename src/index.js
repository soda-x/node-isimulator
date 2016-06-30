import {
  getSimulator,
  killAllSimulators,
  getBootedDeviceString,
  isInstalledAppNamed,
  getLatestSDK,
  downAppFromUrl,
  getUdidBySimName,
  openUrl,
  launch,
  installApp,
  createDevice,
  isURL,
  chalkError,
  chalkInfo,
} from './util';

export * as simUtil from './util';

export function open(udid, identifier) {
  if (isURL(identifier)) return openUrl(udid, identifier);

  return launch(udid, identifier, 5);
}

export async function installAppFromLocalOrUrl(udid, appPath) {
  if (!appPath || typeof appPath !== 'string') {
    console.error(chalkError(`${appPath} should be a nonemptry string.`));

    return;
  }

  const path = appPath.trim();
  let finalInstallPath = path;
  try {
    if (isURL(path)) {
      finalInstallPath = await downAppFromUrl(path);
    }
    await installApp(udid, finalInstallPath);
  } catch (err) {
    throw new Error(err);
  }
}

const defaultOpts = {
  prefix: 'ns',
  sdk: '',
  device: 'iPhone 6',
  application: 'mobilesafari',
  bundleId: '',
  downloadURL: '',
  scheme: '',
};

const normalizeOpts = async options => {
  const opts = { ...defaultOpts, ...options };
  opts.prefix = opts.prefix || 'ns';
  opts.application = opts.application || 'mobilesafari';
  let sdk = opts.os || opts.sdk || await getLatestSDK();
  sdk = sdk.indexOf('-') > -1 ? sdk.replace(/\-/g, '.') : sdk;
  opts.sdk = sdk;
  let device = opts.device || 'iPhone 6';
  device = device.indexOf('-') > -1 ? sdk.replace(/\-/g, ' ') : device;
  opts.device = device;

  return opts;
};

const start = async function start(options) {
  try {
    const opts = await normalizeOpts(options);
    const sdkNormalizeString = opts.sdk.replace(/\./g, '-');
    const deviceNormalizeString = opts.device.replace(/\s/g, '-');
    const simulatorName = `${opts.prefix}sim--${deviceNormalizeString}--${sdkNormalizeString}`;
    // 1st check is existed named simulator
    const udidArr = await getUdidBySimName(simulatorName);
    let udid;
    if (!udidArr.length) {
      // create it
      console.log(chalkInfo(`node-isimulator: ${simulatorName} is not existed before, create it.`));
      udid = await createDevice(simulatorName, opts.device, opts.sdk);
    } else {
      // default use first one / todo: let user choose
      udid = udidArr[0];
    }

    // 2nd check whether the asked simulator is the booted device or not
    // on the premise of only one device booted at the same time
    const sim = await getSimulator(udid);
    const bootedString = await getBootedDeviceString();
    const bootedUdids = Object.keys(bootedString);
    // no device booted
    if (!bootedUdids.length) {
      await sim.run();
    }
    // should killallsim and rerun
    if (bootedUdids.length && bootedUdids.indexOf(udid) < 0) {
      await killAllSimulators();
      await sim.run();
    }

    // 3rd check what the simulator should open and whether installed before

    if (opts.application !== 'mobilesafari') {
      const isInstallBefore = await isInstalledAppNamed(udid, opts.bundleId);
      if (!isInstallBefore) {
        await installAppFromLocalOrUrl(udid, opts.downloadURL);
      }
    }

    opts.scheme && await open(udid, opts.scheme);
  } catch (e) {
    console.error(chalkError(`node-isimulator: failed ${e}`));
  }
};

export default start;
