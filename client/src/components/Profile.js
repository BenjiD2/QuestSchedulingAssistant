import React from 'react';
import './Profile.css';

const Profile = ({ user }) => {
  const { level, xp, achievements, completedTasks } = user;
  const progress = user.getProgressToNextLevel();

  // Calculate stats
  const totalTasksCompleted = completedTasks.length;
  const todayTasks = completedTasks.filter(task => 
    new Date(task.completedAt).toDateString() === new Date().toDateString()
  ).length;

  // Get recent achievements
  const recentAchievements = achievements
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
        </div>
      </div>

      <div className="level-section">
        <div className="level-header">
          <h3>Level {level}</h3>
          <span className="xp-count">{progress.currentXP} / {progress.requiredXP} XP</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      <div className="stats-grid">
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
          <p className="stat-value">{xp}</p>
        </div>
      </div>

      <div className="achievements-section">
        <h3>Recent Achievements</h3>
        <div className="achievements-list">
          {recentAchievements.map((achievement, index) => (
            <div key={index} className="achievement-card">
              <div className="achievement-icon">
                {achievement.type === 'LEVEL_UP' && '🏆'}
                {achievement.type === 'DAILY_WARRIOR' && '⚔️'}
                {achievement.type === 'WEEKLY_STREAK' && '🔥'}
              </div>
              <div className="achievement-info">
                <h4>{achievement.type.replace(/_/g, ' ')}</h4>
                <p>{achievement.description}</p>
                <span className="achievement-date">
                  {new Date(achievement.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
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