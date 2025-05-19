// server/src/models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// define minimal schema so Mongoose gives you a model
const userSchema = new Schema({
  userId:         { type: String, required: true, unique: true },
  name:           String,
  email:          String,
  xp:             Number,
  level:          Number,
  completedTasks: Array,
  achievements:   Array
}, { timestamps: true });

// compile model
const User = mongoose.model('User', userSchema);

// Export it so your service and tests see these static methods
module.exports = User;
