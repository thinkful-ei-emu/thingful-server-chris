/*global supertest, expect*/
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Things Endpoints', function() {
  let db;
  
  const {
    testUsers,
    testThings,
    testReviews,
  } = helpers.makeThingsFixtures();
  
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });
  
  after('disconnect from db', () => db.destroy());
  
  before('cleanup', () => helpers.cleanTables(db));
  
  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('Protected endpoints', () => {
    beforeEach('insert things', () =>
      helpers.seedThingsTables(
        db,
        testUsers,
        testThings,
        testReviews
      )
    );
    
    const protectedEndpoints = [
      {
        name: 'GET /api/things/:thing_id',
        path: '/api/things/1'
      },
      {
        name: 'GET /api/things/:thing_id/reviews',
        path: '/api/things/1/reviews'
      }
    ];
    
    protectedEndpoints.forEach(endpoint => {
      describe(endpoint.name, () => {
        it('responds with a 401 \'Missing bearer token\' when no bearer token', () => {
          return supertest(app)
            .get(endpoint.path)
            .expect(401, { error: 'Missing bearer token' });
        });
    
        it('responds with a 401 \'Unauthorized request\' when invalid JWT secret', () => {
          const userNoCreds = testUsers[0];
          const invalidSecret = 'bad-secret';
          return supertest(app)
            .get(endpoint.path)
            .set('Authorization', helpers.makeAuthHeader(userNoCreds, invalidSecret))
            .expect(401, { error: 'Unauthorized request' });
        });
    
        it('responds with a 401 \'Unauthorized request\' when invalid user', () => {
          const userInvalidCreds = { user_name: 'user-not', id: 1 };
          return supertest(app)
            .get(endpoint.path)
            .set('Authorization', helpers.makeAuthHeader(userInvalidCreds))
            .expect(401, { error: 'Unauthorized request' });
        });
      });
    });
  });
});