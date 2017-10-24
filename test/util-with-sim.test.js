import { join } from 'path';

import test from 'ava';

import start, { simUtil } from '../src/index';

const testAppPath = join(__dirname, 'app/test.app');

const simOpts = {
  udid: '',
};

test.after(async () => {
  await simUtil.killAllSimulators();
  await simUtil.deleteDevice(simOpts.udid);
});

test.serial('node-isimulator - util with sim', async (t) => {
  simOpts.udid = await start({
    application: 'test',
    scheme: 'pigcan.test',
    downloadURL: testAppPath,
  });
  t.true(true);
});