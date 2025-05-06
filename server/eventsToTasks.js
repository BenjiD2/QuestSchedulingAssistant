const crypto = require("crypto"); 

// converts a single event from Google Calendar into a Task based on Task.js schema
function convertEventToTask(event) {
  const start = event.start.dateTime || event.start.date; // Fallback to all-day event
  const end = event.end?.dateTime || event.end?.date || null;

  // estimate duration of event
  let duration = 60; // default
  if (event.start.dateTime && event.end?.dateTime) {
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    duration = Math.round((endTime - startTime) / 60000); // ms to min
  }

  // create a task
  const task = {
    taskId: crypto.randomUUID(),
    title: event.summary || "Untitled Event",
    description: event.description || "",
    startTime: start,
    endTime: end,
    duration: duration,
    location: event.location || "",
    recurrence: event.recurrence || [],
    completed: false,
    googleEventId: event.id,
    xpValue: Math.round((duration / 30) * 10),
    category: "default", 
  };

  return task;
}

// Convert a list of calendar events to tasks
function convertEventsToTasks(events) {
  return events.map(convertEventToTask);
}

module.exports = {
  convertEventsToTasks,
  convertEventToTask,
};
