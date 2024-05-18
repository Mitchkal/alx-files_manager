/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
// eslint-disable-next-line import/no-extraneous-dependencies
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../server');

let token;

describe('get /connect', () => {
  it('should authenticate a user', async () => {
    const res = await request(app)
      .get('/connect')
      .auth('test@example.com', 'password123');
    expect(res.status).to.be(200);
    expect(res.body).to.have.property('token');
    token = res.body.token;
  });
});

describe('post /files', () => {
  it('should upload a new file', async () => {
    const res = await request(app)
      .post('/files')
      .set('x-token', token)
      .send({ name: 'test.txt', type: 'file', data: 'Hello, world!' });
    expect(res.status).to.be(201);
    expect(res.body).to.have.property('id');
  });
});

describe('get /files/:id', () => {
  it('should get a file by ID', async () => {
    const res = await request(app).get('/files/:id').set('x-token', token);
    expect(res.status).to.be(200);
    expect(res.body).to.have.property('id');
  });
});

describe('get /files', () => {
  it('should list files with pagination', async () => {
    const res = await request(app)
      .get('/files')
      .set('x-token', token)
      .query({ page: 1, pageSize: 10 });
    expect(res.status).to.be(200);
    expect(Array.isArray(res.body)).to.be(true);
  });
});

describe('put /files/:id/publish', () => {
  it('should publish a file', async () => {
    const res = await request(app)
      .put('/files/:id/publish')
      .set('x-token', token);
    expect(res.status).to.be(200);
    expect(res.body).to.have.property('isPublic', true);
  });
});

describe('put /files/:id/unpublish', () => {
  it('should unpublish a file', async () => {
    const res = await request(app)
      .put('/files/:id/unpublish')
      .set('x-token', token);
    expect(res.status).to.be(200);
    expect(res.body).to.have.property('isPublic', false);
  });
});

describe('get /files/:id/data', () => {
  it('should get file data', async () => {
    const res = await request(app).get('/files/:id/data').set('x-token', token);
    expect(res.status).to.be(200);
  });
  it('should return the correct file based on the size parameter', async () => {
    const res = await request(app)
      .get('/files/:id/data')
      .set('x-token', token)
      .query({ size: '250' });
    expect(res.status).to.be(200);
  });
});
