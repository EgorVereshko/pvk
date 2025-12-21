import React, {useState, useEffect} from 'react';
import {useNavigate, Navigate} from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import './EventsTutor.css';
import {useAuth} from "../authHook";

const EventsTutor = () => {
  const {user, authLoading, handleLogout, isAuthenticated} = useAuth();
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [contentType, setContentType] = useState('assessment');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!authLoading) {
      fetchEvents();
    }
  }, [navigate, authLoading]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/tutor_events/');
      const data = response.data
      const formattedEvents = data.map(event => ({
        id: event.id,
        name: event.title,
        team: event.team_name,
        date: event.datetime,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Сетевая ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventType = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    return event >= today ? 'upcoming' : 'completed';
  };

  const eventsWithType = events.map(event => ({
    ...event,
    type: getEventType(event.date)
  }));

  const teams = [...new Set(events.map(event => event.team))];


  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleTeamFilter = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  const toggleTeamFilter = () => {
    setShowTeamFilter(!showTeamFilter);
  };

  const toggleMenu = (eventId) => {
    setShowMenu(showMenu === eventId ? null : eventId);
  };

  const handleMenuAction = (action, eventId) => {
    console.log(`${action} мероприятие ${eventId}`);
    setShowMenu(null);
    // Здесь будет логика для каждого действия
  };

  const filteredAndSortedEvents = eventsWithType
    .filter(event => event.type === activeTab)
    .filter(event => selectedTeams.length === 0 || selectedTeams.includes(event.team))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'team') {
        return sortOrder === 'asc'
          ? a.team.localeCompare(b.team)
          : b.team.localeCompare(a.team);
      } else {
        return sortOrder === 'asc'
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
    });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace/>;
  }

  return (
    <div className="profile-container">
      <Header onLogout={handleLogout} user={user}/>

      <div className="profile-content">
        <div className="events-header-main">
          <h1>
            {contentType === 'checklist' ? 'Чек-листы' : 'Оценочные мероприятия'}
          </h1>
          <button className="create-button">
            Создать
          </button>
        </div>

        {/* Обертка для всех табов в одной строке */}
        <div className="tabs-container">
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

          <div className="tabs content-type-tabs">
            <button
              className={`tab ${contentType === 'checklist' ? 'active' : ''}`}
              onClick={() => setContentType('checklist')}
            >
              Чек-листы
            </button>
            <button
              className={`tab ${contentType === 'assessment' ? 'active' : ''}`}
              onClick={() => setContentType('assessment')}
            >
              Оценочные мероприятия
            </button>
          </div>
        </div>

        <div className="tab-content">
          <div className="events-info">
            <div className="filter-section">
              <div className="filter-buttons">
                <button
                  className={`filter-button name-button ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Название {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  className={`filter-button team-filter ${showTeamFilter ? 'active' : ''}`}
                  onClick={toggleTeamFilter}
                >
                  Команда {showTeamFilter && '▼'}
                </button>
                <button
                  className={`filter-button date-button ${sortBy === 'date' ? 'active' : ''}`}
                  onClick={() => handleSort('date')}
                >
                  Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>

              {showTeamFilter && (
                <div className="team-filter-dropdown">
                  <div className="team-checkboxes">
                    {teams.map(team => (
                      <label key={team} className="team-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team)}
                          onChange={() => handleTeamFilter(team)}
                        />
                        <span>{team}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="events-list">
              {filteredAndSortedEvents.map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-content">
                    <div className="event-name">{event.name}</div>
                    <div className="event-team">{event.team}</div>
                    <div className="event-date">
                      {new Date(event.date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <div className="event-actions">
                    <button
                      className="menu-button"
                      onClick={() => toggleMenu(event.id)}
                    >
                      ⋮
                    </button>
                    {showMenu === event.id && (
                      <div className="action-menu left">
                        <button onClick={() => handleMenuAction('edit', event.id)}>
                          Редактировать
                        </button>
                        <button onClick={() => handleMenuAction('input', event.id)}>
                          Внести данные
                        </button>
                        <button onClick={() => handleMenuAction('view', event.id)}>
                          Посмотреть
                        </button>
                        <button
                          onClick={() => handleMenuAction('delete', event.id)}
                          className="delete-action"
                        >
                          Удалить
                        </button>
                      </div>
                    )}
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

export default EventsTutor;