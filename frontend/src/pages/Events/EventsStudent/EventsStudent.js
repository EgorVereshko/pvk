import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../../components/Header/Header';
import './EventsStudent.css';

const EventsStudent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  const [events] = useState([
    { id: 1, name: 'Техническое собеседование', date: '2026-03-25' },
    { id: 2, name: 'Оценка soft skills', date: '2026-03-30' },
    { id: 3, name: 'Групповая дискуссия', date: '2026-04-12' },
    { id: 4, name: 'Вводное собрание', date: '2026-04-11' },
    { id: 5, name: 'Тестирование навыков', date: '2026-04-22' }
  ]);

  const getEventType = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    return event >= today ? 'upcoming' : 'completed';
  };

  const eventsWithType = events.map(event => ({
    ...event,
    type: getEventType(event.date)
  }));

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/user/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/');
        } else {
          setError('Ошибка при загрузке данных пользователя');
        }
        console.error('Ошибка:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedEvents = eventsWithType
    .filter(event => event.type === activeTab)
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc'
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
    });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="profile-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="profile-content">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Предстоящие
          </button>
          <button 
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Пройденные
          </button>
        </div>

        <div className="tab-content">
          <div className="events-info">
            <h1>Оценочные мероприятия</h1>
            
            <div className="events-header">
              <button 
                className={`header-button name-button ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => handleSort('name')}
              >
                Название {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                className={`header-button date-button ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => handleSort('date')}
              >
                Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            <div className="events-list">
              {filteredAndSortedEvents.map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-name">{event.name}</div>
                  <div className="event-date">
                    {new Date(event.date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsStudent;