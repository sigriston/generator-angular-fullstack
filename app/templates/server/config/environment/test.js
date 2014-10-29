'use strict';

// Test specific configuration
// ===========================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/<%= _.slugify(appname) %>-test'
  },
  sequelize: {
    uri: 'sqlite://',
    options: {
      logging: false,
      define: {
        timestamps: false
      }
    }
  }
};
