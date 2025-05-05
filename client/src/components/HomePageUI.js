import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';
import { useAuth0 } from "@auth0/auth0-react";

export const HomePageUI = ({ user, tasks: propTasks }) => {
  const [activeTab, setActiveTab]        = useState('calendar');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef                   = useRef(null);
  const { logout }                       = useAuth0();

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuRef]);

  if (Array.isArray(propTasks)) {
    return (
      <div className="dashboard-container">
        <h1>Hello, {user.name}</h1>
        <ul>
          {propTasks.map(({ taskId, title, description }) => (
            <li key={taskId}>
              <strong>{title}</strong><br/>
              <span>{description}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ─── REAL MODE: your full Dashboard UI unchanged ────────────────────────
  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleEditAccount = () => {
    window.open('https://manage.auth0.com/manage-users', '_blank');
  };

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

  const streakDays = 7;
  const currentLevel = 3;
  const questProgress = 65;
  const questGoal = 100;
  const achievements = [
    { icon: 'Fire', name: 'On Fire', description: '7-day streak' },
    { icon: 'Star', name: 'Super Achiever', description: 'Completed 5 tasks today' },
    { icon: 'Rocket', name: 'Productivity Master', description: 'Completed all tasks yesterday' }
  ];

  // Build calendarDays array…
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({
      day: new Date(todayDate.getFullYear(), todayDate.getMonth(), -i).getDate(),
      currentMonth: false
    });
  }
  calendarDays.reverse();
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, currentMonth: true, isToday: i === todayDate.getDate() });
  }
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({ day: i, currentMonth: false });
  }

  const profileMenuStyle = {
    position: 'absolute',
    top: '60px',
    right: '0',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    width: '200px',
    zIndex: 100,
    overflow: 'hidden',
    display: showProfileMenu ? 'block' : 'none'
  };
  const menuItemStyle = {
    padding: '12px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease'
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <div
            className="user-profile"
            ref={profileMenuRef}
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="avatar">
              {user ? user.name.substring(0, 2).toUpperCase() : 'JD'}
            </div>
            <div className="user-info">
              <div className="user-name">
                {user ? user.name : 'John Doe'}
              </div>
              <div className="user-role">
                {user ? user.email : 'Product Manager'}
              </div>
            </div>
            <div style={profileMenuStyle}>
              <div
                style={{ ...menuItemStyle }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f7fa'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                onClick={handleEditAccount}
              >
                Edit Account
              </div>
              <div
                style={{ ...menuItemStyle }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f7fa'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                onClick={handleLogout}
              >
                Logout
              </div>
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
              <span className="time-icon"></span>
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
              <span className="check-icon"></span>
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
                    {task.completed ? (
                      <span className="checked">✓</span>
                    ) : (
                      <span className="unchecked"></span>
                    )}
                  </div>
                  <div className="task-content">
                    <p className={`task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </p>
                    <span className={`task-category ${task.category}`}>
                      {task.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ...the rest of your calendar, gamification, weekly overview, insights as before... */}
      </div>
    </div>
  );
};
