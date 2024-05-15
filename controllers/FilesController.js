/* eslint-disable object-curly-newline */
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // eslint-disable-next-line
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    let parent;
    if (parentId !== 0) {
      parent = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      console.log(`parent: ${parent}`);
      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    let localPath = null;
    if (type !== 'folder') {
      const folderPath = process.env.Folder_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      localPath = path.join(folderPath, uuidv4());
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, buffer);
    }
    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    };
    const result = await dbClient.db.collection('files').insertOne(newFile);
    newFile._id = result.insertedId;
    return res.status(201).json(newFile);
  }

  static async getShow(req, res) {
    // const { name, userId} req.params
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    let file;

    try {
      file = await dbClient.db
        .collections('files')
        .findOne({ _id: new ObjectId(fileId), userId });
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { parentId = 0, page = 0 } = req.query;
    const perPage = 20;
    const skip = perPage * page;
    // console.log(`checked parent Id is ${parentId}, userId is ${userId}`);

    const pipeline = [
      { $match: { userId, parentId } },
      { $skip: skip },
      { $limit: perPage },
    ];
    try {
      const file = await dbClient.db
        .collection('files')
        .aggregate(pipeline)
        .toArray();

      return res.status(200).json(file);
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: 'Intenal Server Error' });
    }
  }
}
module.exports = FilesController;
