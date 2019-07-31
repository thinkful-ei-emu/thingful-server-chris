const express = require('express');
const AuthService = require('./auth-service');
const authRouter = express.Router();
const jsonParser = express.json();

authRouter
  .post('/login', jsonParser, (req, res, next) => {
    const { user_name, password } = req.body;
    const loginUser = {user_name, password };
    
    if(!user_name || !password)
      return res.status(400).json({
        error: 'Incorrect user_name or password'
      });

    AuthService.getUserWithName(
      req.app.get('db'),
      loginUser.user_name
    )
      .then(dbUser => {
        if(!dbUser)
          return res.status(400).json({
            error: 'Incorrect user_name or password'
          });

        return AuthService.comparePasswords(loginUser.password, dbUser.password)
          .then(compareMatch => {
            if(!compareMatch)
              return res.status(400).json({
                error: 'Incorrect user_name or password'
              });
            const sub = dbUser.user_name;
            const payload = { user_id: dbUser.id };
            res.json({
              authToken: AuthService.createJwt(sub, payload)
            });
          });
      })
      .catch(next);
  });

module.exports = authRouter;