/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
import redisClient from '../../utils/redis';

const { expect } = require('chai');

describe('test the redisClient', () => {
  it('should connect to the redis server', async () => {
    const isAlive = await redisClient.isAlive();
    expect(isAlive).to.be(true);
  });

  it('should return the correct test value afeter setting', async () => {
    await redisClient.set('test_key', 'test_value');
    const value = await redisClient.get('test_key');
    expect(value).to.be('test_value');
  });

  it('should delete the values correctly', async () => {
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).to.be.null();
  });
});
