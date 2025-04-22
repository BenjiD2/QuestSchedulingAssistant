import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Sample data
  const todayDate = new Date();
  const formattedDate = todayDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const dayOfWeek = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  
  const events = [
    { id: 1, title: 'Team Meeting', time: '09:00 - 10:30', location: 'Conference Room A', color: 'blue' },
    { id: 2, title: 'Project Review', time: '14:00 - 15:00', location: 'Zoom Call', color: 'green' },
    { id: 3, title: 'Client Call', time: '16:30 - 17:00', location: 'Phone', color: 'purple' }
  ];

  const tasks = [
    { id: 1, title: 'Update presentation slides', completed: true, category: 'work' },
    { id: 2, title: 'Send follow-up emails', completed: false, category: 'communication' },
    { id: 3, title: 'Schedule client meeting', completed: true, category: 'planning' },
    { id: 4, title: 'Prepare quarterly report', completed: false, category: 'work' },
    { id: 5, title: 'Review marketing proposals', completed: true, category: 'work' }
  ];

  const completedTasks = tasks.filter(task => task.completed);
  
  // Calendar data
  const currentMonth = todayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).getDay();
  
  // Weekly data
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentDate = todayDate.getDate();
  
  const weeklyEvents = [
    { day: 'Mon', date: 21, events: [
      { time: '9:00 AM', title: 'Team Meeting', color: 'blue' },
      { time: '2:00 PM', title: 'Project Review', color: 'green' }
    ]},
    { day: 'Tue', date: 22, events: [] },
    { day: 'Wed', date: 23, events: [
      { time: '11:00 AM', title: 'Client Call', color: 'purple' }
    ]},
    { day: 'Thu', date: 24, events: [] },
    { day: 'Fri', date: 25, events: [
      { time: '3:30 PM', title: 'Weekly Sync', color: 'yellow' }
    ]},
    { day: 'Sat', date: 26, events: [] },
    { day: 'Sun', date: 27, events: [] }
  ];
  
  // Quest & gamification data
  const streakDays = 7;
  const currentLevel = 3;
  const questProgress = 65;
  const questGoal = 100;
  const achievements = [
    { icon: '🔥', name: 'On Fire', description: '7-day streak' },
    { icon: '⭐', name: 'Super Achiever', description: 'Completed 5 tasks today' },
    { icon: '🚀', name: 'Productivity Master', description: 'Completed all tasks yesterday' }
  ];
  
  // Generate calendar days
  const calendarDays = [];
  
  // Previous month days
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ day: new Date(todayDate.getFullYear(), todayDate.getMonth(), -i).getDate(), currentMonth: false });
  }
  calendarDays.reverse();
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, currentMonth: true, isToday: i === todayDate.getDate() });
  }
  
  // Next month days
  const remainingCells = 42 - calendarDays.length; // 6 rows x 7 columns
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({ day: i, currentMonth: false });
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <button className="theme-toggle">
            <span className="icon">☀️</span>
          </button>
          <div className="notifications">
            <span className="icon">🔔</span>
            <span className="notification-badge">3</span>
          </div>
          <div className="user-profile">
            <div className="avatar">JD</div>
            <div className="user-info">
              <div className="user-name">John Doe</div>
              <div className="user-role">Product Manager</div>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-row">
          {/* Today's Schedule */}
          <div className="dashboard-card schedule-card">
            <div className="card-header">
              <h2>Today's Schedule</h2>
              <span className="time-icon">🕒</span>
            </div>
            <div className="today-date">
              <h3>{formattedDate}</h3>
              <p>{dayOfWeek}</p>
            </div>
            <div className="events-list">
              {events.map(event => (
                <div className={`event-item ${event.color}`} key={event.id}>
                  <div className="event-time-icon">
                    <div className="time-icon-circle"></div>
                  </div>
                  <div className="event-details">
                    <h4>{event.title}</h4>
                    <p className="event-time">{event.time}</p>
                    <p className="event-location">{event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="dashboard-card tasks-card">
            <div className="card-header">
              <h2>Tasks</h2>
              <span className="check-icon">✓</span>
            </div>
            <div className="tasks-count">
              <h3>{tasks.length}</h3>
              <p>tasks</p>
              <p className="completed-count">{completedTasks.length} completed</p>
            </div>
            <button className="add-task-button">
              <span className="plus-icon">+</span> Add Task
            </button>
            <div className="tasks-list">
              {tasks.map(task => (
                <div className="task-item" key={task.id}>
                  <div className="task-checkbox">
                    {task.completed ? <span className="checked">✓</span> : <span className="unchecked"></span>}
                  </div>
                  <div className="task-content">
                    <p className={`task-title ${task.completed ? 'completed' : ''}`}>{task.title}</p>
                    <span className={`task-category ${task.category}`}>{task.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-row calendar-gamification-row">
          {/* Calendar - smaller version */}
          <div className="dashboard-card calendar-card-small">
            <div className="card-header">
              <h2>Calendar</h2>
              <span className="calendar-icon">📅</span>
            </div>
            <div className="calendar">
              <div className="calendar-nav">
                <button className="prev-month">❮</button>
                <h3 className="current-month">April 2025</h3>
                <button className="next-month">❯</button>
              </div>
              <div className="calendar-grid">
                <div className="weekdays">
                  <div>Su</div>
                  <div>Mo</div>
                  <div>Tu</div>
                  <div>We</div>
                  <div>Th</div>
                  <div>Fr</div>
                  <div>Sa</div>
                </div>
                <div className="days">
                  {[30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 1, 2, 3].map((day, index) => (
                    <div key={index} className={`day ${day === 22 ? 'selected' : ''} ${(day === 30 && index < 7) || (day <= 3 && index >= 28) ? 'other-month' : ''}`}>
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gamification Box */}
          <div className="dashboard-card gamification-card">
            <div className="card-header">
              <h2>Quest Progress</h2>
              <span className="gamification-icon">🏆</span>
            </div>
            
            <div className="streak-container">
              <div className="streak-info">
                <div className="streak-flame">🔥</div>
                <div className="streak-count">
                  <h3>{streakDays}</h3>
                  <p>day streak</p>
                </div>
              </div>
              <div className="level-badge">
                <span className="level-text">Level {currentLevel}</span>
              </div>
            </div>
            
            <div className="quest-progress">
              <div className="progress-header">
                <span>Daily Quest Progress</span>
                <span className="progress-value">{questProgress}/{questGoal}</span>
              </div>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${(questProgress/questGoal) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="achievements-section">
              <h3>Recent Achievements</h3>
              <div className="achievements-list">
                {achievements.map((achievement, index) => (
                  <div className="achievement-item" key={index}>
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-details">
                      <p className="achievement-name">{achievement.name}</p>
                      <p className="achievement-description">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="dashboard-card weekly-overview">
          <div className="card-header">
            <h2>Weekly Overview</h2>
            <p className="subtitle">Your schedule for the upcoming week</p>
          </div>
          <div className="weekly-tabs">
            <button 
              className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`} 
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </button>
            <button 
              className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              Tasks
            </button>
          </div>
          <div className="weekly-grid">
            {weeklyEvents.map((day, index) => (
              <div className="day-column" key={index}>
                <div className="day-header">
                  <div className="day-name">{day.day}</div>
                  <div className="day-date">{day.date}</div>
                </div>
                <div className="day-events">
                  {day.events.map((event, eventIndex) => (
                    <div className={`week-event ${event.color}`} key={eventIndex}>
                      <p className="event-time">{event.time}</p>
                      <p className="event-title">{event.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Insights */}
        <div className="dashboard-card productivity-insights">
          <div className="card-header">
            <h2>Productivity Insights</h2>
            <p className="subtitle">Your productivity trends and statistics</p>
          </div>
          
          <div className="insights">
            <div className="insight-item">
              <div className="insight-label">Task Completion Rate</div>
              <div className="insight-value">75%</div>
              <div className="progress-bar">
                <div className="progress" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="insight-item">
              <div className="insight-label">Focus Time</div>
              <div className="insight-value blue">4.5 hours</div>
              <div className="progress-bar">
                <div className="progress blue" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div className="insight-item">
              <div className="insight-label">Meeting Time</div>
              <div className="insight-value purple">2.5 hours</div>
              <div className="progress-bar">
                <div className="progress purple" style={{ width: '35%' }}></div>
              </div>
            </div>
            
            <div className="suggestion-box">
              <h3>Suggestions</h3>
              <p>Consider scheduling more focus time in the mornings based on your productivity patterns.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 