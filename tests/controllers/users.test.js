/* eslint-disable jest/valid-expect */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable jest/prefer-expect-assertions */
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../server');

describe('post /users', () => {
  it('should create a new user', async () => {
    const res = request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).to.be(201);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('email', 'test@example.com');
  });
});
