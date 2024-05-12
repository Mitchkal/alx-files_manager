import { v4 as uuidv4 } from 'uuid';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const sha1 = require('sha1');

class AuthController {
  static async connect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // eslint-disable-next-line new-cap
    const auth = new Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':');
    const email = auth[0];
    const password = auth[1];
    const hashedPassword = sha1(password);

    const user = await dbClient.client.db
      .collections('users')
      .findOne({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user.id.toString(), 86400);
    return res.status(200).json({ token });
  }
}

module.exports = AuthController;
