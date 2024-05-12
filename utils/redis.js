/* eslint-disable no-return-await */
const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err}`);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    return await getAsync(key);
  }

  async set(key, value, duration) {
    const setAsync = promisify(this.client.setex).bind(this.client);
    return await setAsync(key, duration, value);
  }

  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    return await delAsync(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
