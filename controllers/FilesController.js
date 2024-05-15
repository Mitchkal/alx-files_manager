/* eslint-disable object-curly-newline */
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import formatFile from '../utils/format';

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
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    console.log(`the userId is ${userId}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;

    let file;

    try {
      file = await dbClient.db
        .collection('files')
        .findOne({ _id: new ObjectId(fileId), userId });
    } catch (error) {
      console.log('error:', error);
      return res.status(404).json({ error: 'Not found' });
    }
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(formatFile(file));
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

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    let file;
    try {
      file = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(fileId), userId });
    } catch (error) {
      console.error('Error finding file:', error);
      return res.status(500).json({ error: 'Internal server Error' });
    }
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    try {
      await dbClient.db
        .collection('files')
        .updateOne({ _id: new ObjectId(fileId) }, { $set: { isPublic: true } });
      file.isPublic = true;
      return res.status(200).json(formatFile(file));
    } catch (error) {
      console.error('Error updating file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    let file;
    try {
      file = await dbClient.db
        .collection('files')
        .findOne({ _id: new ObjectId(fileId), userId });
    } catch (error) {
      console.error('Error finding file:', error);
      return res.status(500).json({ error: 'Internal server Error' });
    }
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    try {
      await dbClient.db
        .collection('files')
        .updateOne(
          { _id: new ObjectId(fileId) },
          { $set: { isPublic: false } },
        );
      file.isPublic = false;
      return res.status(200).json(formatFile(file));
    } catch (error) {
      console.error('Error updating file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;
    const { size } = req.query;

    let file;
    try {
      file = await dbClient.db
        .collection('files')
        .findOne({ _id: new ObjectId(fileId) });
    } catch (error) {
      console.error('Error finding file:', error);
      return res.status(404).json({ error: 'Not found' });
    }
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!file.isPublic) {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId || userId !== file.userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (size) {
      const validSizes = ['500', '250', '100'];
      if (!validSizes.includes(size)) {
        return res.status(400).json({ error: 'Invalid size parameter' });
      }
    }
    // check if file exists locally
    if (!fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    // set mime type
    const mimeType = mime.lookup(file.name) || 'application/octet-stream';

    fs.readFile(
      size ? `${file.localPath}_${size}` : file.localPath,
      (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.setHeader('Content-Type', mimeType);
        return res.status(200).send(data);
      },
    );
  }
}
module.exports = FilesController;
