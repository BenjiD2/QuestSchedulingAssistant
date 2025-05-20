const mongoose = require('mongoose');

// Define the achievement schema as a sub-document
const achievementSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  icon: { 
    type: String, 
    default: '🏆' 
  },
  unlockedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Define the user schema
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
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
  lastActivity: {
    type: Date,
    default: Date.now
  },
  achievements: {
    type: [achievementSchema],
    default: []
  }
}, {
  timestamps: true
});

// Create the model
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel; 