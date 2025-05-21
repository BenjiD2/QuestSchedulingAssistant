
function convertEventToTask(event) {
  const start = event.start.dateTime || event.start.date;
  const end = event.end?.dateTime || event.end?.date || null;

  let duration = 60;
  if (event.start.dateTime && event.end?.dateTime) {
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    duration = Math.round((endTime - startTime) / 60000);
  }

  return {
    taskId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10),
    title: event.summary || "Untitled Event",
    description: event.description || "",
    startTime: start,
    endTime: end,
    duration,
    location: event.location || "",
    recurrence: event.recurrence || "",
    completed: false,
    googleEventId: event.id,
    xpValue: Math.round((duration / 30) * 10),
    category: "default"
  };
}

export default convertEventToTask;
