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
        .findOne({ _id: new ObjectId(parentId) });
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
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
}
module.exports = FilesController;
