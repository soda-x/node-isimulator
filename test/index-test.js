import expect from 'expect.js';
import getAppPath from 'sample-apps';
import rimraf from 'rimraf';
import { join } from 'path';
import start, { simUtil } from '../src/index';

describe('node-isimulator - util without sim', () => {
  it('util - isExistedADir - /x/y should return false', done => {
    const is = simUtil.isExistedADir('/x/y');
    expect(is).to.be(false);
    done();
  });

  it('util - isExistedADir - /Users/ should return true', done => {
    const is = simUtil.isExistedADir('/Users/');
    expect(is).to.be(true);
    done();
  });

  it('util - isURL - com.x.x should return false', done => {
    const isurl = simUtil.isURL('com.x.x');
    expect(isurl).to.be(false);
    done();
  });

  it('util - isURL - http://x.x.x should return true', done => {
    const isurl = simUtil.isURL('http://x.x.x');
    expect(isurl).to.be(true);
    done();
  });

  it('util - isScheme - tb://xxxx/xxx should return true', done => {
    const isScheme = simUtil.isScheme('tb://xxxx/xxx');
    expect(isScheme).to.be(true);
    done();
  });

  it('util - getLatestSDK - should return a number', async done => {
    try {
      const sdk = await simUtil.getLatestSDK();
      expect(parseFloat(sdk)).to.be.a('number');
      done();
    } catch (e) {
      done(e);
    }
  });

  it('util - downAppFromUrl - should return a string', async done => {
    try {
      const url = 'https://os.alipayobjects.com/rmsportal/xNZitsNJqdFZngl.zip';
      const localPath1 = await simUtil.downAppFromUrl(url);
      const localPath2 = await simUtil.downAppFromUrl(url);
      expect(localPath1).to.be.a('string');
      expect(localPath2).to.be.a('string');
      expect(localPath2).to.eql(localPath1);
      rimraf.sync(join(localPath1, '../'));
      done();
    } catch (e) {
      done(e);
    }
  });
});

describe('node-isimulator - util with sim', () => {
  const simOpts = {
    sdk: '',
    udid: '',
    sim: '',
  };
  before(async done => {
    try {
      await simUtil.killAllSimulators();
      simOpts.sdk = await simUtil.getLatestSDK();
      simOpts.udid = await simUtil.createDevice('test_node_isimulator', 'iPhone 6', simOpts.sdk);
      simOpts.sim = await simUtil.getSimulator(simOpts.udid);
      await simOpts.sim.run();
      done();
    } catch (e) {
      done(e);
    }
  });

  after(async done => {
    try {
      await simUtil.killAllSimulators();
      await simUtil.deleteDevice(simOpts.udid);
      done();
    } catch (e) {
      done(e);
    }
  });

  it('util - getBootedDeviceString - should get expect object', async done => {
    try {
      const bootedDeviceString = await simUtil.getBootedDeviceString();
      const expects = {
        [`${simOpts.udid}`]: {
          name: 'test_node_isimulator',
          udid: simOpts.udid,
          state: 'Booted',
          sdk: simOpts.sdk,
        },
      };
      expect(bootedDeviceString).to.eql(expects);
      done();
    } catch (e) {
      done(e);
    }
  });

  it('util - isInstalledAppNamed - should return false', async done => {
    try {
      const is = await simUtil.isInstalledAppNamed(simOpts.udid, 'io.appium.TestApp');
      expect(is).to.be(false);
      done();
    } catch (e) {
      done(e);
    }
  });

  it('util - isInstalledAppNamed - should return true', async done => {
    try {
      await simUtil.installApp(simOpts.udid, getAppPath('TestApp'));
      const is = await simUtil.isInstalledAppNamed(simOpts.udid, 'io.appium.TestApp');
      expect(is).to.be(true);
      done();
    } catch (e) {
      done(e);
    }
  });

  it('util - getUdidBySimName - should equal to test_node_isimulator', async done => {
    try {
      const udid = await simUtil.getUdidBySimName('test_node_isimulator');
      let isMatched = false;
      if (udid.indexOf(simOpts.udid) > -1) {
        isMatched = true;
      }
      expect(isMatched).to.eql(true);
      done();
    } catch (e) {
      done(e);
    }
  });
});

describe('node-isimulator - util with sim', () => {
  const simOpts = {
    udid: '',
  };
  after(async done => {
    try {
      await simUtil.killAllSimulators();
      await simUtil.deleteDevice(simOpts.udid);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('start', async done => {
    try {
      simOpts.udid = await start({
        application: 'TestApp',
        scheme: 'io.appium.TestApp',
        downloadURL: getAppPath('TestApp'),
      });
      done();
    } catch (e) {
      done(e);
    }
  });
});
