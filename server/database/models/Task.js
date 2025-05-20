const mongoose = require('mongoose');

// Define the task schema
const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  category: {
    type: String,
    default: 'other'
  },
  estimatedDuration: {
    type: Number,
    default: 60 // minutes
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  recurrence: {
    type: String
  },
  isRecurringInstance: {
    type: Boolean,
    default: false
  },
  originalTaskId: {
    type: String
  },
  googleEventId: {
    type: String
  }
}, {
  timestamps: true
});

// Create the model
const TaskModel = mongoose.model('Task', taskSchema);

module.exports = TaskModel; 