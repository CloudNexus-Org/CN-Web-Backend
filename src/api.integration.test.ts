const request = require('supertest');
const app = require('./index');

describe('API Integration Tests', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  // Add more tests for your API endpoints below
});
