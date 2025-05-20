const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/quest.sqlite'),
  logging: console.log, // Enable logging for debugging
  transactionType: 'IMMEDIATE', // Enable immediate transactions
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3, // Maximum number of retries
    match: [/SQLITE_BUSY/], // Retry on SQLITE_BUSY errors
    backoffBase: 1000, // Start with 1 second delay
    backoffExponent: 1.5, // Increase delay by 1.5x each retry
  }
});

// Test the connection and enable WAL mode
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Force sync to recreate tables
    await sequelize.sync({ force: true });
    console.log('Database tables recreated successfully');
    
    // Enable WAL mode for better concurrency
    await sequelize.query('PRAGMA journal_mode = WAL;');
    await sequelize.query('PRAGMA busy_timeout = 6000;'); // 6 second timeout
    console.log('Database synchronized successfully');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
};

initializeDatabase();

module.exports = { sequelize }; 