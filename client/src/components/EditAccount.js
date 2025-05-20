// Component for editing user account information.
// Allows users to update their profile and view achievements.

import React, { useState, useEffect } from 'react';
import './EditAccount.css';

const EditAccount = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // Fetch user achievements when component mounts
    const fetchAchievements = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/users/${user.sub}/achievements`);
        if (response.ok) {
          const data = await response.json();
          setAchievements(data);
        }
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      }
    };

    if (user?.sub) {
      fetchAchievements();
    }
  }, [user?.sub]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(`http://localhost:8080/api/users/${user.sub}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdateUser(updatedUser);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        setMessage({ text: 'Failed to update profile', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while updating profile', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-account-container">
      <div className="edit-account-content">
        <h1>Edit Account</h1>
        
        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Save Changes'}
          </button>
        </form>

        {/* Achievements Section */}
        <div className="achievements-section">
          <h2>Your Achievements</h2>
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <div key={index} className="achievement-card">
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <h3>{achievement.name}</h3>
                  <p>{achievement.description}</p>
                  <span className="achievement-date">
                    {new Date(achievement.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="no-achievements">No achievements yet. Complete tasks to earn achievements!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAccount; 