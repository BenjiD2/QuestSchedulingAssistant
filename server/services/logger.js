// Logger service for tracking MongoDB operations and in-memory fallbacks

// Export immediately to avoid circular dependency issues
const loggerModule = module.exports = {};

/**
 * Logs information with timestamp
 * @param {string} source - Source of the log (e.g., 'MongoDB', 'In-Memory')
 * @param {string} action - Action being performed
 * @param {string} message - Message to log
 * @param {Object} [details] - Optional details
 */
const log = (source, action, message, details = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    source,
    action,
    message,
    ...(details ? { details } : {})
  };

  // Log to console in a formatted way
  console.log(`[${timestamp}] ${source} | ${action} | ${message}`);
  if (details) {
    console.log("Details:", JSON.stringify(details, null, 2));
  }

  return logMessage;
};

/**
 * Logs MongoDB operations
 */
const mongodb = {
  read: (entity, id, success, details = null) => {
    return log(
      'MongoDB', 
      'READ', 
      `${success ? 'Success' : 'Failed'} reading ${entity}${id ? ` (ID: ${id})` : ''}`,
      details
    );
  },
  create: (entity, id, success, details = null) => {
    return log(
      'MongoDB',
      'CREATE',
      `${success ? 'Success' : 'Failed'} creating ${entity}${id ? ` (ID: ${id})` : ''}`,
      details
    );
  },
  update: (entity, id, success, details = null) => {
    return log(
      'MongoDB',
      'UPDATE',
      `${success ? 'Success' : 'Failed'} updating ${entity}${id ? ` (ID: ${id})` : ''}`,
      details
    );
  },
  delete: (entity, id, success, details = null) => {
    return log(
      'MongoDB',
      'DELETE',
      `${success ? 'Success' : 'Failed'} deleting ${entity}${id ? ` (ID: ${id})` : ''}`,
      details
    );
  },

  connection: (success, details = null) => {
    return log(
      'MongoDB',
      'CONNECTION',
      success ? 'Connected successfully' : 'Connection failed',
      details
    );
  }
};

/**
 * Logs in-memory store operations
 */
const inMemory = {
  fallback: (entity, id, details = null) => {
    return log(
      'In-Memory',
      'FALLBACK',
      `Using in-memory ${entity}${id ? ` (ID: ${id})` : ''}`,
      details
    );
  }
};

// Assign properties to the exported module
loggerModule.log = log;
loggerModule.mongodb = mongodb;
loggerModule.inMemory = inMemory; 