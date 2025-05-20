// MongoDB connection module
const mongoose = require('mongoose');
const logger = require('../services/logger');

// Connection status flag for checking connection status
let isConnected = false;

/**
 * Connect to MongoDB
 * @returns {Promise<boolean>} Connection result
 */
const connectToDatabase = async () => {
  if (isConnected) {
    logger.log('MongoDB', 'CONNECTION', 'Using existing MongoDB connection');
    return true;
  }

  try {
    // Use the connection string from the environment or the provided one
    const connectionString = process.env.MONGODB_URI || 
      'mongodb+srv://admin:admin@questscheduling.xcxgurp.mongodb.net/?retryWrites=true&w=majority&appName=QuestScheduling';
    
    logger.log('MongoDB', 'CONNECTION', 'Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.mongodb.connection(true, { 
      message: 'Connected to MongoDB successfully',
      host: mongoose.connection.host
    });
    
    isConnected = true;
    return true;
  } catch (error) {
    logger.mongodb.connection(false, { 
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectFromDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    logger.log('MongoDB', 'CONNECTION', 'Disconnected from MongoDB');
    isConnected = false;
  } catch (error) {
    logger.log('MongoDB', 'ERROR', 'MongoDB disconnection error', { error: error.message });
  }
};

/**
 * Get connection status
 * @returns {boolean} Whether connected to MongoDB
 */
const getConnectionStatus = () => {
  return isConnected;
};

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  getConnectionStatus
}; 