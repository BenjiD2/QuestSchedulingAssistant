const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteDB {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'quest.db'));
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          userId TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          xp INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          streak INTEGER DEFAULT 0,
          lastActive TEXT,
          lastStreakUpdate TEXT
        )
      `);

      // Achievements table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS achievements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT,
          achievementId TEXT,
          icon TEXT,
          name TEXT,
          description TEXT,
          date TEXT,
          FOREIGN KEY (userId) REFERENCES users(userId)
        )
      `);

      // Tasks table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          taskId TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          startTime TEXT NOT NULL,
          endTime TEXT NOT NULL,
          location TEXT,
          category TEXT DEFAULT 'default',
          completed INTEGER DEFAULT 0,
          completedAt TEXT,
          duration INTEGER,
          xpValue INTEGER DEFAULT 0,
          recurrence TEXT,
          googleEventId TEXT,
          isRecurringInstance INTEGER DEFAULT 0,
          originalTaskId TEXT,
          FOREIGN KEY (userId) REFERENCES users(userId)
        )
      `);
    });
  }

  // Helper method to convert task data for database storage
  _prepareTaskForStorage(task) {
    return {
      ...task,
      completed: task.completed ? 1 : 0,
      isRecurringInstance: task.isRecurringInstance ? 1 : 0,
      startTime: task.startTime ? new Date(task.startTime).toISOString() : null,
      endTime: task.endTime ? new Date(task.endTime).toISOString() : null,
      completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null
    };
  }

  // Helper method to convert task data from database to application format
  _prepareTaskFromStorage(task) {
    if (!task) return null;
    return {
      ...task,
      completed: task.completed === 1,
      isRecurringInstance: task.isRecurringInstance === 1,
      startTime: task.startTime ? new Date(task.startTime) : null,
      endTime: task.endTime ? new Date(task.endTime) : null,
      completedAt: task.completedAt ? new Date(task.completedAt) : null
    };
  }

  // User operations
  async getUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE userId = ?', [userId], (err, row) => {
        if (err) reject(err);
        if (!row) resolve(null);
        resolve({
          ...row,
          lastActive: row.lastActive ? new Date(row.lastActive) : null,
          lastStreakUpdate: row.lastStreakUpdate ? new Date(row.lastStreakUpdate) : null
        });
      });
    });
  }

  async createUser(userData) {
    const { userId, name, email } = userData;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (userId, name, email, xp, level, streak) VALUES (?, ?, ?, 0, 1, 0)',
        [userId, name, email],
        function(err) {
          if (err) reject(err);
          resolve({ userId, name, email, xp: 0, level: 1, streak: 0 });
        }
      );
    });
  }

  async updateUserXP(userId, xp) {
    const level = Math.floor(xp / 100) + 1;
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET xp = ?, level = ? WHERE userId = ?',
        [xp, level, userId],
        function(err) {
          if (err) reject(err);
          resolve({ userId, xp, level });
        }
      );
    });
  }

  async updateUserStreak(userId, streak) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET streak = ?, lastStreakUpdate = ? WHERE userId = ?',
        [streak, new Date().toISOString(), userId],
        function(err) {
          if (err) reject(err);
          resolve({ userId, streak });
        }
      );
    });
  }

  async updateUserProgress(userId, updates) {
    const { xp, level, streak, lastActive, lastStreakUpdate } = updates;
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users SET 
          xp = ?, 
          level = ?, 
          streak = ?, 
          lastActive = ?, 
          lastStreakUpdate = ? 
        WHERE userId = ?`,
        [
          xp,
          level,
          streak,
          lastActive?.toISOString(),
          lastStreakUpdate?.toISOString(),
          userId
        ],
        function(err) {
          if (err) reject(err);
          resolve({ userId, ...updates });
        }
      );
    });
  }

  // Achievement operations
  async addAchievement(userId, achievement) {
    const { id, icon, name, description, date } = achievement;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO achievements (userId, achievementId, icon, name, description, date) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, id, icon, name, description, date?.toISOString()],
        function(err) {
          if (err) reject(err);
          resolve(achievement);
        }
      );
    });
  }

  async getUserAchievements(userId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM achievements WHERE userId = ?', [userId], (err, rows) => {
        if (err) reject(err);
        resolve(rows.map(row => ({
          ...row,
          date: row.date ? new Date(row.date) : null
        })));
      });
    });
  }

  // Task operations
  async addTask(userId, task) {
    const taskData = this._prepareTaskForStorage(task);
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO tasks (
          userId, taskId, title, description, startTime, endTime, 
          location, category, completed, duration, xpValue,
          recurrence, googleEventId, isRecurringInstance, originalTaskId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          taskData.taskId,
          taskData.title,
          taskData.description,
          taskData.startTime,
          taskData.endTime,
          taskData.location,
          taskData.category,
          taskData.completed,
          taskData.duration,
          taskData.xpValue,
          taskData.recurrence,
          taskData.googleEventId,
          taskData.isRecurringInstance,
          taskData.originalTaskId
        ],
        function(err) {
          if (err) reject(err);
          resolve(task);
        }
      );
    });
  }

  async getTask(userId, taskId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM tasks WHERE userId = ? AND taskId = ?',
        [userId, taskId],
        (err, row) => {
          if (err) reject(err);
          resolve(this._prepareTaskFromStorage(row));
        }
      );
    });
  }

  async getUserTasks(userId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM tasks WHERE userId = ?', [userId], (err, rows) => {
        if (err) reject(err);
        resolve(rows.map(row => this._prepareTaskFromStorage(row)));
      });
    });
  }

  async updateTask(userId, taskId, updates) {
    const taskData = this._prepareTaskForStorage(updates);
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(taskData)) {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    updateValues.push(userId, taskId);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE tasks SET ${updateFields.join(', ')} WHERE userId = ? AND taskId = ?`,
        updateValues,
        function(err) {
          if (err) reject(err);
          resolve({ taskId, ...updates });
        }
      );
    });
  }

  async deleteTask(userId, taskId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM tasks WHERE userId = ? AND taskId = ?',
        [userId, taskId],
        function(err) {
          if (err) reject(err);
          resolve({ success: true });
        }
      );
    });
  }
}

const db = new SQLiteDB();
module.exports = db; 