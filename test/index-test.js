import expect from 'expect';
import { join } from 'path';

import start from '../src/index';

describe('node-isimulator', () => {
  before(done => {
    done();
  });

  after(done => {
    done();
  });

  it('start', async done => {
    await start({scheme:'http://baidu.com'});
    done();
  });
});
