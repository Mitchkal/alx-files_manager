import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(_req, res) {
    const redisIsAlive = redisClient.isAlive();
    const dbIsAlive = await dbClient.isAlive();
    res.status(200).json({ redis: redisIsAlive, db: dbIsAlive });
  }

  static async getStats(_req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.status(200).json({ users, files });
  }
}

module.exports = AppController;
