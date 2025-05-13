const { convertEventToTask, convertEventsToTasks } = require("./calendarConverter"); // update path if needed

describe("convertEventToTask", () => {
  it("converts an event with a defined start and end to a task object", () => {
    const event = {
      id: "abc123",
      summary: "Meeting",
      description: "Discuss project",
      start: { dateTime: "2025-05-01T10:00:00Z" },
      end: { dateTime: "2025-05-01T11:30:00Z" },
      location: "Zoom",
    };

    const task = convertEventToTask(event);

    expect(task.title).toBe("Meeting");
    expect(task.description).toBe("Discuss project");
    expect(task.startTime).toBe("2025-05-01T10:00:00Z");
    expect(task.endTime).toBe("2025-05-01T11:30:00Z");
    expect(task.duration).toBe(90);
    expect(task.location).toBe("Zoom");
    expect(task.googleEventId).toBe("abc123");
    expect(task.xpValue).toBe(Math.round((90 / 30) * 10));
  });

  it("uses default duration and title if missing", () => {
    const event = {
      id: "noTitle",
      start: { date: "2025-05-02" },
      end: { date: "2025-05-02" },
    };

    const task = convertEventToTask(event);

    expect(task.title).toBe("Untitled Event");
    expect(task.duration).toBe(60); // default
    expect(task.startTime).toBe("2025-05-02");
    expect(task.endTime).toBe("2025-05-02");
    expect(task.xpValue).toBe(Math.round((60 / 30) * 10));
  });

  it("handles missing end time gracefully", () => {
    const event = {
      id: "noEnd",
      summary: "All-day",
      start: { date: "2025-05-03" },
    };

    const task = convertEventToTask(event);

    expect(task.endTime).toBeNull();
    expect(task.duration).toBe(60); // fallback
  });
});

describe("convertEventsToTasks", () => {
  it("converts a list of events to tasks", () => {
    const events = [
      {
        id: "event1",
        summary: "Event 1",
        start: { dateTime: "2025-05-01T08:00:00Z" },
        end: { dateTime: "2025-05-01T09:00:00Z" },
      },
      {
        id: "event2",
        summary: "Event 2",
        start: { date: "2025-05-02" },
        end: { date: "2025-05-02" },
      },
    ];

    const tasks = convertEventsToTasks(events);
    expect(tasks.length).toBe(2);
    expect(tasks[0].title).toBe("Event 1");
    expect(tasks[1].title).toBe("Event 2");
  });
});
