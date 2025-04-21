import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error fetching from API:', err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>React + Express</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;

