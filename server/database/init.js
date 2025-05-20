const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

// Import associations
require('../models/associations');

async function initializeDatabase() {
  try {
    // Create the database directory if it doesn't exist
    const dbDir = path.join(__dirname);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Test the connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync all models with the database (without force)
    await sequelize.sync();
    console.log('Database tables synchronized successfully.');
  } catch (error) {
    console.error('Unable to initialize database:', error);
    throw error;
  }
}

module.exports = initializeDatabase; 