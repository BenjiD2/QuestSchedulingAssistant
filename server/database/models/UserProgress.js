const mongoose = require('mongoose');

// Define the user progress schema
const userProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  streak: {
    type: Number,
    default: 0
  },
  dayStreak: {
    type: Number
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  totalTasksTime: {
    type: Number, // In minutes
    default: 0
  },
  achievements: [{
    type: Object
  }]
}, {
  timestamps: true
});

// Create the model
const UserProgressModel = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgressModel; 