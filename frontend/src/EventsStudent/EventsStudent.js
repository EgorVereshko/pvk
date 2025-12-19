import React, {useState, useEffect} from 'react';
import {useNavigate, Navigate} from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import './EventsStudent.css';

const EventsStudent = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/student_events/');

        if (res.ok) {
          const data = await res.json();
          const formattedEvents = data.map(event => ({
            id: event.id,
            name: event.title,
            date: event.date,
          }));
          setEvents(formattedEvents);
        } else {
          console.error('Ошибка загрузки мероприятий');
        }
      } catch (error) {
        console.error('Сетевая ошибка:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getEventType = (eventDateTime) => {
    const today = new Date();
    const event = new Date(eventDateTime);
    return event >= today ? 'upcoming' : 'completed';
  };

  const eventsWithType = events.map(event => ({
    ...event,
    type: getEventType(event.date)
  }));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const authResponse = await axios.get('/api/check_auth/');
        if (authResponse.data.is_authenticated) {
          setIsAuthenticated(true);

          const profileResponse = await axios.get('/api/user/');
          setUser(profileResponse.data)
        }
      } catch (err) {
        console.log('Error', err.message);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout/');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
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
    return <Navigate to="/" replace/>;
  }

  return (
    <div className="profile-container">
      <Header onLogout={handleLogout} user={user}/>

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