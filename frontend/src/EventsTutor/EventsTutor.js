import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import './EventsTutor.css';

const EventsTutor = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [contentType, setContentType] = useState('assessment');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const navigate = useNavigate();

  const [events] = useState([
    { id: 1, name: 'Техническое собеседование', team: 'ЛК1', date: '2025-12-12' },
    { id: 2, name: 'Оценка soft skills', team: 'ПВК', date: '2025-05-05' },
    { id: 3, name: 'Групповая дискуссия', team: 'ЛК1', date: '2025-12-25' },
    { id: 4, name: 'Вводное собрание', team: 'ЛК2', date: '2025-11-28' },
    { id: 5, name: 'Тестирование навыков', team: 'Команда3', date: '2025-11-22' },
    { id: 6, name: 'Финальное интервью', team: 'ЛК1', date: '2025-12-30' }
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

  const teams = [...new Set(events.map(event => event.team))];

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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="profile-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="profile-content">
        <div className="content-type-switcher">
          <button 
            className={`type-button ${contentType === 'checklist' ? 'active' : ''}`}
            onClick={() => setContentType('checklist')}
          >
            Чек-листы
          </button>
          <button 
            className={`type-button ${contentType === 'assessment' ? 'active' : ''}`}
            onClick={() => setContentType('assessment')}
          >
            Оценочные мероприятия
          </button>
        </div>

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
            <div className="events-header-main">
              <h1>
                {contentType === 'checklist' ? 'Чек-листы' : 'Оценочные мероприятия'}
              </h1>
              <button className="create-button">
                Создать
              </button>
            </div>
            
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