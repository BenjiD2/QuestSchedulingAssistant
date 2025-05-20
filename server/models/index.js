const { sequelize } = require('../config/database');
const User = require('./User');
const UserProgress = require('./UserProgress');
const Task = require('./Task');

// Define associations
User.hasOne(UserProgress, {
  foreignKey: 'userId',
  as: 'progress',
  onDelete: 'CASCADE'
});

UserProgress.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Task, {
  foreignKey: 'userId',
  as: 'tasks',
  onDelete: 'CASCADE'
});

Task.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Sync all models
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  UserProgress,
  Task,
  syncDatabase
}; 