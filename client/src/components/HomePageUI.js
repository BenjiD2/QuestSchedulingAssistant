import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';
import { useAuth0 } from "@auth0/auth0-react";
import TaskForm from './TaskForm';
import Profile from './Profile';

export const HomePageUI = ({ user, tasks: propTasks }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
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

  useEffect(() => {
    if (Array.isArray(propTasks)) {
      setTasks(propTasks);
    }
  }, [propTasks]);

  const handleAddTask = (taskData) => {
    const newTask = {
      taskId: crypto.randomUUID(),
      ...taskData,
      completed: false
    };
    setTasks([...tasks, newTask]);
    setShowTaskForm(false);
  };

  const handleEditTask = (taskData) => {
    setTasks(tasks.map(task => 
      task.taskId === editingTask.taskId ? { ...task, ...taskData } : task
    ));
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.taskId !== taskId));
  };

  const handleCompleteTask = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.taskId === taskId) {
        const xpGained = calculateTaskXP(task);
        user.addXP(xpGained);
        return { ...task, completed: true };
      }
      return task;
    }));
  };

  const calculateTaskXP = (task) => {
    // Base XP: 10 points per 30 minutes
    const baseXP = (task.duration / 30) * 10;
    
    // Category multipliers
    const multipliers = {
      work: 1.5,
      study: 1.3,
      exercise: 1.4,
      default: 1.0
    };
    
    return Math.round(baseXP * (multipliers[task.category] || 1.0));
  };

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

  // ─── REAL MODE: full Dashboard UI unchanged ────────────────────────
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
    { icon: '🔥', name: 'On Fire', description: '7-day streak' },
    { icon: '⭐', name: 'Super Achiever', description: 'Completed 5 tasks today' },
    { icon: '🚀', name: 'Productivity Master', description: 'Completed all tasks yesterday' }
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
            <button className="add-task-button" onClick={() => setShowTaskForm(true)}>
              <span className="plus-icon">+</span> Add Task
            </button>
            <div className="tasks-list">
              {tasks.map(task => (
                <div 
                  key={task.taskId} 
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                >
                  <div 
                    className="task-checkbox"
                    onClick={() => !task.completed && handleCompleteTask(task.taskId)}
                  >
                    {task.completed ? (
                      <span className="checked">✓</span>
                    ) : (
                      <span className="unchecked"></span>
                    )}
                  </div>
                  <div className="task-content">
                    <h3 className="task-title">{task.title}</h3>
                    <p className="task-description">{task.description}</p>
                    <div className="task-details">
                      <span className="task-duration">⏱️ {task.duration} min</span>
                      <span className="task-category">{task.category}</span>
                      {!task.completed && (
                        <div className="task-actions">
                          <button 
                            className="edit-button"
                            onClick={() => {
                              setEditingTask(task);
                              setShowTaskForm(true);
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteTask(task.taskId)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-row">
            {/* Gamification */}
            <div className="dashboard-card gamification-card">
                <div className="card-header">
                <h2>Progress</h2>
                <span className="trophy-icon">🏆</span>
                </div>
                <div className="level-info">
                <div className="level-badge">Level {currentLevel}</div>
                <div className="xp-progress">
                    <div className="progress-header">
                    <span>XP Progress</span>
                    <span className="progress-value">{questProgress}/{questGoal}</span>
                    </div>
                    <div className="progress-bar">
                    <div 
                        className="progress" 
                        style={{ width: `${(questProgress / questGoal) * 100}%` }}
                    ></div>
                    </div>
                </div>
                </div>
                <div className="streak-container">
                <div className="streak-info">
                    <span className="streak-flame">🔥</span>
                    <div className="streak-count">
                    <h3>{streakDays}</h3>
                    <p>Day Streak</p>
                    </div>
                </div>
                </div>
                <div className="achievements-section">
                <h3>Recent Achievements</h3>
                <div className="achievements-list">
                    {achievements.map((achievement, index) => (
                    <div key={index} className="achievement-item">
                        <span className="achievement-icon">{achievement.icon}</span>
                        <div className="achievement-details">
                        <h4 className="achievement-name">{achievement.name}</h4>
                        <p className="achievement-description">{achievement.description}</p>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default HomePageUI;
