import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api';
import Header from '../../../components/Header/Header';
import './EventsTutor.css';

const EventsTutor = () => {
  const { user, logout, isTutor, isOrganizer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [contentType, setContentType] = useState('checklist');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Модальное окно создания мероприятия
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '',
    team_id: '',
    date: ''
  });
  const [createSuccess, setCreateSuccess] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTutor() && !isOrganizer()) {
      navigate('/');
    }
    loadData();
    fetchTeams();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Загружаем все формы для куратора
      const formsRes = await api.get('/api/forms/tutor/');
      console.log('Все формы:', formsRes.data);
      
      // Фильтруем чек-листы
      const checklistItems = formsRes.data
        .filter(form => form.type === 'Чек-лист')
        .map(form => ({
          id: form.id,
          name: form.name,
          team_name: form.teams_names?.[0] || 'Без команды',
          date: form.end_datetime,
          type: new Date(form.end_datetime) > new Date() ? 'upcoming' : 'completed',
          itemType: 'checklist'
        }));
      
      setChecklists(checklistItems);
      
      // Загружаем мероприятия (если есть эндпоинт)
      try {
        const eventsRes = await api.get('/api/events/');
        setEvents(eventsRes.data);
      } catch (err) {
        console.log('Мероприятия не загружены (возможно эндпоинт не реализован)');
        setEvents([]);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams/');
      setTeams(res.data);
    } catch (error) {
      console.error('Ошибка загрузки команд:', error);
    }
  };

  const getFilteredItems = () => {
    let items = [];
    
    if (contentType === 'checklist') {
      items = [...checklists];
    } else {
      items = events.map(event => ({
        id: event.id,
        name: event.name || `Мероприятие ${event.id}`,
        team_name: event.team_name || 'Без команды',
        date: event.datetime,
        type: new Date(event.datetime) > new Date() ? 'upcoming' : 'completed',
        itemType: 'event'
      }));
    }
    
    // Фильтр по статусу
    items = items.filter(item => item.type === activeTab);
    
    // Фильтр по командам
    if (selectedTeams.length > 0) {
      items = items.filter(item => selectedTeams.includes(item.team_name));
    }
    
    // Сортировка
    items.sort((a, b) => {
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
    
    return items;
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
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const toggleTeamFilter = () => {
    setShowTeamFilter(!showTeamFilter);
  };

  const toggleMenu = (id) => {
    setShowMenu(showMenu === id ? null : id);
  };

  const handleDelete = async (id, itemType) => {
    if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
      try {
        if (itemType === 'checklist') {
          await api.delete(`/api/forms/delete/${id}/`);
        } else {
          await api.delete(`/api/events/${id}/delete/`);
        }
        alert('Удалено');
        loadData();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении');
      }
    }
    setShowMenu(null);
  };

  const handleView = (id, itemType) => {
    if (itemType === 'checklist') {
      navigate(`/checklist/view/${id}`);
    } else if (itemType === 'event') {
      navigate(`/event/${id}`);
    }
    setShowMenu(null);
  };

  const handleCreateEvent = async () => {
    if (!eventForm.name || !eventForm.team_id || !eventForm.date) {
      alert('Заполните все поля');
      return;
    }

    try {
      await api.post('/api/events/create/', {
        name: eventForm.name,
        team_id: parseInt(eventForm.team_id),
        datetime: new Date(eventForm.date).toISOString()
      });

      setCreateSuccess(true);
      setEventForm({ name: '', team_id: '', date: '' });
      setShowCreateEventModal(false);
      loadData();
      
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (error) {
      console.error('Ошибка создания мероприятия:', error);
      alert('Ошибка при создании мероприятия');
    }
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const getUniqueTeams = () => {
    const allItems = contentType === 'checklist' ? checklists : events;
    return [...new Set(allItems.map(item => item.team_name).filter(Boolean))];
  };

  const getCountByType = (status) => {
    if (contentType === 'checklist') {
      return checklists.filter(f => f.type === status).length;
    } else {
      return events.filter(e => (new Date(e.datetime) > new Date() ? 'upcoming' : 'completed') === status).length;
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  const items = getFilteredItems();

  return (
    <div className="profile-container">
      <Header onLogout={logout} user={user} />
      
      <div className="profile-content">
        {createSuccess && (
          <div className="success-toast">✅ Мероприятие успешно создано</div>
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
              + Создать чек-лист
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
              className={`tab ${contentType === 'checklist' ? 'active' : ''}`}
              onClick={() => setContentType('checklist')}
            >
              Чек-листы ({checklists.length})
            </button>
            <button 
              className={`tab ${contentType === 'event' ? 'active' : ''}`}
              onClick={() => setContentType('event')}
            >
              Оценочные мероприятия ({events.length})
            </button>
          </div>
          
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Активные ({getCountByType('upcoming')})
            </button>
            <button 
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Завершённые ({getCountByType('completed')})
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
                    {getUniqueTeams().map(team => (
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
              {items.length === 0 ? (
                <div className="empty-state">
                  <p>Нет данных для отображения</p>
                  {contentType === 'checklist' && (
                    <button onClick={() => navigate('/checklist/create')}>
                      Создать первый чек-лист
                    </button>
                  )}
                  {contentType === 'event' && (
                    <button onClick={() => setShowCreateEventModal(true)}>
                      Создать первое мероприятие
                    </button>
                  )}
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="event-item">
                    <div className="event-content">
                      <div className="event-name">{item.name}</div>
                      <div className="event-team">{item.team_name}</div>
                      <div className="event-date">
                        {new Date(item.date).toLocaleDateString('ru-RU')}
                      </div>
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
                          <button onClick={() => handleView(item.id, item.itemType)}>
                            Посмотреть
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id, item.itemType)}
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
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
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