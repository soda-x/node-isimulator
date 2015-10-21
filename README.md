# node-isimulator

Use node.js to control iOS simulator ,  of course you can use it for automatically debugging webpage 


---

## Install

```bash
$ npm install node-isimulator -g
```

## Let your imagination run away , here are two showcases.

* Debugging in simulator with mobilesafari

* Debugging in simulator with your custom app


## Usage_1

```
  Usage: ns [options]

  Options:

    -h, --help                    output usage information
    -v, --version                 output the version number
    --prefix [prefix]             simulator prefix, defualt: ns
    --application [application]   open which application in simulator, defualt: mobilesafari
    --os [os]                     specify simulator SDK version, defualt: latest sdk in local
    --device [device]             device type, defualt: iPhone-6
    --download-url <downloadURL>  .app file online download address
    --app-path [appPath]          .app file saved local path, default: path/to/tmpdir/ns
    --scheme [scheme]             app scheme ex. http://m.alipay.com  taobao://m.taobao.com/?url=xxxx
    --simdoctor                   simulator doctor
    --verbose                     show more logging
```

## Usage_2

```
  var co = require('co');
  var Sim = require('node-isulator');
  var options = {
    prefix: 'hello',
    application: 'mobilesafari',
    device: 'iPhone-6',
    os: '8.4',
    appPath: 'path/to/whatever/you/want/',
    downloadURL: '',
    scheme: 'http://m.google.com'
  }
  var sim  = new Sim(options);

  co(sim.start(options.scheme, function(){
    //xxx
  })).then(function() {

  }, function(err) {
    log.error('error', err.message);
  });

```

## LISENCE

Copyright (c) 2015-2114 pigcan. Licensed under the MIT license.
