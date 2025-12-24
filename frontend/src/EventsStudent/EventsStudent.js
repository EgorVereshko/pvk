import React, {useState, useEffect} from 'react';
import {useNavigate, Navigate, Link} from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import './EventsStudent.css';
import {useAuth} from "../authHook";

const EventsStudent = () => {
  const {user, authLoading, handleLogout, isAuthenticated} = useAuth();
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!authLoading) {
      fetchEvents();
    }
  }, [authLoading]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/student_events/');
      const data = await response.data
      const formattedEvents = data.map(event => ({
        id: event.id, name: event.title, date: event.datetime,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventType = (eventDateTime) => {
    const today = new Date();
    const event = new Date(eventDateTime);
    return event >= today ? 'upcoming' : 'completed';
  };

  const eventsWithType = events.map(event => ({
    ...event, type: getEventType(event.date)
  }));

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
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
      }
    });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace/>;
  }

  return (<div className="profile-container">
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
              <Link to={`/score_teammates/${event.id}`} style={{ textDecoration: 'none' }}>
                <div key={event.id} className="event-item">

                  <div className="event-name">{event.name}</div>
                  <div className="event-date">
                    {new Date(event.date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </Link>))}
          </div>
        </div>
      </div>
    </div>
  </div>);
};

export default EventsStudent;