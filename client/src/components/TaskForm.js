import React, { useState, useEffect } from 'react';
import './TaskForm.css';

const TaskForm = ({ task, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    category: 'default',
    startTime: '',
    endTime: '',
    location: ''
  });

  const [aiEstimate, setAiEstimate] = useState(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState(null);
  const [showEstimatePopup, setShowEstimatePopup] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        duration: task.duration || 30,
        category: task.category || 'default',
        startTime: task.startTime ? new Date(task.startTime).toISOString().slice(0, 16) : '',
        endTime: task.endTime ? new Date(task.endTime).toISOString().slice(0, 16) : '',
        location: task.location || ''
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAiEstimate = async () => {
    if (!formData.title || !formData.description) {
      setEstimateError('Please add a title and description for an estimation');
      return;
    }

    setIsLoadingEstimate(true);
    setEstimateError(null);

    try {
      const response = await fetch('http://localhost:8080/api/estimate-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get time estimate');
      }

      const data = await response.json();
      // Convert hours and minutes to total minutes
      const totalMinutes = (data.hours * 60) + data.minutes;
      setAiEstimate({
        minutes: totalMinutes,
        reasoning: data.reasoning
      });
      setShowEstimatePopup(true);
    } catch (error) {
      setEstimateError('Failed to get time estimate. Please try again.');
    } finally {
      setIsLoadingEstimate(false);
    }
  };

  const acceptEstimate = () => {
    const newDuration = aiEstimate.minutes;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        duration: newDuration
      };
      
      // Update end time if start time is set
      if (prev.startTime) {
        const start = new Date(prev.startTime);
        const end = new Date(start.getTime() + newDuration * 60000);
        newFormData.endTime = end.toISOString().slice(0, 16);
      }
      
      return newFormData;
    });
    setAiEstimate(null);
    setShowEstimatePopup(false);
  };

  const modifyEstimate = () => {
    setShowEstimatePopup(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.duration || !formData.startTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Calculate end time based on duration if not set
    if (!formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(start.getTime() + formData.duration * 60000);
      formData.endTime = end.toISOString().slice(0, 16);
    }

    onSubmit(formData);
    onClose();
  };

  return (
    <div className="task-form-overlay">
      <div className="task-form-container">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{task ? 'Edit Task' : 'Add New Task'}</h2>

        <form onSubmit={handleSubmit} data-testid="task-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="default">Default</option>
                <option value="work">Work</option>
                <option value="study">Study</option>
                <option value="exercise">Exercise</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
            />
          </div>

          {estimateError && (
            <div className="estimate-error">{estimateError}</div>
          )}

          {showEstimatePopup && aiEstimate && (
            <div className="estimate-popup">
              <div className="estimate-popup-content">
                <h3>AI Time Estimate</h3>
                <div className="estimate-details">
                  <p className="estimate-time">{aiEstimate.minutes} minutes</p>
                  <p className="estimate-reasoning">{aiEstimate.reasoning}</p>
                </div>
                <div className="estimate-actions">
                  <button type="button" onClick={modifyEstimate} className="modify-estimate">
                    Modify
                  </button>
                  <button type="button" onClick={acceptEstimate} className="accept-estimate">
                    Accept
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="ai-estimate-button"
              onClick={getAiEstimate}
              disabled={isLoadingEstimate}
            >
              {isLoadingEstimate ? 'Getting Estimate...' : 'Get AI Estimate'}
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {task ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm; 