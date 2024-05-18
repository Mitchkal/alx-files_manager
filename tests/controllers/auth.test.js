/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */

import app from '../../server';

// eslint-disable-next-line import/no-extraneous-dependencies
const request = require('supertest');
const { expect } = require('chai');

let token;

describe('get /connect', () => {
  it('should authenticate a user', async () => {
    const res = await request(app)
      .get('/connect')
      .auth('test@example.com', 'password123');
    expect(res.status).to.be.equal(200);
    expect(res.body).to.have.property('token');
    token = res.body.token;
  });
});

describe('get /users/me', () => {
  it('should get an authenticated user', async () => {
    const res = await request(app).get('/users/me').set('x-token', token);
    expect(res.status).toBe(200);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('email');
  });
});

describe('get /disconnect', () => {
  it('should logout a user', async () => {
    const res = await request(app).get('/disconnect').set('x-token', token);
    expect(res.status).to.be(204);
  });
});
