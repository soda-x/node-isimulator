import expect from 'expect';
import { join } from 'path';

import start from '../src/index';

const fixDir = join(__dirname, 'fixtures');
const expDir = join(__dirname, 'expect');

describe('node-isimulator', () => {
  before(done => {
    //process.chdir(fixDir);
    done();
  });

  after(done => {
    done();
  });

  it('start', done => {
    start({prefix:'ns'});
    done();
  })
});