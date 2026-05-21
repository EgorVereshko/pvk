import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../../api';
import Header from '../../../components/Header/Header';
import './EventsTutor.css';

const EventsTutor = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [contentType, setContentType] = useState('checklist');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  
  // Модальное окно создания мероприятия
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '',
    team_id: '',
    tutor_id: '',
    date: ''
  });
  const [availableTeams, setAvailableTeams] = useState([]);
  const [availableTutors, setAvailableTutors] = useState([]);
  const [createSuccess, setCreateSuccess] = useState(false);
  
  // Реальные данные из БД
  const [events, setEvents] = useState([]);
  const [checklists, setChecklists] = useState([]);
  
  const navigate = useNavigate();

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
        
        // После получения пользователя, загружаем данные
        fetchEvents();
        fetchChecklists();
        fetchTeams();
        fetchTutors();
        
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

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/events/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error);
    }
  };

  const fetchChecklists = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/checklists/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setChecklists(response.data);
      console.log('Загруженные чек-листы:', response.data);
    } catch (error) {
      console.error('Ошибка загрузки чек-листов:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/teams/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setAvailableTeams(response.data);
    } catch (error) {
      console.error('Ошибка загрузки команд:', error);
    }
  };

  const fetchTutors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/students/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setAvailableTutors(response.data);
    } catch (error) {
      console.error('Ошибка загрузки кураторов:', error);
    }
  };

  const getEventType = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    return event >= today ? 'upcoming' : 'completed';
  };

  // Объединяем мероприятия и чек-листы для отображения
  const getAllItems = () => {
    if (contentType === 'assessment') {
      return events.map(event => ({
        id: event.id,
        name: event.name || `Мероприятие ${event.id}`,
        team: event.team_name || 'Без команды',
        date: event.datetime,
        type: getEventType(event.datetime),
        itemType: 'event'
      }));
    } else {
      return checklists.map(cl => ({
        id: cl.id,
        name: cl.event_name || `Чек-лист ${cl.id}`,
        team: cl.team_name || 'Без команды',
        date: cl.event_datetime,
        type: getEventType(cl.event_datetime),
        student: cl.evaluated_student,
        indicators: cl.indicators,
        itemType: 'checklist'
      }));
    }
  };

  const items = getAllItems();
  const teams = [...new Set(items.map(item => item.team).filter(Boolean))];

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

  const toggleMenu = (itemId) => {
    setShowMenu(showMenu === itemId ? null : itemId);
  };

  const handleMenuAction = (action, itemId, itemType) => {
    console.log(`${action} элемент ${itemId} типа ${itemType}`);
    
    if (action === 'view') {
      if (itemType === 'checklist') {
        navigate(`/checklist/view/${itemId}`);
      } else if (itemType === 'event') {
        navigate(`/event/${itemId}`);
      }
    } else if (action === 'edit') {
      if (itemType === 'checklist') {
        navigate(`/checklist/edit/${itemId}`);
      }
    } else if (action === 'delete') {
      if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
        if (itemType === 'checklist') {
          api.delete(`/api/checklist/${itemId}/delete/`)
            .then(() => {
              fetchChecklists();
              alert('Чек-лист удален');
            })
            .catch(error => {
              console.error('Ошибка удаления:', error);
              alert('Ошибка при удалении');
            });
        }
      }
    }
    
    setShowMenu(null);
  };

  // Обработчики формы создания мероприятия
  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = async () => {
    if (!eventForm.name || !eventForm.team_id || !eventForm.date) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const response = await api.post('/api/events/create/', {
        name: eventForm.name,
        team_id: eventForm.team_id,
        datetime: eventForm.date,
        tutor_id: eventForm.tutor_id || user?.id
      });

      if (response.data) {
        setCreateSuccess(true);
        setEventForm({ name: '', team_id: '', tutor_id: '', date: '' });
        setShowCreateEventModal(false);
        fetchEvents();
        
        setTimeout(() => {
          setCreateSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Ошибка создания мероприятия:', error);
      alert('Ошибка при создании мероприятия');
    }
  };

  const filteredAndSortedItems = items
    .filter(item => item.type === activeTab)
    .filter(item => selectedTeams.length === 0 || selectedTeams.includes(item.team))
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
        {/* Зеленая плашка успешного создания */}
        {createSuccess && (
          <div className="success-toast">
            ✅ Мероприятие успешно создано
          </div>
        )}

        <div className="events-header-main">
          <h1>
            {contentType === 'checklist' ? 'Чек-листы' : 'Оценочные мероприятия'}
          </h1>
          <div className="header-buttons">
            <button 
              className="create-button"
              onClick={() => navigate('/checklist/create')}
            >
              Создать чек-лист
            </button>
            <button 
              className="create-button secondary"
              onClick={() => setShowCreateEventModal(true)}
            >
              + Создать мероприятие
            </button>
          </div>
        </div>

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
              {filteredAndSortedItems.length === 0 ? (
                <div className="empty-state">
                  <p>Нет данных для отображения</p>
                  {contentType === 'checklist' && (
                    <button 
                      className="create-button"
                      onClick={() => navigate('/checklist/create')}
                    >
                      Создать первый чек-лист
                    </button>
                  )}
                </div>
              ) : (
                filteredAndSortedItems.map(item => (
                  <div key={item.id} className="event-item">
                    <div className="event-content">
                      <div className="event-name">{item.name}</div>
                      <div className="event-team">{item.team}</div>
                      <div className="event-date">
                        {new Date(item.date).toLocaleDateString('ru-RU')}
                      </div>
                      {item.student && (
                        <div className="event-student">
                          Студент: {item.student}
                        </div>
                      )}
                    </div>
                    <div className="event-actions">
                      <button 
                        className="menu-button"
                        onClick={() => toggleMenu(item.id)}
                      >
                        ⋮
                      </button>
                      {showMenu === item.id && (
                        <div className="action-menu left">
                          <button onClick={() => handleMenuAction('view', item.id, item.itemType)}>
                            Посмотреть
                          </button>
                          {item.itemType === 'checklist' && (
                            <button onClick={() => handleMenuAction('edit', item.id, item.itemType)}>
                              Редактировать
                            </button>
                          )}
                          <button 
                            onClick={() => handleMenuAction('delete', item.id, item.itemType)}
                            className="delete-action"
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно создания мероприятия */}
      {showCreateEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Создание мероприятия</h2>
              <button className="close-btn" onClick={() => setShowCreateEventModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Название мероприятия *</label>
                <input
                  type="text"
                  name="name"
                  value={eventForm.name}
                  onChange={handleEventFormChange}
                  placeholder="Введите название мероприятия"
                />
              </div>

              <div className="form-group">
                <label>Команда *</label>
                <select
                  name="team_id"
                  value={eventForm.team_id}
                  onChange={handleEventFormChange}
                >
                  <option value="">Выберите команду</option>
                  {availableTeams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Куратор</label>
                <select
                  name="tutor_id"
                  value={eventForm.tutor_id}
                  onChange={handleEventFormChange}
                >
                  <option value="">Выберите куратора</option>
                  {availableTutors.map(tutor => (
                    <option key={tutor.id} value={tutor.id}>{tutor.short_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Дата мероприятия *</label>
                <input
                  type="date"
                  name="date"
                  value={eventForm.date}
                  onChange={handleEventFormChange}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCreateEventModal(false)}>
                Отмена
              </button>
              <button className="save-btn" onClick={handleCreateEvent}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsTutor;