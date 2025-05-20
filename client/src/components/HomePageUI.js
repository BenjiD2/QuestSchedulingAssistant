import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';
import { useAuth0 } from "@auth0/auth0-react";
import TaskForm from './TaskForm';
import Profile from './Profile';
import EditAccount from './EditAccount';

import { gapi } from "gapi-script";
import convertEventToTask from '../utils/convertEventToTask';

const CLIENT_ID = "174375671713-4nkbn9ga7v5piqjrokpj454jfinrja9f.apps.googleusercontent.com"; 
const SCOPES = "https://www.googleapis.com/auth/calendar";

export const HomePageUI = ({ user, tasks: propTasks }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [questProgress, setQuestProgress] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [userData, setUserData] = useState(user);
  const profileMenuRef                   = useRef(null);
  const { logout }                       = useAuth0();
  const [isSignedIn, setIsSignedIn] = useState(false);

  function getStartOfWeekISO() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - day); // go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // set to 12:00 AM
  
    return startOfWeek.toISOString();
  }

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

  const handleGoogleCalendarSignIn = () => {
    gapi.load("client:auth2", () => {
      gapi.client
        .init({
          clientId: CLIENT_ID,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
          scope: SCOPES,
        })
        .then(() => gapi.auth2.getAuthInstance().signIn())
        .then(() => {
          setIsSignedIn(true);
  
          return gapi.client.calendar.events.list({
            calendarId: "primary",
            timeMin: getStartOfWeekISO(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 10,
            orderBy: "startTime",
          });
        })
        .then((response) => {
          const events = response.result.items;
          const calendarTasks = events.map(convertEventToTask);
          setTasks((prev) => [...prev, ...calendarTasks]);
        })
        .catch((err) => {
          console.error("Error during Google Calendar integration:", err);
        });
    });
  };   

  const addTaskToGoogleCalendar = async (task) => {
    const event = {
      summary: task.title,
      description: task.description,
      location: task.location,
      start: {
        dateTime: new Date(task.startTime).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(task.endTime).toISOString(),
        timeZone: "UTC",
      },
    };
  
    return gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
  };

  const handleAddTask = async (taskData) => {
    const newTask = {
      taskId: crypto.randomUUID(),
      ...taskData,
      completed: false
    };

    try {
      if (isSignedIn) {
        console.log("trying to add a task");
        const res = await addTaskToGoogleCalendar(newTask);
        newTask.googleEventId = res.result.id;
      }
    } catch (error) {
      console.error("Failed to add event to Google Calendar:", error);
    }

    setTasks([...tasks, newTask]);
    setShowTaskForm(false);

  };

  const handleEditTask = async (taskData) => {
    const updatedTask = { ...editingTask, ...taskData };

    try {
      if (isSignedIn && updatedTask.googleEventId) {
        await gapi.client.calendar.events.update({
          calendarId: "primary",
          eventId: updatedTask.googleEventId,
          resource: {
            summary: updatedTask.title,
            description: updatedTask.description,
            location: updatedTask.location,
            start: {
              dateTime: new Date(updatedTask.startTime).toISOString(),
              timeZone: "UTC",
            },
            end: {
              dateTime: new Date(updatedTask.endTime).toISOString(),
              timeZone: "UTC",
            }
          }
        });
      }
    } catch (err) {
      console.error("Failed to update Google Calendar event:", err);
    }

    setTasks(tasks.map(task =>
      task.taskId === editingTask.taskId ? updatedTask : task
    ));
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.taskId === taskId);
  
    try {
      if (isSignedIn && taskToDelete?.googleEventId) {
        await gapi.client.calendar.events.delete({
          calendarId: "primary",
          eventId: taskToDelete.googleEventId
        });
      }
    } catch (err) {
      console.error("Failed to delete Google Calendar event:", err);
    }

    setTasks(tasks.filter(task => task.taskId !== taskId));
  };

  const handleCompleteTask = async (taskId) => {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) {
      console.log('Task not found:', taskId);
      return;
    }

    try {
      console.log('Current user:', user);
      console.log('Task being completed:', task);

      // Calculate XP for the task using the local function
      const xpGained = Math.round((task.duration / 30) * 10 * (
        task.category === 'work' ? 1.5 :
        task.category === 'study' ? 1.3 :
        task.category === 'exercise' ? 1.4 : 1.0
      ));

      console.log('Calculated XP gain:', xpGained);
      console.log('Making request with userId:', user.sub);

      const requestData = {
        userId: user.sub,
        xpGained: xpGained
      };
      console.log('Sending request data:', requestData);

      const response = await fetch('http://localhost:8080/api/users/xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const progressData = await response.json();
      
      if (!response.ok) {
        throw new Error(progressData.error || 'Failed to update XP');
      }

      // Update all progress-related state
      setQuestProgress(progressData.progress);
      setCurrentLevel(progressData.level);
      setStreak(progressData.streak);
      
      // Update achievements if there are new ones
      if (progressData.achievements?.length > 0) {
        setAchievements(prev => [...progressData.achievements, ...prev].slice(0, 3));
      }

      // Update task completion
      setTasks(tasks.map(t => 
        t.taskId === taskId ? { ...t, completed: true } : t
      ));
      
    } catch (error) {
      console.error('Error updating XP:', error);
      console.error('Error stack:', error.stack);
      // Revert task completion if XP update failed
      setTasks(tasks.map(t => {
        if (t.taskId === taskId) {
          return { ...t, completed: false };
        }
        return t;
      }));
    }
  };

  const handleToggleComplete = async (taskId) => {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) return;

    const xpGained = calculateTaskXP(task);
    const isReverting = task.completed;

    try {
      const response = await fetch('http://localhost:8080/api/users/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.sub,
          xpGained: xpGained,
          revert: isReverting 
        })
      });

      const progressData = await response.json();
      if (!response.ok) throw new Error(progressData.error || 'XP update failed');

      // Update XP UI
      setQuestProgress(progressData.progress);
      setCurrentLevel(progressData.level);
      setStreak(progressData.streak);
      setAchievements(prev => [...progressData.achievements, ...prev].slice(0, 3));

      // Update task state
      setTasks(tasks.map(t =>
        t.taskId === taskId ? { ...t, completed: !isReverting } : t
      ));
    } catch (err) {
      console.error("Failed to update XP:", err);
    }
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
    setShowEditAccount(true);
    setShowProfileMenu(false);
  };

  const handleUpdateUser = (updatedUser) => {
    setUserData(updatedUser);
  };

  // Sample data
  const todayDate = new Date();
  const formattedDate = todayDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const dayOfWeek = todayDate.toLocaleDateString('en-US', { weekday: 'long' });

  const isToday = (input) => {
    const eventDate = new Date(input);
    const today = new Date();
  
    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    );
  };
  
  const todayEvents = tasks.filter(
    task => task.startTime && isToday(task.startTime)
  ).map(task => ({
    id: task.taskId,
    title: task.title,
    time: task.startTime && task.endTime
      ? `${new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(task.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'All Day',
    location: task.location || 'No location',
    color: 'blue', 
  }));
  

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
  const questGoal = 100;

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
              {userData ? userData.name.substring(0, 2).toUpperCase() : 'JD'}
            </div>
            <div className="user-info">
              <div className="user-name">
                {userData ? userData.name : 'John Doe'}
              </div>
              <div className="user-role">
                {userData ? userData.email : 'Product Manager'}
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
            {todayEvents.map(event => (
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
          <button 
            className="sync-calendar-button" 
            onClick={handleGoogleCalendarSignIn}
          >
            Sync with Google Calendar
          </button>

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
                  onClick={() => handleToggleComplete(task.taskId)}
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

      {showEditAccount && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditAccount 
              user={userData} 
              onUpdateUser={handleUpdateUser}
              onClose={() => setShowEditAccount(false)}
            />
            <button 
              className="close-button"
              onClick={() => setShowEditAccount(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

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
