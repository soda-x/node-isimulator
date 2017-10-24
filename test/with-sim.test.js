import test from 'ava';
import getAppPath from 'sample-apps';
import { simUtil } from '../src/index';

const simOpts = {
  sdk: '',
  udid: '',
  sim: '',
};

test.before(async () => {
  await simUtil.killAllSimulators();
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
  const is = await simUtil.isInstalledAppNamed(simOpts.udid, 'io.appium.TestApp');
  t.false(is);
});

test.serial('util - isInstalledAppNamed - should return true', async (t) => {
  console.log('!!!!', simOpts.udid,getAppPath('TestApp'));
  await simUtil.installApp(simOpts.udid, getAppPath('TestApp'));
  const is = await simUtil.isInstalledAppNamed(simOpts.udid, 'io.appium.TestApp');
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

