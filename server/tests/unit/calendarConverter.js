const convertEventToTask = (event) => {
  if (!event.start) {
    throw new Error('Event must have a start time');
  }

  const startTime = event.start.dateTime || event.start.date;
  const endTime = event.end ? (event.end.dateTime || event.end.date) : null;
  
  // Calculate duration in minutes
  let duration = 60; // default duration
  if (startTime && endTime) {
    // If it's a date-only event (all-day), use default duration
    if (!event.start.dateTime && !event.end.dateTime) {
      duration = 60;
    } else {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = Math.round((end - start) / (1000 * 60));
    }
  }

  return {
    googleEventId: event.id,
    title: event.summary || 'Untitled Event',
    description: event.description || '',
    startTime: startTime,
    endTime: endTime,
    duration: duration,
    location: event.location || '',
    isRecurring: !!event.recurrence,
    recurrenceRule: event.recurrence ? event.recurrence[0] : null,
    xpValue: Math.round((duration / 30) * 10) // 10 XP per 30 minutes
  };
};

const convertEventsToTasks = (events) => {
  return events.map(convertEventToTask);
};

module.exports = {
  convertEventToTask,
  convertEventsToTasks
}; 