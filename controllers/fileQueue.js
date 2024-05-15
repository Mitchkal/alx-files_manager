const Bull = require('bull');

const fileQueue = new Bull('fileQueue');

export default fileQueue;
