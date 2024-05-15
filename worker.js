import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';

import fs from 'fs';
// import path from 'path';

const { ObjectId } = require('mongodb');
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  // validation
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db
    .collection('files')
    .findOne({ _id: new ObjectId(fileId), userId });

  if (!file) {
    throw new Error('File not found');
  }
  // Generate thumbnails
  // first check if file is image
  if (file.type === 'image') {
    const sizes = [500, 250, 100];
    const thumbnailPromises = sizes.map(async (size) => {
      const thumbnail = await imageThumbnail(file.localPath, { width: size });
      const thumbnailPath = `${file.localPath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
      return { size, path: thumbnailPath };
    });
    try {
      // wait for all thumbnails to be generated
      const thumbnails = await Promise.all(thumbnailPromises);
      console.log('Thumbnails generated:', thumbnails);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      throw error;
    }
  }
  // processsing complete
  done();
});
fileQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
