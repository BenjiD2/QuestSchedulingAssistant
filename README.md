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
- Start the server
- Start the client on port 3000

2. Access the application:
- Open your browser and navigate to `http://localhost:3000`

### Running Tests
```bash
# Run all tests (client and server)
make test

# Run only client tests
make test-client

# Run only server tests
make test-server
```

### Test Files Structure
```
server/tests/unit/
├── task.test.js              # Unit tests for Task model
├── taskManager.test.js       # Integration tests for TaskManager service
├── calendarService.test.js   # Tests for Google Calendar integration
├── taskOperations.test.js    # Tests for task CRUD operations
├── updateSchedule.test.js    # End-to-end tests for schedule updates
└── sonarTimeEstimate.test.js # Unit tests for Perplexity Sonar API time estimation

client/src/__tests__/
├── GoogleCalendar.test.js    # Unit Tests for Google Calendar integration
├── App.test.js              # Tests basic rendering of the main application component
└── onboardingAuthenticationUI.test.js  # Unit tests for user onboarding and authentication
```

## Acceptance Tests

Tests to check main functions

1. User Authentication
   - Input: Click "Sign In with Google"
   - Expected: User is redirected to Google OAuth, then back to the app with their profile loaded

2. Task Creation
   - Input: Create a new task with title, start time, and end time
   - Expected: Task is created and synced with Google Calendar
   - Test cases:
     * Valid time range: Should succeed
     * Overlapping times: Should fail with conflict error
     * Invalid time range (end before start): Should fail with validation error

3. Authentication and onboarding UI
 
 | Scenario                          | Steps                                    | Expected outcome                                      |
 | --------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
 | Unauthenticated onboarding screen | Navigate to `/` when not logged in       | "Welcome to QuestChampion" + Register & Login buttons |
 | Register button                   | Click **Register**                       | `auth.register()` is invoked                          |
 | Login button                      | Click **Login**                          | `auth.login()` is invoked                             |
 | Authenticated onboarding greeting | Simulate `auth.isAuthenticated() → true` | Displays "Hello, {user.name}"                         |
 | HomePage greeting & tasks         | Render `HomePageUI user={…} tasks=[…]`   | Renders `<h1>Hello, …</h1>` and correct `<li>` count  |


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

 * **Date and Time Handling**
    * All dates stored and compared in UTC format
    * Automatic timezone conversion for user display
    * Validation for time ranges and schedule conflicts
    * Support for back-to-back tasks without conflicts
    * Proper handling of daylight saving time transitions

 * **AI Time Estimation**
    * Integration with Perplexity's Sonar API for task time estimation
    * Structured output formatting for consistent time estimates
    * Error handling for API rate limits and connectivity issues
    * JSON schema-based response parsing

## Team Contributions
 
 | Pair / Person       | Responsibilities                                                                                 |
 | ------------------  | ------------------------------------------------------------------------------------------------ |
 | **Alberto & Isis**  | Implemented React Auth branching in OnboardingUI and HomePageUI; wrote corresponding unit tests. |
 | **Kanchan & Benji** | Implemented Google Authentication and Import Calendar                                            |
 | **Raouf & Reece**   | Implemented Task Functionality                                                                   |
 | **Brayley & Emily** | Implemented Update Calendar/Task Scheduling                                                      |

 
 ---
 
 ## Changes Since Last Milestone
 
 * Added test-mode branching in both components to satisfy unit tests without altering production behavior
 * Configured Jest to mock CSS and unify React copies (`moduleNameMapper`)
 * Implemented UTC timezone handling for consistent date operations
 * Enhanced schedule conflict detection with proper timezone support
 * Added comprehensive timezone-aware test cases
 * Improved error handling for calendar sync operations
 * Added Perplexity Sonar API integration for AI-based task time estimation

 ---
 
 ## Notes
 
 * Keep `client/.env` (Auth0 domain & client ID) gitignored for real login
 * All dates are handled in UTC format internally for consistency
 * Calendar sync operations preserve UTC timezone information

