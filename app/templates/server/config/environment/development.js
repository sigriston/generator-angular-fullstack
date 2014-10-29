'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/<%= _.slugify(appname) %>-dev'
  },
  sequelize: {
    uri: 'sqlite://:memory::',
    options: {
      logging: false,
      define: {
        timestamps: false
      }
    }
  },

  seedDB: true
};
