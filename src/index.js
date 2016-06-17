import {
  getXcodePath,
  getXcodeVersion,
  getMacVersion,
  getRuntime,
  getOS,
  findSimulators,
  createSimulator
} from './util';

import { tmpdir } from 'os';
import { join } from 'path';

const tmp = tmpdir();
let xcodePath;
let xcodeVersion;
let macVersion;
let osVersion;
let simulatorName;
let runtime;
let simId;

const launchSimulator = (prefix, simulatorName) => {
  let sid;
  const matchedSims = findSimulators(prefix, simulatorName);
  if (matchedSims.length) {
    sid = matchedSims[0].sid;
  } else {
    sid = createSimulator(prefix, device, os, runtime);
  }
}

const start = ({
  prefix = 'ns',
  application = '',
  os = getOS(),
  device = 'iPhone-6',
  appPath = join(tmp, 'ns'),
  downloadURL = '',
  scheme = 'https://www.npmjs.com/package/node-isimulator',
  sid = '',
} = {}) => {
  simId = sid;
  osVersion = os;
  macVersion = getMacVersion();
  xcodePath = getXcodePath();
  xcodeVersion = getXcodeVersion(xcodePath);
  runtime = getRuntime();

  simulatorName = `${prefix}sim--${device}--${os}`;
  console.log(prefix, application, osVersion, device, appPath, downloadURL, scheme, sid, macVersion, xcodeVersion, xcodePath)
  launchSimulator(prefix, simulatorName);
}

export default start;