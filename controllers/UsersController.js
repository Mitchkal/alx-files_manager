import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// const { ObjectId } = require('mongodb');
const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
// import { v4 as uuidv4 } from 'uuid';

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const existingUser = await dbClient.db
      .collection('users')
      .findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);

    const newUser = {
      email,
      password: hashedPassword,
    };
    // const newUser = JSON.parse(user);

    try {
      const result = await dbClient.db.collection('users').insertOne(newUser);
      const { _id } = result.ops[0];
      return res.status(201).json({ id: _id, email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db
      .collection('users')
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

module.exports = UserController;
