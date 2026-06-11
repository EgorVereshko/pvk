import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api';
import Header from '../../../components/Header/Header';
import './EventsTutor.scss';

const EventsTutor = () => {
  const { user, logout, isTutor, isOrganizer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [checklists, setChecklists] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTutor() && !isOrganizer()) {
      navigate('/');
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const formsRes = await api.get('/api/forms/tutor/');
      console.log('Все формы:', formsRes.data);
      
      const checklistItems = formsRes.data
        .filter(form => form.type === 'Чек-лист')
        .map(form => ({
          id: form.id,
          name: form.name,
          team_name: form.teams_names?.[0] || 'Без команды',
          date: form.end_datetime,
          type: new Date(form.end_datetime) > new Date() ? 'upcoming' : 'completed',
          status: form.status
        }));
      
      setChecklists(checklistItems);
      
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    let items = [...checklists];
    
    items = items.filter(item => item.type === activeTab);
    
    if (selectedTeams.length > 0) {
      items = items.filter(item => selectedTeams.includes(item.team_name));
    }
    
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

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот чек-лист?')) {
      try {
        await api.delete(`/api/forms/delete/${id}/`);
        alert('Чек-лист успешно удален');
        loadData();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении');
      }
    }
    setShowMenu(null);
  };

  const handleView = (id) => {
    navigate(`/checklist/view/${id}`);
    setShowMenu(null);
  };

  const getUniqueTeams = () => {
    return [...new Set(checklists.map(item => item.team_name).filter(Boolean))];
  };

  const getCountByStatus = (status) => {
    return checklists.filter(f => f.type === status).length;
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  const items = getFilteredItems();

  return (
    <div className="profile-container">
      <Header onLogout={logout} user={user} />
      
      <div className="profile-content">
        <div className="events-header-main">
          <h1>Чек-листы</h1>
          <div className="header-buttons">
            <button 
              className="create-button"
              onClick={() => navigate('/checklist/create')}
            >
              + Создать чек-лист
            </button>
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Активные ({getCountByStatus('upcoming')})
            </button>
            <button 
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Завершённые ({getCountByStatus('completed')})
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
                  <p>Нет чек-листов для отображения</p>
                  <button onClick={() => navigate('/checklist/create')}>
                    Создать первый чек-лист
                  </button>
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
                      {item.status && (
                        <div className={`event-status status-${item.status === 'Активна' ? 'active' : 'completed'}`}>
                          {item.status === 'Активна' ? 'Активен' : 'Завершен'}
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
                          <button onClick={() => handleView(item.id)}>
                            Посмотреть
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
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
    </div>
  );
};

export default EventsTutor;