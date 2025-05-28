## Compilation

To compile and set up the project:

1. Install dependencies:
```bash
make install
```
This will install dependencies for both client and server.

2. Build the project:
```bash
make build
```
This will:
- Build the React client
- Install server dependencies

## Running the Application

1. Start both client and server:
```bash
make start
```
This will:
- Start the server on port 8080
- Start the client on port 3000

2. Access the application:
- Open your browser and navigate to `http://localhost:3000`

Note: If you need to debug or see logs from either the client or server separately, you can start them individually:
```bash
# Start server only
cd server && npm start

# Start client only (in a separate terminal)
cd client && npm start
```

### Environment Setup
Before running the application, make sure you have the following environment files set up:

Please email us for the exact values. We cannot add them here due to security issues. 

1. Server (server/.env):
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
PORT=8080
SONAR_API_KEY=
```

2. Client (client/.env):
```
REACT_APP_AUTH0_DOMAIN=your_auth0_domain
REACT_APP_AUTH0_CLIENT_ID=your_auth0_client_id
REACT_APP_AUTH0_CALLBACK_URL=http://localhost:3000/callback
REACT_APP_API_URL=http://localhost:8080
PORT=3000
```

### Running Tests
```bash
# Run all tests (client and server)
make test

# Run only client tests
make test-client

# Run only server tests (Includes unit and acceptance tests)
cd server && npm test
```

### Test Files Structure
```
server/tests/unit/
├── task.test.js              # Unit tests for Task model
├── taskManager.test.js       # Integration tests for TaskManager service
├── calendarService.test.js   # Tests for Google Calendar integration
├── taskOperations.test.js    # Tests for task CRUD operations
├── updateSchedule.test.js    # End-to-end tests for schedule updates
└── sonarTimeEstimate.test.js # Unit tests for AI-powered time estimation
server/tests/acceptance/
├── acceptance.test.js        # Acceptance tests for core API endpoint behavior and validation

client/src/__tests__/
├── GoogleCalendar.test.js    # Unit Tests for Google Calendar integration
├── App.test.js              # Tests basic rendering of the main application component
└── onboardingAuthenticationUI.test.js  # Unit tests for user onboarding and authentication
```

## Test Output

When you run the server tests using `cd server && npm test`, you will see output similar to this (specific test names and timings may vary):

```
> server@1.0.0 test
> jest

 PASS   server  tests/unit/eventsToTasks.test.js
 PASS   server  tests/unit/task.test.js
 PASS   server  tests/unit/taskOperations.test.js
 PASS   server  tests/unit/storeData.test.js
 PASS   server  tests/unit/taskManager.test.js
 PASS   server  tests/unit/calendarService.test.js
 PASS   server  tests/unit/sonarTimeEstimate.test.js
 PASS   server  tests/unit/updateSchedule.test.js
 PASS   server  tests/acceptance/acceptance.test.js

---------------------------|---------|----------|---------|---------|---------------------------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------------|---------|----------|---------|---------|---------------------------------------
All files                  |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
 [Detailed coverage information follows] 
