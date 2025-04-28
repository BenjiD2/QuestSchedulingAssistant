import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import GoogleCalendar from "./GoogleCalendar";

function App() {
  return (
    <div className="app">
      <Dashboard />
      <GoogleCalendar />
    </div>
  );
}

export default App;

