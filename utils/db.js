/* eslint-disable no-return-await */
const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}`;
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.client.connect((err) => {
      if (!err) {
        // console.log('Connection to database succesful');
        this.db = this.client.db(database);
      } else {
        console.log('Connection to database failed:', err);
      }
    });
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    const userCollection = this.db.collection('users');
    return userCollection.countDocuments();
  }

  async nbFiles() {
    const filesCollection = this.db.collection('files');
    return filesCollection.countDocuments();
  }
}
const dbClient = new DBClient();

export default dbClient;
