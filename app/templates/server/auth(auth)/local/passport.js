var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

exports.setup = function(User, config) {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  }, function(email, password, done) {
    <% if (filters.mongooseModels) { %>User.findOneAsync({<% }
       if (filters.sequelizeModels) { %>User.find({<% } %>
      email: email.toLowerCase()
    })
      .then(function(user) {
        if (!user) {
          return done(null, false, {
            message: 'This email is not registered.'
          });
        }
        user.authenticate(password, function(authError, authenticated) {
          if (authError) {
            return done(authError);
          }
          if (!authenticated) {
            return done(null, false, {
              message: 'This password is not correct.'
            });
          } else {
            return done(null, user);
          }
        });
      })
      .catch(function(err) {
        return done(err);
      });
  }));
};
