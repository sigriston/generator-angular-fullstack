'use strict';

var crypto = require('crypto');<% if (filters.oauth) { %>
var authTypes = ['github', 'twitter', 'facebook', 'google'];<% } %>

var validatePresenceOf = function(value) {
  return value && value.length;
};

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {

    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true
      }
    },
    provider: DataTypes.STRING,
    salt: DataTypes.STRING<% if (filters.oauth) { %>,<% if (filters.facebookAuth) { %>
    facebook: DataTypes.TEXT,<% } %><% if (filters.twitterAuth) { %>
    twitter: DataTypes.TEXT,<% } %><% if (filters.googleAuth) { %>
    google: DataTypes.TEXT,<% } %>
    github: DataTypes.TEXT<% } %>

  }, {

    /**
     * Virtual Getters
     */
    getterMethods: {
      // Public profile information
      profile: function() {
        return {
          'name': this.name,
          'role': this.role
        };
      },

      // Non-sensitive info we'll be putting in the token
      token: function() {
        return {
          '_id': this._id,
          'role': this.role
        };
      }
    },

    /**
     * Pre-save hooks
     */
    hooks: {
      beforeCreate: function(user, fn) {
        user.updatePassword(fn);
      },
      beforeUpdate: function(user, fn) {
        if (user.changed('password')) {
          user.updatePassword(fn);
        }
      }
    },

    /**
     * Instance Methods
     */
    instanceMethods: {
      /**
       * Authenticate - check if the passwords are the same
       *
       * @param {String} password
       * @param {Function} callback
       * @return {Boolean}
       * @api public
       */
      authenticate: function(password, callback) {
        if (!callback) {
          return this.password === this.encryptPassword(password);
        }

        var _this = this;
        this.encryptPassword(password, function(err, pwdGen) {
          if (err) {
            callback(err);
          }

          if (_this.password === pwdGen) {
            callback(null, true);
          }
          else {
            callback(null, false);
          }
        });
      },

      /**
       * Make salt
       *
       * @param {Number} byteSize Optional salt byte size, default to 16
       * @param {Function} callback
       * @return {String}
       * @api public
       */
      makeSalt: function(byteSize, callback) {
        var defaultByteSize = 16;

        if (typeof arguments[0] === 'function') {
          callback = arguments[0];
          byteSize = defaultByteSize;
        }
        else if (typeof arguments[1] === 'function') {
          callback = arguments[1];
        }

        if (!byteSize) {
          byteSize = defaultByteSize;
        }

        if (!callback) {
          return crypto.randomBytes(byteSize).toString('base64');
        }

        return crypto.randomBytes(byteSize, function(err, salt) {
          if (err) {
            callback(err);
          }
          return callback(null, salt.toString('base64'));
        });
      },

      /**
       * Encrypt password
       *
       * @param {String} password
       * @param {Function} callback
       * @return {String}
       * @api public
       */
      encryptPassword: function(password, callback) {
        if (!password || !this.salt) {
          return null;
        }

        var defaultIterations = 10000;
        var defaultKeyLength = 64;
        var salt = new Buffer(this.salt, 'base64');

        if (!callback) {
          return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength)
                       .toString('base64');
        }

        return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, function(err, key) {
          if (err) {
            callback(err);
          }
          return callback(null, key.toString('base64'));
        });
      },

      /**
       * Update password field
       *
       * @param {String} password
       * @return {String}
       * @api public
       */
      updatePassword: function(fn) {
        // Handle new/update passwords
        if (this.password) {
          if (!validatePresenceOf(this.password)<% if (filters.oauth) { %> && authTypes.indexOf(this.provider) === -1<% } %>) {
            fn(new Error('Invalid password'));
          }

          // Make salt with a callback
          var _this = this;
          this.makeSalt(function(saltErr, salt) {
            if (saltErr) {
              fn(saltErr);
            }
            _this.salt = salt;
            _this.encryptPassword(_this.password, function(encryptErr, hashedPassword) {
              if (encryptErr) {
                fn(encryptErr);
              }
              _this.password = hashedPassword;
              fn(null);
            });
          });
        } else {
          fn(null);
        }
      }
    },

    /**
     * Class Methods (Statics)
     */
    classMethods: {
      login: function(email, password, done) {
        this.find({
          where: {
            email: email.toLowerCase()
          }
        }).then(function(user) {
          if (!user) {
            return done(null, false, {
              message: 'This email is not registered.'
            });
          }
          if (!user.authenticate(password)) {
            return done(null, false, {
              message: 'This password is not correct.'
            });
          }
          return done(null, user);
        }, function(err) {
          return done(err);
        });
      },

      attachUserToRequest: function(req, res, next) {
        this.find({
          where: {
            _id: req.user._id
          }
        }).then(function(user) {
          if (!user) return res.send(401);

          req.user = user;
          next();
        }, function(err) {
          return next(err);
        });
      }
    }
  });
};
