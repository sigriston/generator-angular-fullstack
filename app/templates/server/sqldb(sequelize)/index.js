/**
 * Sequelize initialization module
 */

'use strict';

var path = require('path');
var config = require('../config/environment');

var Sequelize = require('sequelize');<% if (filters.twitterAuth) { %>
var session = require('express-session');
var SequelizeStore = require('connect-session-sequelize')(session.Store);<% } %>

var db = {
  Sequelize: Sequelize,
  sequelize: new Sequelize(config.sequelize.uri, config.sequelize.options)
};
<% if (filters.sequelizeModels) { %>
db.Thing = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'thing',
  'thing.model'
));
<% if (filters.auth) { %>
db.User = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'user',
  'user.model'
));
<% if (filters.twitterAuth) { %>
db.sequelizeStore = new SequelizeStore({ db: db.sequelize });
<% } %><% } %><% } %>
// DB Sync promise
db.sync = db.sequelize.sync().then();

module.exports = db;
