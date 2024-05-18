/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
import dbClient from '../../utils/db';

const { expect } = require('chai');

describe('test the mongo db Client', () => {
  it('should connect to the mongodb server', async () => {
    const isAlive = await dbClient.isAlive();
    expect(isAlive).to.be(true);
  });

  it('should retrieve the number of users in database', async () => {
    const nbUsers = await dbClient.nbUsers();
    expect(typeof nbUsers).to.be('number');
  });

  it('should retrieve the number of files in the dtatbase', async () => {
    const nbFiles = await dbClient.nbFiles();
    expect(typeof nbFiles).to.be('number');
  });
});
