import { join } from 'path';

import test from 'ava';

import { simUtil } from '../src/index';

const testAppPath = join(__dirname, 'app/test.app');

const simOpts = {
  sdk: '',
  udid: '',
  sim: '',
};

test.before(async () => {
  simOpts.sdk = await simUtil.getLatestSDK();
  simOpts.udid = await simUtil.createDevice('test_node_isimulator', 'iPhone 6', simOpts.sdk);
  simOpts.sim = await simUtil.getSimulator(simOpts.udid);
  await simOpts.sim.run();
});

test.after(async () => {
  await simUtil.killAllSimulators();
  await simUtil.deleteDevice(simOpts.udid);
});

test.serial('util - getBootedDeviceString - should get expect object', async (t) => {
  const bootedDeviceString = await simUtil.getBootedDeviceString();
  const expects = {
    [`${simOpts.udid}`]: {
      name: 'test_node_isimulator',
      udid: simOpts.udid,
      state: 'Booted',
      sdk: simOpts.sdk,
    },
  };
  t.deepEqual(bootedDeviceString, expects);
});

test.serial('util - isInstalledAppNamed - should return false', async (t) => {
  const is = await simUtil.isInstalledAppNamed(simOpts.udid, 'pigcan.test');
  t.false(is);
});

test.serial('util - isInstalledAppNamed - should return true', async (t) => {
  await simUtil.installApp(simOpts.udid, testAppPath);
  const is = await simUtil.isInstalledAppNamed(simOpts.udid, 'pigcan.test');
  t.true(is);
});

test.serial('util - getUdidBySimName - should equal to test_node_isimulator', async (t) => {
  const udid = await simUtil.getUdidBySimName('test_node_isimulator');
  let isMatched = false;
  if (udid.indexOf(simOpts.udid) > -1) {
    isMatched = true;
  }
  t.true(isMatched);
});

