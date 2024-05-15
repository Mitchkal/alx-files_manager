const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  static async getStatus(_req, res) {
    const redisIsAlive = await redisClient.isAlive();
    const dbIsAlive = await dbClient.isAlive();
    res.status(200).json({ redis: redisIsAlive, db: dbIsAlive });
  }

  static async getStats(_req, res) {
    const users = dbClient.nbUsers();
    const files = dbClient.nbFiles();
    res.status(200).json({ users, files });
  }
}

module.exports = AppController;
