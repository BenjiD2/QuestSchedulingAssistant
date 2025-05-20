// Component for displaying user profile information.
// Shows level, XP, streaks, achievements, and task statistics.

import React from 'react';
import './Profile.css';

const Profile = ({ user, currentLevel, questProgress, dayStreak, achievements: propAchievements, onClose }) => {
  // Use currentLevel and questProgress directly for the progress bar
  const level = currentLevel || (user && user.level) || 1;
  const progressPercentage = questProgress || (user && user.xp ? user.xp % 100 : 0);
  const currentXP = user && user.xp ? user.xp % 100 : 0; // Or use questProgress directly if it represents current XP in level
  const requiredXP = 100; // Assuming 100 XP per level

  // Use propAchievements, fallback to user.achievements if needed
  const achievements = propAchievements || (user && user.achievements) || [];

  // Calculate stats (completedTasks might need to be passed or derived differently if not on user object)
  const totalTasksCompleted = user && user.completedTasks ? user.completedTasks.length : 0;
  const todayTasks = user && user.completedTasks ? user.completedTasks.filter(task => 
    new Date(task.completedAt).toDateString() === new Date().toDateString()
  ).length : 0;

  // Get recent achievements
  const recentAchievements = achievements
    .sort((a, b) => new Date(b.unlockedAt || b.timestamp) - new Date(a.unlockedAt || a.timestamp)) // Use unlockedAt if present
    .slice(0, 3);

  return (
    <div className="profile-container">
      <button onClick={onClose} className="close-profile-button">X</button>
      <div className="profile-header">
        <div className="profile-info">
          <h2>{user ? user.name : 'User'}</h2>
          <p className="profile-email">{user ? user.email : ''}</p>
        </div>
      </div>

      <div className="level-section">
        <div className="level-header">
          <h3>Level {level}</h3>
          <span className="xp-count">{currentXP} / {requiredXP} XP</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Day Streak</h4>
          <p className="stat-value">🔥 {dayStreak || 0}</p> {/* Display dayStreak */}
        </div>
        <div className="stat-card">
          <h4>Total Tasks</h4>
          <p className="stat-value">{totalTasksCompleted}</p>
        </div>
        <div className="stat-card">
          <h4>Today's Tasks</h4>
          <p className="stat-value">{todayTasks}</p>
        </div>
        <div className="stat-card">
          <h4>Total XP</h4>
          <p className="stat-value">{user && user.xp ? user.xp : 0}</p>
        </div>
      </div>

      <div className="achievements-section">
        <h3>Recent Achievements</h3>
        {recentAchievements.length > 0 ? (
          <div className="achievements-list">
            {recentAchievements.map((achievement, index) => (
              <div key={achievement.id || index} className="achievement-card">
                <div className="achievement-icon">
                  {achievement.icon || '🏅'} {/* Use icon from achievement or default */}
                </div>
                <div className="achievement-info">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  {achievement.unlockedAt && (
                    <span className="achievement-date">
                      Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recent achievements yet. Keep completing tasks!</p>
        )}
      </div>

      <div className="rank-info">
        <h3>Current Rank</h3>
        <div className="rank-card">
          {level < 5 && <p>Novice Questor</p>}
          {level >= 5 && level < 10 && <p>Adventure Seeker</p>}
          {level >= 10 && level < 20 && <p>Quest Master</p>}
          {level >= 20 && level < 30 && <p>Legend</p>}
          {level >= 30 && <p>Mythical Hero</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile; 