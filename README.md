# QuestSchedulingAssistant

## Test Suite

The test suite for this project is located in the `server/tests/unit/` directory. The tests are organized by component:

### Test Files Structure
```
server/tests/unit/
├── task.test.js          # Unit tests for Task model
├── taskManager.test.js   # Integration tests for TaskManager service
├── calendarService.test.js # Tests for Google Calendar integration
└── updateSchedule.test.js  # End-to-end tests for schedule updates
```

### Running Tests
To run the test suite:
```bash
cd server
npm test
```

To run tests in watch mode during development:
```bash
npm run test:watch
```

### Test Coverage
The test suite covers:
- Task creation and validation
- Schedule updates and conflict detection
- Calendar synchronization
- Data consistency
- Error handling and recovery
- Concurrent operations
