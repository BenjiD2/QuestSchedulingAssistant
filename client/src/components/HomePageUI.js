import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';
import { useAuth0 } from "@auth0/auth0-react";
import TaskForm from './TaskForm';
import Profile from './Profile';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const [dayStreakCount, setDayStreakCount] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [userData, setUserData] = useState(user);
  const profileMenuRef = useRef(null);
  const { logout } = useAuth0();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const TASKS_PER_PAGE = 3;
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const totalTaskPages = Math.ceil(tasks.length / TASKS_PER_PAGE);
  const paginatedTasks = tasks.slice(
    (currentTaskPage - 1) * TASKS_PER_PAGE,
    currentTaskPage * TASKS_PER_PAGE
  );

  useEffect(() => {
    const fetchMongoDBUserData = async () => {
      if (!user || !user.userId) {
        console.log('👤 Synced user data not available yet for HomePageUI fetch.');
        return;
      }

      try {
        console.log(`📊 HomePageUI: Attempting to re-fetch/verify user data for user ID: ${user.userId}`);

        const response = await fetch(`http://localhost:8080/api/users/${encodeURIComponent(user.userId)}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ HomePageUI: Failed to fetch user data (${response.status}):`, errorText);
          return;
        }

        const data = await response.json();
        console.log('✅ HomePageUI: Successfully fetched user data:', data);

        if (data) {
          setQuestProgress(data.xp % 100);
          setCurrentLevel(data.level || 1);
          setStreak(data.streak || 0);
          setDayStreakCount(data.dayStreak || 0);
          setUserData(data);

          if (data.achievements) {
            console.log('✅ HomePageUI: Using achievements from fetched user data:', data.achievements);
            setAchievements(data.achievements);
          } else {
            console.log(`🏅 HomePageUI: Attempting to fetch achievements separately for user ID: ${user.userId}`);
            const achievementsResponse = await fetch(`http://localhost:8080/api/users/${encodeURIComponent(user.userId)}/achievements`);
            if (achievementsResponse.ok) {
              const achievementsData = await achievementsResponse.json();
              console.log('✅ HomePageUI: Successfully fetched separate achievements:', achievementsData);
              setAchievements(achievementsData);
            } else {
              const achievementsErrorText = await achievementsResponse.text();
              console.log(`❌ HomePageUI: Failed to fetch separate achievements (${achievementsResponse.status}):`, achievementsErrorText);
              setAchievements([]);
            }
          }
        } else {
          setQuestProgress(0);
          setCurrentLevel(1);
          setStreak(0);
          setDayStreakCount(0);
          setAchievements([]);
        }
      } catch (error) {
        console.error('❌ HomePageUI: Network or parsing error fetching user data:', error);
      }
    };

    if (user && user.userId) {
      fetchMongoDBUserData();
    }
  }, [user]);

  useEffect(() => {
    const fetchMongoDBTasks = async () => {
      if (!user || !user.userId) {
        console.log('👤 Synced user data not available yet for task fetch in HomePageUI.');
        return;
      }

      try {
        console.log(`📊 HomePageUI: Attempting to fetch tasks for user ID: ${user.userId}`);
        const response = await fetch('http://localhost:8080/api/tasks');

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ HomePageUI: Failed to fetch tasks (${response.status}):`, errorText);
          return;
        }

        const allTasks = await response.json();
        console.log('✅ HomePageUI: Successfully fetched all tasks from MongoDB:', allTasks);

        if (allTasks && allTasks.length > 0) {
          const userSpecificTasks = allTasks.filter(task => task.userId === user.userId);
          console.log(`Found ${userSpecificTasks.length} tasks for current user (${user.userId}) out of ${allTasks.length} total.`);

          if (userSpecificTasks.length > 0) {
            setTasks(userSpecificTasks);
          } else {
            setTasks([]);
            console.log('No tasks found for the current user in MongoDB data.');
          }
        } else if (propTasks && propTasks.length > 0) {
          console.log('Using tasks from props.');
          setTasks(propTasks.filter(task => task.userId === user.userId));
        } else {
          setTasks([]);
          console.log('No tasks from MongoDB or props to display for this user.');
        }
      } catch (error) {
        console.error('❌ HomePageUI: Network or parsing error fetching tasks:', error);
      }
    };

    if (user && user.userId) {
      fetchMongoDBTasks();
    }
  }, [user, propTasks]);

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
          const currentUser = user; // Capture user from the outer scope

          if (!currentUser || !currentUser.userId) {
            console.error('❌ Cannot import Google Calendar tasks: User ID is not available.');
            toast.error('Could not import Google Calendar tasks: User information missing.');
            return;
          }

          console.log(`🔄 Importing ${events.length} Google Calendar events as tasks for user ${currentUser.userId}...`);
          const importPromises = events.map(event => {
            // Ensure userId is added before sending to handleAddTask
            const taskData = convertEventToTask(event);
            const taskWithUser = {
              ...taskData,
              userId: currentUser.userId,
              // handleAddTask will set completed: false by default
            };

            // Check if task with this googleEventId already exists
            const existingTask = tasks.find(t => t.googleEventId === event.id);
            if (existingTask) {
              console.log(`Task with Google Calendar ID ${event.id} already exists, skipping import`);
              return Promise.resolve(); // Skip this task
            }

            // Use handleAddTask to save each task to the backend
            return handleAddTask(taskWithUser, true);
          });

          Promise.all(importPromises)
            .then(() => {
              console.log('✅ All Google Calendar tasks processed for import.');
              toast.success(`${events.length} tasks imported from Google Calendar!`);
              // Tasks are added to local state by handleAddTask, so no explicit setTasks here is needed if handleAddTask does that.
            })
            .catch(importError => {
              console.error('❌ Error during batch import of Google Calendar tasks:', importError);
              toast.error('Some tasks may not have been imported correctly from Google Calendar.');
            });
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

  const handleAddTask = async (taskData, isCalendarImport = false) => {
    const newTaskPayload = {
      // taskId is generated by backend or createTask in mongoStore if not present
      ...taskData,
      userId: taskData.userId || user.userId, // Ensure userId is included, prefer one from taskData if it exists (e.g. from calendar import)
      completed: typeof taskData.completed === 'boolean' ? taskData.completed : false // Default to false if not specified
    };

    if (!isCalendarImport) { // Only log non-calendar imports this way to avoid spam for batch imports
      console.log('➕ Attempting to add new task (client-side):', newTaskPayload);
    }

    let googleEventId = newTaskPayload.googleEventId || null;
    // For non-calendar imports that might need to be added to Google Calendar
    if (!isCalendarImport && isSignedIn && !googleEventId && newTaskPayload.startTime && newTaskPayload.endTime) {
      try {
        console.log("Attempting to add new task to Google Calendar (non-import)");
        const res = await addTaskToGoogleCalendar(newTaskPayload);
        googleEventId = res.result.id;
        newTaskPayload.googleEventId = googleEventId;
        console.log('📅 Task added to Google Calendar, event ID:', googleEventId);
      } catch (error) {
        console.error("❌ Failed to add event to Google Calendar:", error);
        toast.error("Failed to add task to Google Calendar.");
        // Decide if you want to proceed without calendar sync or stop
      }
    } else if (isCalendarImport && googleEventId) {
      // Task from calendar already has googleEventId, no need to re-add
      console.log(`ℹ️ Task from Google Calendar import, already has googleEventId: ${googleEventId}`);
    }

    try {
      if (!isCalendarImport) { // Avoid spam for batch imports
        console.log('➡️ Submitting new task to backend (/api/tasks):', newTaskPayload);
      }
      const backendResponse = await fetch('http://localhost:8080/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTaskPayload),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        console.error('❌ Backend task creation failed:', backendResponse.status, errorData);
        toast.error(`Failed to save task: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const savedTask = await backendResponse.json();
      console.log('✅ Task saved to backend successfully:', savedTask);
      toast.success(`Task "${savedTask.title}" added!`);

      setTasks(prevTasks => [...prevTasks, savedTask]);
      setShowTaskForm(false);
      setEditingTask(null);

    } catch (error) {
      console.error('❌ Error submitting task to backend:', error);
      toast.error('An error occurred while saving the task.');
    }
  };

  const handleEditTask = async (taskData) => {
    if (!editingTask || !editingTask.taskId) {
      console.error('❌ Cannot edit task: editingTask or editingTask.taskId is not defined.');
      toast.error('Error: No task selected for editing.');
      return;
    }

    const updatedTaskPayload = {
      ...editingTask,
      ...taskData,
      userId: editingTask.userId || user.userId
    };
    console.log(`✏️ Attempting to edit task (client-side) ID: ${editingTask.taskId}`, updatedTaskPayload);

    try {
      if (isSignedIn && updatedTaskPayload.googleEventId) {
        console.log(`📅 Updating Google Calendar event ID: ${updatedTaskPayload.googleEventId}`);
        await gapi.client.calendar.events.update({
          calendarId: "primary",
          eventId: updatedTaskPayload.googleEventId,
          resource: {
            summary: updatedTaskPayload.title,
            description: updatedTaskPayload.description,
            location: updatedTaskPayload.location,
            start: {
              dateTime: new Date(updatedTaskPayload.startTime).toISOString(),
              timeZone: "UTC",
            },
            end: {
              dateTime: new Date(updatedTaskPayload.endTime).toISOString(),
              timeZone: "UTC",
            },
          },
        });
        console.log('📅 Google Calendar event updated successfully.');
      } else if (isSignedIn && !updatedTaskPayload.googleEventId && taskData.startTime && taskData.endTime) {
        console.log('📅 Task was not on Google Calendar, attempting to add it now.');
        const res = await addTaskToGoogleCalendar(updatedTaskPayload);
        updatedTaskPayload.googleEventId = res.result.id;
        console.log('📅 Task added to Google Calendar during edit, event ID:', updatedTaskPayload.googleEventId);
      }
    } catch (error) {
      console.error("❌ Failed to update/add event to Google Calendar:", error);
      toast.error("Failed to update task on Google Calendar.");
    }

    try {
      console.log(`➡️ Submitting updated task to backend (/api/tasks/${editingTask.taskId}):`, updatedTaskPayload);
      const backendResponse = await fetch(`http://localhost:8080/api/tasks/${editingTask.taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTaskPayload),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        console.error('❌ Backend task update failed:', backendResponse.status, errorData);
        toast.error(`Failed to update task: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const savedUpdatedTask = await backendResponse.json();
      console.log('✅ Task updated in backend successfully:', savedUpdatedTask);
      toast.success(`Task "${savedUpdatedTask.title}" updated!`);

      setTasks(tasks.map(t => t.taskId === savedUpdatedTask.taskId ? savedUpdatedTask : t));
      setShowTaskForm(false);
      setEditingTask(null);

    } catch (error) {
      console.error('❌ Error submitting task update to backend:', error);
      toast.error('An error occurred while updating the task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.taskId === taskId);
    if (!taskToDelete) {
      console.error('❌ handleDeleteTask: Task not found with ID:', taskId);
      toast.error('Error: Task to delete not found.');
      return;
    }
    console.log(`🗑️ Attempting to delete task (client-side) ID: ${taskId}, Name: "${taskToDelete.title}"`);

    // Google Calendar Integration (existing logic)
    try {
      if (isSignedIn && taskToDelete.googleEventId) {
        console.log(`📅 Deleting Google Calendar event ID: ${taskToDelete.googleEventId}`);
        await gapi.client.calendar.events.delete({
          calendarId: "primary",
          eventId: taskToDelete.googleEventId
        });
        console.log('📅 Google Calendar event deleted successfully.');
      }
    } catch (err) {
      console.error("❌ Failed to delete Google Calendar event:", err);
      toast.warn("Failed to delete task from Google Calendar, but proceeding with backend deletion.");
    }

    // Backend Integration
    try {
      console.log(`➡️ Submitting delete request to backend (/api/tasks/${taskId})`);
      const backendResponse = await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          // 'Authorization': `Bearer ${await getAccessTokenSilently()}`,
        },
      });

      if (!backendResponse.ok) {
        // Status 204 means success but no content, so also check for that
        if (backendResponse.status === 204) {
          console.log('✅ Task deleted from backend successfully (204 No Content).');
          toast.success(`Task "${taskToDelete.title}" deleted!`);
          setTasks(tasks.filter(task => task.taskId !== taskId));
        } else {
          const errorData = await backendResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
          console.error('❌ Backend task deletion failed:', backendResponse.status, errorData);
          toast.error(`Failed to delete task: ${errorData.error || 'Unknown error'}`);
        }
        return; // Stop if backend delete fails or handled by 204
      }

      // For 200 OK with potential JSON body (though DELETE often returns 204)
      console.log('✅ Task deleted from backend successfully:', await backendResponse.json().catch(() => ({})));
      toast.success(`Task "${taskToDelete.title}" deleted!`);
      setTasks(tasks.filter(task => task.taskId !== taskId));

    } catch (error) {
      console.error('❌ Error submitting task deletion to backend:', error);
      toast.error('An error occurred while deleting the task.');
    }
  };

  const handleCompleteTask = async (taskId) => {
    console.warn('DEPRECATED: handleCompleteTask called. Use handleToggleComplete instead.');
    await handleToggleComplete(taskId, true); // Force completion
  };

  const handleToggleComplete = async (taskId, forceComplete = null) => {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) {
      console.error('❌ handleToggleComplete: Task not found with ID:', taskId);
      toast.error('Error: Task not found to toggle completion.');
      return;
    }

    const isCompleting = forceComplete !== null ? forceComplete : !task.completed;
    const action = isCompleting ? 'Completing' : 'Uncompleting';

    console.log(`🔄 Attempting to ${action} task (client-side) ID: ${taskId}, Name: "${task.title}"`);

    const updatePayload = { completed: isCompleting };

    // Backend Integration for toggling completion
    try {
      console.log(`➡️ Submitting task completion update to backend (/api/tasks/${taskId}):`, updatePayload);
      const backendResponse = await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${await getAccessTokenSilently()}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error(`❌ Backend task ${action.toLowerCase()} failed:`, backendResponse.status, errorData);
        toast.error(`Failed to ${action.toLowerCase()} task: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const updatedTaskFromBackend = await backendResponse.json();
      console.log(`✅ Task ${action.toLowerCase()} in backend successfully:`, updatedTaskFromBackend);
      toast.success(`Task "${updatedTaskFromBackend.title}" ${isCompleting ? 'completed' : 'marked incomplete'}!`);

      // Update local tasks state with the task from backend
      setTasks(prevTasks => prevTasks.map(t => t.taskId === taskId ? updatedTaskFromBackend : t));

      // IMPORTANT: XP and Level are now handled by the backend within mongoStore.updateTask.
      // The response from the PUT /api/tasks/:id for completion should ideally give us enough info,
      // or we trigger a user data refresh.
      // For now, let's assume the updatedTaskFromBackend might contain relevant XP hints if designed so,
      // or we can re-fetch user data to update XP/level display.

      // If the backend `updateTask` in `mongoStore` also returns updated user progress or similar,
      // you could use that here to update questProgress, currentLevel, streak, achievements.
      // For example, if `updatedTaskFromBackend.userProgress` existed:
      // if (updatedTaskFromBackend.userProgress) {
      //   setQuestProgress(updatedTaskFromBackend.userProgress.xp % 100);
      //   setCurrentLevel(updatedTaskFromBackend.userProgress.level || 1);
      //   setStreak(updatedTaskFromBackend.userProgress.streak || 0);
      //   // Handle achievements update from userProgress if necessary
      //   console.log('🏅 User progress updated from task completion:', updatedTaskFromBackend.userProgress);
      // }
      // As a simpler alternative for now, re-fetch user data after successful completion/uncompletion:
      if (user && user.userId) {
        console.log('🔄 Re-fetching user data after task completion toggle to update XP/Level/Achievements...');
        // Re-use the existing fetchMongoDBUserData logic
        const userResponse = await fetch(`http://localhost:8080/api/users/${encodeURIComponent(user.userId)}`);
        if (userResponse.ok) {
          const updatedUserData = await userResponse.json();
          if (updatedUserData) {
            setQuestProgress(updatedUserData.xp % 100);
            setCurrentLevel(updatedUserData.level || 1);
            setStreak(updatedUserData.streak || 0);
            setDayStreakCount(updatedUserData.dayStreak || 0);
            // Fetch and set achievements again as they might have changed
            const achievementsResponse = await fetch(`http://localhost:8080/api/users/${encodeURIComponent(user.userId)}/achievements`);
            if (achievementsResponse.ok) {
              setAchievements(await achievementsResponse.json());
            }
            console.log('✅ User data (XP, Level, Achievements) refreshed after task toggle.');
          }
        } else {
          console.error('❌ Failed to re-fetch user data after task toggle.');
        }
      }

    } catch (error) {
      console.error(`❌ Error submitting task ${action.toLowerCase()} to backend:`, error);
      toast.error(`An error occurred while ${action.toLowerCase()} the task.`);
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
              <strong>{title}</strong><br />
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
    {
      day: 'Mon', date: 21, events: [
        { time: '9:00 AM', title: 'Team Meeting', color: 'blue' },
        { time: '2:00 PM', title: 'Project Review', color: 'green' }
      ]
    },
    { day: 'Tue', date: 22, events: [] },
    {
      day: 'Wed', date: 23, events: [
        { time: '11:00 AM', title: 'Client Call', color: 'purple' }
      ]
    },
    { day: 'Thu', date: 24, events: [] },
    {
      day: 'Fri', date: 25, events: [
        { time: '3:30 PM', title: 'Weekly Sync', color: 'yellow' }
      ]
    },
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
            <div className="card-header">
              <h2>Tasks</h2>
              <span className="check-icon"></span>
              <button
                className="sync-calendar-button"
                onClick={handleGoogleCalendarSignIn}
              >
                Sync with Google Calendar
              </button>
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
              {paginatedTasks.map(task => (
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
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentTaskPage(p => Math.max(p - 1, 1))}
                disabled={currentTaskPage === 1}
              >
                Prev
              </button>
              <span>Page {currentTaskPage} of {totalTaskPages}</span>
              <button
                onClick={() => setCurrentTaskPage(p => Math.min(p + 1, totalTaskPages))}
                disabled={currentTaskPage === totalTaskPages}
              >
                Next
              </button>
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

      {activeTab === 'profile' && (
        <Profile
          user={userData}
          onClose={() => setActiveTab('tasks')}
          currentLevel={currentLevel}
          questProgress={questProgress}
          dayStreak={dayStreakCount}
          achievements={achievements}
        />
      )}
    </div>
  );
};

export default HomePageUI;