---------------------------|---------|----------|---------|---------|---------------------------------------
Test Suites: X passed, X total
Tests:       Y passed, Y total
Snapshots:   Z total
Time:        X.XXX s, estimated Y s
Ran all test suites.
```

This output shows each test suite that was run, whether it passed (`PASS`) or failed (`FAIL`), and a summary at the end indicating the total number of test suites and tests, along with code coverage information.

## Acceptance Test Details

The acceptance tests located in `server/tests/acceptance/acceptance.test.js` verify key behaviors of the server API endpoints. These tests are designed to confirm that the application responds as expected to various requests, focusing on endpoint accessibility and input validation, independent of database persistence.

Here are the specific scenarios covered by the current acceptance tests:

*   **Root Endpoint Accessibility:** Verifies that the root endpoint (`/`) is accessible and returns a 200 status code with the expected welcome message (`Quest Scheduling Assistant API`). This confirms the basic functionality of the server being up and running.
*   **User XP Update Endpoint Input Validation (`POST /api/users/xp`):** Tests that this endpoint correctly handles invalid input. It specifically checks that a 400 status code and an appropriate error message are returned when the `userId` is missing or invalid, or when `xpGained` is not a valid positive number. This demonstrates the server's input validation logic for this critical endpoint.
*   **Calendar Events Endpoint Token Requirement (`GET /calendar/events`):** Confirms that attempting to access the calendar events endpoint without providing an access token results in a 400 status code and a specific error message indicating that the token is required. This verifies a necessary security/authentication check for this endpoint.
*   **Time Estimation Endpoint Accessibility (`POST /api/estimate-time` - Placeholder):** This test checks for the basic accessibility of a time estimation endpoint. It verifies that a POST request to this endpoint receives a successful response (status code 200-399), indicating that the endpoint is reachable and generally functioning, although it does not validate the estimation logic itself. *Note: You may need to adjust the endpoint path in the test file (`server/tests/acceptance/acceptance.test.js`) to match your actual implementation of the time estimation endpoint.* This test demonstrates that the API route for time estimation is set up and responsive.

These acceptance tests provide confidence that the core API endpoints are correctly defined, accessible, and perform basic input validation as expected, contributing to the overall reliability of the application's server-side functionality.

## Milestone 4b

In the first iteration, we completed the basic functionality of the web app, including creating a dashboard UI, integrating the Google Calendar API, adding/deleting/modifying tasks, and updating users' schedules accordingly. 

In this second iteration, we're focusing on improving usability by integrating the backend with the frontend and connecting to a database to store users' account information. We will gamify task completion, implementing points and streaks to track users' progress. In addition to account info, the database will store these points and streak information as well. Additionally, we will connect to a Large Language Model (Perplexity) API to compute estimates about task duration and improve the intelligence of our scheduling app.

Iteration 2: Planned Implementations
- Points System & Gamification
  • Implement points tracking for task completion
  • Create visual indicators for earned points

- Database Integration
  • Set up user data storage to store user authentication and persist data
  • Maintain point history

- Quest Streaks
  • Develop streak tracking system
  • Implement streak-based rewards

- AI-Powered Task Estimation
  • Integrate AI model for task duration prediction
  • Implement smart scheduling suggestions

- Frontend Integration
  • View upcoming events pulled from their Google Calendar.
  • Create and delete events directly from the interface.

| Use Case                                  | Students                                     |
|-------------------------------------------|----------------------------------------------|
| Add & Manage points                       | Raouf Abujaber & Reece VanDeWeghe            |
| Store user data in database               | Alberto Chiapparoli                          |
| Display quest streaks                     | Brayley Starr                                |
| AI-generate time estimates for tasks      | Isis Decrem & Emily Bae                      |
| Integrate with frontend                   | Benji Duan & Kanchan Naik                    |


## Implementation Details
 
 * **OnboardingUI**
 
   * Real-mode: redirects unauthenticated users via Auth0 Universal Login with spinner UI; then shows greeting.
   * Test-mode: branches on an `auth` prop to render welcome/register/login or greeting based on `auth.isAuthenticated()`.
 
 * **HomePageUI**
 
   * Hooks (`useState`, `useRef`, `useAuth0`, `useEffect`) called unconditionally at top.
   * Test-mode: early return when `tasks` prop is array → renders greeting + `<li>` list for tests.
   * Real-mode: full dashboard UI plus personalized greeting.
 
 * **Jest config**
 
   * Mocks CSS imports via `identity-obj-proxy`.
   * Maps React/React-DOM to client's copy to avoid invalid hook calls.

 * **Google Authenticate & Import Calendar**
    * Google OAuth 2.0 authentication flow
    * Automatic Google Calendar API client initialization
    * Calendar event fetching and display

 * **Task Management & Scheduling**
    * UTC-based date handling for consistent timezone operations
    * Schedule conflict detection with timezone-aware comparisons
    * Recurring task support with proper date handling
    * Calendar sync with UTC timezone preservation
    * Comprehensive error handling for date operations

 * **AI-Powered Time Estimation**
    * Integration with Perplexity's Sonar API for intelligent task duration estimation
    * Input validation for task descriptions (minimum length, non-empty)
    * Structured JSON response handling with hours and minutes
    * Comprehensive error handling:
      - API rate limiting
      - Network failures
      - Authentication errors
      - Timeout handling
      - Malformed responses
    * Task integration with automatic duration updates
    * Support for decimal hours and zero-duration tasks

 * **Date and Time Handling**
    * All dates stored and compared in UTC format
    * Automatic timezone conversion for user display
    * Validation for time ranges and schedule conflicts
    * Support for back-to-back tasks without conflicts
    * Proper handling of daylight saving time transitions

* **User Data Storage & Testing**
   * Service functions: createUser, getUserById, updateUserXP, updateUserStreak, addAchievement, addCompletedTask.
   * Unit tests mock dbClient to verify:
   * createUser calls insert('users', userData) and returns created record.
   * getUserById calls select('users', { id }) and returns first match or null.
   * updateUserXP and updateUserStreak call update('users', { id }, { xp/streak }).
   * addAchievement and addCompletedTask append to arrays and call update accordingly.

 
 ## Notes
 
 * Keep `client/.env` (Auth0 domain & client ID) gitignored for real login
 * All dates are handled in UTC format internally for consistency
 * Calendar sync operations preserve UTC timezone information

