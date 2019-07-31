/*global supertest, expect*/
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const jwt = require('jsonwebtoken');

describe('Auth Endpoints', function() {
  let db;
  const { testUsers } = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('POST /api/auth/login', () => {
    beforeEach('insert users', () =>
      helpers.seedUsers(
        db,
        testUsers
      )
    );

    const requiredFields = ['user_name', 'password'];

    requiredFields.forEach(field => {
      const loginAttempt = {
        user_name: testUser.user_name,
        password: testUser.password
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete loginAttempt[field];
        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttempt)
          .expect(400, {
            error: 'Incorrect user_name or password'
          });
      });
    });
    it('responds 400 \'invalid user_name or password\' when bad user_name or password are used', () => {
      const invalidUser = { user_name: 'nope', password: 'nada' };
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(400, {
          error: 'Incorrect user_name or password'
        });
    });
    
    it('responds with 400 and \'Incorrect user_name or password\' for bad passwords', () => {
      const invalidPass = { user_name: testUser.user_name, password: 'not_today' };
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidPass)
        .expect(400, {
          error: 'Incorrect user_name or password'
        });
    });

    it('responds with 200 and JWT using secret when requested', () => {
      const ValidCred = { user_name: testUser.user_name, password: testUser.password };
      const expectedToken = jwt.sign(
        {user_id: testUser.id},
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          algorithm: 'HS256'
        }
      );
      return supertest(app)
        .post('/api/auth/login')
        .send(ValidCred)
        .expect(200, {
          authToken: expectedToken,
        });
    });
  });
});