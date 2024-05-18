/* eslint-disable jest/valid-expect */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable jest/prefer-expect-assertions */
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../server');

describe('get /status', () => {
  it('should return staus 200 with correct response', async () => {
    const res = await request(app).get('/status');
    expect(res.status).to.be(200);
    expect(res.body).lessThanOrEqual({ redis: true, db: true });
  });
});

describe('get/status', () => {
  it('should return status 200 with correct status', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).to.be(200);
    expect(res.body).to.have.property('users');
    expect(res.body).to.have.property('files');
  });
});
