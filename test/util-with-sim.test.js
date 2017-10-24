import test from 'ava';
import getAppPath from 'sample-apps';
import start, { simUtil } from '../src/index';

const simOpts = {
  udid: '',
};

test.after(async () => {
  await simUtil.killAllSimulators();
  await simUtil.deleteDevice(simOpts.udid);
});

test('node-isimulator - util with sim', async () => {
  simOpts.udid = await start({
    application: 'TestApp',
    scheme: 'io.appium.TestApp',
    downloadURL: getAppPath('TestApp'),
  });
});