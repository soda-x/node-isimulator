import test from 'ava';
import rimraf from 'rimraf';
import { join } from 'path';
import { simUtil } from '../src/index';


test('util - isExistedADir - /x/y should return false', (t) => {
  const is = simUtil.isExistedADir('/x/y');
  t.false(is);
});

test('util - isExistedADir - /Users/ should return true', (t) => {
  const is = simUtil.isExistedADir('/Users/');
  t.true(is);
});

test('util - isURL - com.x.x should return false', (t) => {
  const isurl = simUtil.isURL('com.x.x');
  t.false(isurl);
});

test('util - isURL - http://x.x.x should return true', (t) => {
  const isurl = simUtil.isURL('http://x.x.x');
  t.true(isurl);
});

test('util - isScheme - tb://xxxx/xxx should return true', (t) => {
  const isScheme = simUtil.isScheme('tb://xxxx/xxx');
  t.true(isScheme);
});

test('util - getLatestSDK - should return a number', async (t) => {
  const sdk = await simUtil.getLatestSDK();
  t.true(typeof parseFloat(sdk) === 'number');
});

test('util - downAppFromUrl - should return a string', async (t) => {
  const url = 'https://os.alipayobjects.com/rmsportal/xNZitsNJqdFZngl.zip';
  const localPath1 = await simUtil.downAppFromUrl(url);
  const localPath2 = await simUtil.downAppFromUrl(url);
  t.true(typeof localPath1 === 'string');
  t.true(typeof localPath2 === 'string');
  t.true(typeof localPath2 === 'string');
  rimraf.sync(join(localPath1, '../'));
});
