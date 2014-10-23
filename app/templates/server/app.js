/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');<% if (filters.mongoose) { %>
var mongoose = require('mongoose-bird')();<% } %><% if (filters.sequelize) { %>
var sqldb = require('./sqldb');<% } %>
var config = require('./config/environment');
<% if (filters.mongoose) { %>
// Connect to MongoDB
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate MongoDB with sample data
if (config.seedDB) { require('./config/seed'); }
<% } %><% if (filters.sequelize) { %>
// Connect to SQL database
sqldb.connect(config.sqldb.uri, config.sqldb.options);

// Populate SQL with sample data
if (config.seedDB) { require('./config/seed'); }
<% } %>
// Setup server
var app = express();
var server = require('http').createServer(app);<% if (filters.socketio) { %>
var socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production') ? false : true,
  path: '/socket.io-client'
});
require('./config/socketio')(socketio);<% } %>
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function() {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
