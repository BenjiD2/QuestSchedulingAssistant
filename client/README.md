# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


# QuestSchedulingAssistant — Milestone 3.b

## Table of Contents

1. [Overview](#overview)
2. [Installation & Compilation](#installation--compilation)
3. [Running the Application](#running-the-application)
4. [Running Unit Tests](#running-unit-tests)
5. [Suggested Acceptance Tests](#suggested-acceptance-tests)
6. [Implementation Details](#implementation-details)
7. [Team Contributions](#team-contributions)
8. [Changes Since Last Milestone](#changes-since-last-milestone)
9. [Notes](#notes)

---

## Overview


\- Onboarding and UI (Alberto and Isis): added logic to handle authentication and greeting the user, all tests from 1.a passed.

---

## Installation & Compilation

1. **Root (if applicable)**

   ```bash
   # only if root has a package.json
   npm install
   ```
2. **Client**

   ```bash
   cd client
   npm install
   ```
3. **Server (tests)**

   ```bash
   cd ../server
   npm install
   ```

---

## Running the Application

### Frontend

```bash
cd client
npm start
# opens http://localhost:3000
```

### Backend

```bash
cd server
npm start
```

---

## Running Unit Tests

From the **server/** folder:

* Run all tests:

  ```bash
  npm test
  ```
* Run only onboarding/auth tests:

  ```bash
  npx jest server/tests/unit/test_filename --watchAll=false
  ```

---

## Suggested Acceptance Tests

Authentication and onboarding UI

| Scenario                          | Steps                                    | Expected outcome                                      |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Unauthenticated onboarding screen | Navigate to `/` when not logged in       | “Welcome to QuestChampion” + Register & Login buttons |
| Register button                   | Click **Register**                       | `auth.register()` is invoked                          |
| Login button                      | Click **Login**                          | `auth.login()` is invoked                             |
| Authenticated onboarding greeting | Simulate `auth.isAuthenticated() → true` | Displays “Hello, {user.name}”                         |
| HomePage greeting & tasks         | Render `HomePageUI user={…} tasks=[…]`   | Renders `<h1>Hello, …</h1>` and correct `<li>` count  |

---

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
  * Maps React/React-DOM to client’s copy to avoid invalid hook calls.

---

## Team Contributions

| Pair / Person      | Responsibilities                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Alberto & Isis** | Implemented React Auth branching in OnboardingUI and HomePageUI; wrote corresponding unit tests. |
| *(other pairs)*    |                                                                                                  |

---

## Changes Since Last Milestone

* Added test-mode branching in both components to satisfy unit tests without altering production behavior.
* Configured Jest to mock CSS and unify React copies (`moduleNameMapper`).
* No changes to core design or user stories; only test support and build config.

---

## Notes

* Keep `client/.env` (Auth0 domain & client ID) gitignored for real login.
*
