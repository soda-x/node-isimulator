import exec from 'sync-exec';
import log from 'spm-log';

import { join } from 'path';

const runExec = (cmd, fname, cb) => {
  const { stdout, stderr } = exec(cmd);
  if (stderr) {
    log.error('simulator:error', `error by running ${cmd} ${stderr}, use doctor to check it out`);

    process.exit(-1);
  }
  if (stdout) {
    if (!cb) {
      return '';
    } 

    return cb(stdout);
  } else {
    log.error(`simulator:${fname}`, `${cmd} have no stdout`);

    process.exit(-1);
  }
};

export function getXcodePath() {
  const cmd = 'xcode-select -p';

  return runExec(cmd, 'getXcodePath', (stdout) => {
    return stdout.replace('\n', '');
  });
}

export function getXcodeVersion(xcodePath) {
  const pathOfXcode = xcodePath || getXcodePath();
  const xcodebuildPath = join(pathOfXcode, '/usr/bin/xcodebuild');
  const cmd = `${xcodebuildPath} -version`;

  return runExec(cmd, 'getXcodeVersion', (stdout) => {
    return stdout.replace('\n', '').match(/^.*Xcode (.+)$/im)[1];;
  });
}

export function getMacVersion() {
  const cmd = 'sw_vers -productVersion';

  return runExec(cmd, 'getMacVersion', (stdout) => {
    return stdout.replace('\n', '');
  });
}

export function getRuntime(version) {
  const cmd = 'xcrun simctl list runtimes';

  return runExec(cmd, 'getRuntime', (stdout) => {
    let result = {
      runtimes: [],
      runtime: '',
    };
    result = stdout.split('\n').reduce((prevResult, runtime) => {
      // only use available and iOS runtime
      if (!/unavailable/i.test(runtime) && /iOS/i.test(runtime)) {
        if (version) {
          const regx = new RegExp(version, 'i');
          if (regx.test(runtime)) {
            prevResult.runtime = runtime.match(/\((com\.apple.+)\)/i)[1];
          }
        }
        prevResult.runtimes.push(runtime);
      }

      return prevResult;
    }, result);
    // if not exist specified runtime then exit
    if (!result.runtime && version) {
      log.error('simulator:error', `missed iOS ${version} SDK, pre-install this SDK by Xcode`);

      process.exit(-1);
    }
    else if (!version)  {
      // not specified then use latest runtime
      const latestRuntime = result.runtimes[result.runtimes.length - 1];
      result.runtime = latestRuntime.match(/\((com\.apple.+)\)/i)[1];
    }

    return result.runtime;
  });
};

export function getOS(os) {
  let  osHandled = os;
  // if specified 
  if (osHandled) {
    if (osHandled.indexOf('.') > -1) {
       osHandled = os.replace('.', '-')
    }
    const runtime = getRuntime(osHandled);
    if (!runtime) {
      log.error('simulator:error', `missed iOS ${os} SDK, pre-install this SDK by Xcode`);

      process.exit(-1);
    }    
  } else {
    // get latest sdk version
    osHandled = getRuntime().match(/^com\.apple\.CoreSimulator\.SimRuntime\.iOS-(.+)$/im)[1];
  }


  return osHandled;
};

export function findSimulators(prefix, simulatorName) {
  const cmd = 'xcrun simctl list devices';
  
  return runExec(cmd, 'findSimulators', (stdout) => {
    let matchedSims;
    let regx = new RegExp(`${prefix}sim--.*?--.*?$`, 'igm');
    if(simulatorName && regx.test(simulatorName)){
      regx = new RegExp(`${simulatorName}.*?$`, 'igm');
    }
    matchedSims = stdout.match(regx);
    if (matchedSims) {
      const itemRegx = new RegExp(`^(${prefix}sim--(.*?)--(.*?))\\s+\\((.*?)\\)\\s+\\((.*?)\\)$`, 'i');
      matchedSims = matchedSims.reduce((prevMatched, simulator) => {
        const info = simulator.match(itemRegx);
        const name = info[1];
        const device = info[2];
        const os = info[3];
        const sid = info[4];
        const status = info[5];
        prevMatched.push(
          {
            name,
            device,
            os,
            sid,
            status,
          }
        );
      }, []);
    } else {
      matchedSims = [];
    }

    return matchedSims;
  });
};

export function createSimulator(prefix, device, os, runtime) {
  const cmd = `xcrun simctl create ${prefix}sim--${device}--${os} com.apple.CoreSimulator.SimDeviceType.${device} ${runtime}`;

  return runExec(cmd, (stdout) => {
    return stdout.replace('\n', '');
  });
}