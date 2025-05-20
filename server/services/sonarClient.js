// Mock sonarClient for testing
const createChatCompletion = async (messages) => {
  // Mock response that simulates time estimation
  return {
    choices: [{
      message: {
        content: "Based on the task description, I estimate it will take approximately 2 hours."
      }
    }]
  };
};

module.exports = {
  createChatCompletion
}; 