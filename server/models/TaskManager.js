class TaskManager {
    constructor() {
      this.tasks = []; 
    }
  
    // add new task + filter input type 
    addTask(task) {
      if (task instanceof Task) {
        this.tasks.push(task);

        // TODO: call GoogleCalendarService's createOrupdateEvent method 
      } else {
        throw new Error("Only instances of Task can be added.");
      }
    }

    // fetch tasks
    getAllTasks() {
        return this.tasks;
        // TODO: query GoogleCalendarService for updated tasks on GC 
    }
  
    // edits attributes of existing Task object in 'tasks' 
    editTask(taskId, title, description, startTime, endTime, duration, location, recurrence, completed, googleEventId, xpValue, category) {
        const task = this.tasks.find(t => t.taskId === taskId);
      
        if (!task) {
          throw new Error(`Task with taskId ${taskId} not found.`);
        }
      
        // update task attributes 
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (startTime !== undefined) task.startTime = startTime;
        if (endTime !== undefined) task.endTime = endTime;
        if (duration !== undefined) task.duration = duration;
        if (location !== undefined) task.location = location;
        if (recurrence !== undefined) task.recurrence = recurrence;
        if (completed !== undefined) task.completed = completed;
        if (googleEventId !== undefined) task.googleEventId = googleEventId;
        if (xpValue !== undefined) task.xpValue = xpValue;
        if (category !== undefined) task.category = category;

        //TODO: call GoogleCalendarService's createOrUpdateEvent method 
      }
      
    // delete existing Task from 'tasks'
    deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.taskId === taskId);
        if (index !== -1) {
          this.tasks.splice(index, 1);
        } else {
          throw new Error(`Task with taskId ${taskId} not found.`);
        }
      }
  
  }
  