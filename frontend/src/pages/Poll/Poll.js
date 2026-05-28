import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Poll.css';

const Poll = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('polls');
  const [polls, setPolls] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingPoll, setEditingPoll] = useState(null);
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: ''
  });

  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [allIndicators, setAllIndicators] = useState([]);
  
  const [pollForm, setPollForm] = useState({
    name: '',
    description: '',
    template_id: '',
    team_ids: [],
    start_datetime: '',
    end_datetime: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchPolls();
    fetchTemplates();
    fetchTeams();
    fetchIndicators();
    
    // Проверка каждые 30 секунд
    const interval = setInterval(() => {
      fetchPolls();
    }, 30000);
    
    // Проверка при фокусе вкладки
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPolls();
      }
    };
    
    // Проверка при возвращении на страницу (для React Router)
    const handleRouteChange = () => {
      fetchPolls();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchPolls();
    fetchTemplates();
    fetchTeams();
    fetchIndicators();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/');
      setUser(res.data);
      const role = res.data.roles?.[0] || 'Проектант';
      setUserRole(role);
      console.log('Роль пользователя:', role);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  const fetchPolls = async () => {
    try {
      let pollForms = [];
      
      const role = userRole || (await api.get('/api/user/')).data.roles?.[0] || 'Проектант';
      
      if (role === 'Проектант') {
        const res = await api.get('/api/forms/projectant/');
        console.log('Формы для проектанта:', res.data);
        pollForms = res.data.forms_polls || [];
      } else {
        const res = await api.get('/api/forms/tutor/');
        console.log('Формы для куратора:', res.data);
        pollForms = res.data.filter(form => form.type === 'Опросник');
      }
      
      console.log('Загруженные опросники:', pollForms);
      setPolls(pollForms);
    } catch (error) {
      console.error('Ошибка загрузки опросников:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/api/templates/');
      setTemplates(res.data);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
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

  const fetchIndicators = async () => {
    try {
      const res = await api.get('/api/indicators/');
      setAllIndicators(res.data);
    } catch (error) {
      console.error('Ошибка загрузки индикаторов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот опросник?')) {
      try {
        await api.delete(`/api/forms/delete/${pollId}/`);
        alert('Опросник удален');
        fetchPolls();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
      }
    }
  };

  const handleEditPoll = (poll) => {
    setEditingPoll(poll);
    setPollForm({
      name: poll.name,
      description: '',
      template_id: poll.template?.id || '',
      team_ids: [],
      start_datetime: poll.start_datetime ? new Date(poll.start_datetime).toISOString().slice(0, 16) : '',
      end_datetime: poll.end_datetime ? new Date(poll.end_datetime).toISOString().slice(0, 16) : ''
    });
  };

  const handleUpdatePoll = async () => {
    if (!pollForm.name || !pollForm.start_datetime || !pollForm.end_datetime) {
      alert('Заполните все обязательные поля');
      return;
    }
    
    try {
      await api.post(`/api/forms/update/${editingPoll.id}/`, {
        name: pollForm.name,
        type: 'Опросник',
        start_datetime: new Date(pollForm.start_datetime).toISOString(),
        end_datetime: new Date(pollForm.end_datetime).toISOString(),
        template_id: pollForm.template_id || null,
        teams_id: pollForm.team_ids
      });
      
      alert('Опросник успешно обновлен');
      setEditingPoll(null);
      setPollForm({
        name: '',
        description: '',
        template_id: '',
        team_ids: [],
        start_datetime: '',
        end_datetime: ''
      });
      fetchPolls();
    } catch (error) {
      console.error('Ошибка обновления опросника:', error);
      alert('Ошибка при обновлении');
    }
  };

  const handlePollFormChange = (e) => {
    const { name, value } = e.target;
    setPollForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamSelect = (teamId) => {
    setPollForm(prev => {
      const newTeamIds = prev.team_ids.includes(teamId)
        ? prev.team_ids.filter(id => id !== teamId)
        : [...prev.team_ids, teamId];
      return { ...prev, team_ids: newTeamIds };
    });
  };

  const addIndicator = (indicator) => {
    if (!selectedIndicators.find(i => i.id === indicator.id)) {
      setSelectedIndicators([...selectedIndicators, indicator]);
    }
  };

  const removeIndicator = (indicatorId) => {
    setSelectedIndicators(selectedIndicators.filter(i => i.id !== indicatorId));
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name) {
      alert('Введите название шаблона');
      return;
    }
    
    if (selectedIndicators.length === 0) {
      alert('Выберите хотя бы один индикатор');
      return;
    }
    
    try {
      await api.post('/api/templates/create/', {
        name: templateForm.name,
        indicators: selectedIndicators.map(i => i.id)
      });
      
      alert('Шаблон успешно создан');
      setShowCreateTemplate(false);
      setTemplateForm({ name: '', description: '' });
      setSelectedIndicators([]);
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка создания шаблона:', error);
      alert('Ошибка при создании шаблона');
    }
  };

  const handleEditTemplate = async (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: ''
    });
    
    try {
      const res = await api.get('/api/templates/');
      const fullTemplate = res.data.find(t => t.id === template.id);
      if (fullTemplate && fullTemplate.indicators) {
        setSelectedIndicators(fullTemplate.indicators);
      }
    } catch (error) {
      console.error('Ошибка загрузки индикаторов шаблона:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!templateForm.name) {
      alert('Введите название шаблона');
      return;
    }
    
    if (selectedIndicators.length === 0) {
      alert('Выберите хотя бы один индикатор');
      return;
    }
    
    try {
      await api.post(`/api/templates/${editingTemplate.id}/update/`, {
        name: templateForm.name,
        indicators: selectedIndicators.map(i => i.id)
      });
      
      alert('Шаблон успешно обновлен');
      setEditingTemplate(null);
      setTemplateForm({ name: '', description: '' });
      setSelectedIndicators([]);
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка обновления шаблона:', error);
      alert('Ошибка при обновлении');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      try {
        await api.delete(`/api/templates/delete/${templateId}/`);
        alert('Шаблон удален');
        fetchTemplates();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении');
      }
    }
  };

  const viewTemplateDetails = async (template) => {
    try {
      const res = await api.get('/api/templates/');
      const fullTemplate = res.data.find(t => t.id === template.id);
      setSelectedTemplate(fullTemplate);
    } catch (error) {
      console.error('Ошибка загрузки деталей шаблона:', error);
    }
  };

  const getPollLink = (poll) => {
    return `/poll/${poll.id}`;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Активна': return 'Активен';
      case 'Запланирована': return 'Запланирован';
      case 'Завершена': return 'Закрыт';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Активна': return 'active';
      case 'Запланирована': return 'draft';
      case 'Завершена': return 'closed';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  const getQuestionCount = (poll) => {
    if (!poll || !poll.template || !poll.template.indicators) return 0;
    
    let count = 0;
    poll.template.indicators.forEach(indicator => {
      if (indicator.questions && indicator.questions.length > 0) {
        count += indicator.questions.length;
      }
    });
    return count;
  };

  const fetchPollDetails = async (poll) => {
    try {
      const response = await api.get(`/api/forms/fill/${poll.id}/`);
      console.log('Детали опросника:', response.data);
      
      let questionCount = 0;
      if (response.data.template && response.data.template.indicators) {
        response.data.template.indicators.forEach(indicator => {
          if (indicator.questions) {
            questionCount += indicator.questions.length;
          }
        });
      }
      
      setSelectedPoll({
        ...poll,
        creator_name: response.data.template?.creator_name || '—',
        question_count: questionCount
      });
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
      setSelectedPoll({
        ...poll,
        creator_name: '—',
        question_count: 0
      });
    }
  };

  return (
    <div className="poll-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="poll-content">
        <div className="poll-header">
          <h1>Функциональные опросники</h1>
          {(userRole === 'Куратор' || userRole === 'Организатор') && (
            <div className="header-actions">
              <button 
                className="create-button"
                onClick={() => navigate('/polls/create')}
              >
                + Создать опросник
              </button>
              <button 
                className="create-button secondary"
                onClick={() => setShowCreateTemplate(true)}
              >
                + Создать шаблон
              </button>
            </div>
          )}
        </div>

        <div className="poll-tabs">
          <button 
            className={`tab ${activeTab === 'polls' ? 'active' : ''}`}
            onClick={() => setActiveTab('polls')}
          >
            Опросники ({polls.length})
          </button>
          {(userRole === 'Куратор' || userRole === 'Организатор') && (
            <button 
              className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              Шаблоны ({templates.length})
            </button>
          )}
        </div>

        {/* СПИСОК ОПРОСНИКОВ */}
        {activeTab === 'polls' && (
          <div className="polls-list">
            {polls.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Нет доступных опросников</p>
              </div>
            ) : (
              polls.map(poll => (
                <div key={poll.id} className="poll-item">
                  <div className="poll-item-header">
                    <h3>{poll.name}</h3>
                    <div className="poll-actions">
                      {(userRole === 'Куратор' || userRole === 'Организатор') && (
                        <>
                          <button 
                            className="icon-button edit"
                            onClick={() => handleEditPoll(poll)}
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button 
                            className="icon-button delete"
                            onClick={() => handleDeletePoll(poll.id)}
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      <span className={`status ${getStatusClass(poll.status)}`}>
                        {getStatusText(poll.status)}
                      </span>
                    </div>
                  </div>
                  <div className="poll-meta">
                    <div className="datetime-range-compact">
                      <div className="datetime-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>{new Date(poll.start_datetime).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      <span className="datetime-separator">—</span>
                      <div className="datetime-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>{new Date(poll.end_datetime).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="poll-item-footer">
                    <button 
                      className="pass-button"
                      onClick={() => navigate(getPollLink(poll))}
                      disabled={poll.status !== 'Активна'}
                    >
                      {poll.status === 'Активна' ? 'Пройти опрос' : 
                       poll.status === 'Запланирована' ? 'Скоро начнётся' : 'Завершён'}
                    </button>
                    <button 
                      className="view-button"
                      onClick={() => fetchPollDetails(poll)}
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* СПИСОК ШАБЛОНОВ */}
        {activeTab === 'templates' && (userRole === 'Куратор' || userRole === 'Организатор') && (
          <div className="templates-list">
            {templates.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <p>Нет созданных шаблонов</p>
                <button onClick={() => setShowCreateTemplate(true)}>
                  Создать первый шаблон
                </button>
              </div>
            ) : (
              templates.map(template => (
                <div key={template.id} className="template-item">
                  <div className="template-item-header">
                    <h3>{template.name}</h3>
                    <div className="template-actions">
                      <button 
                        className="icon-button edit"
                        onClick={() => handleEditTemplate(template)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        className="icon-button delete"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="template-meta">
                    <div className="template-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>Создатель: {template.creator_name || '—'}</span>
                    </div>
                    <div className="template-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4v16h16V4H4zm2 2h12v12H6V6z"></path>
                        <path d="M8 8h8v2H8zM8 12h6v2H8z"></path>
                      </svg>
                      <span>Индикаторов: {template.indicators?.length || 0}</span>
                    </div>
                    <div className="template-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>Создан: {new Date(template.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  
                  <div className="template-item-footer">
                    <button 
                      className="view-button"
                      onClick={() => viewTemplateDetails(template)}
                    >
                      Просмотреть
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* МОДАЛКА СОЗДАНИЯ ШАБЛОНА */}
      {showCreateTemplate && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Создание шаблона опросника</h2>
            
            <div className="form-group">
              <label>Название шаблона *</label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                placeholder="Введите название шаблона"
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                placeholder="Введите описание шаблона"
              />
            </div>

            <div className="indicators-section">
              <h3>Выберите индикаторы для оценки</h3>
              <div className="indicators-list">
                {allIndicators.map(indicator => (
                  <div key={indicator.id} className="indicator-item">
                    <label className="indicator-select">
                      <input
                        type="checkbox"
                        checked={selectedIndicators.some(i => i.id === indicator.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addIndicator(indicator);
                          } else {
                            removeIndicator(indicator.id);
                          }
                        }}
                      />
                      <span className="indicator-name">{indicator.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="save-button" onClick={handleCreateTemplate}>
                Создать шаблон
              </button>
              <button className="cancel-button" onClick={() => {
                setShowCreateTemplate(false);
                setSelectedIndicators([]);
              }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ПРОСМОТРА ОПРОСНИКА */}
      {selectedPoll && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedPoll.name}</h2>
              <button className="close-button" onClick={() => setSelectedPoll(null)}>×</button>
            </div>
            
            <div className="poll-detail-info">
              <div className="info-item">
                <span className="info-label">Статус:</span>
                <span className={`status-badge ${getStatusClass(selectedPoll.status)}`}>
                  {getStatusText(selectedPoll.status)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Период:</span>
                <span>
                  {new Date(selectedPoll.start_datetime).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {new Date(selectedPoll.end_datetime).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Создатель:</span>
                <span>{selectedPoll.creator_name || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Количество вопросов:</span>
                <span>{selectedPoll.question_count || 0}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="pass-button"
                onClick={() => {
                  setSelectedPoll(null);
                  navigate(getPollLink(selectedPoll));
                }}
                disabled={selectedPoll.status !== 'Активна'}
              >
                {selectedPoll.status === 'Активна' ? 'Пройти опрос' : 'Опрос недоступен'}
              </button>
              <button className="cancel-button" onClick={() => setSelectedPoll(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ОПРОСНИКА */}
      {editingPoll && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Редактирование опросника</h2>
            
            <div className="form-group">
              <label>Название *</label>
              <input
                type="text"
                name="name"
                value={pollForm.name}
                onChange={handlePollFormChange}
              />
            </div>

            <div className="form-group">
              <label>Шаблон</label>
              <select name="template_id" value={pollForm.template_id} onChange={handlePollFormChange}>
                <option value="">Без шаблона</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Команды</label>
              <div className="teams-select">
                {teams.map(team => (
                  <label key={team.id} className="team-checkbox">
                    <input
                      type="checkbox"
                      checked={pollForm.team_ids.includes(team.id)}
                      onChange={() => handleTeamSelect(team.id)}
                    />
                    {team.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Дата начала *</label>
                <input
                  type="datetime-local"
                  name="start_datetime"
                  value={pollForm.start_datetime}
                  onChange={handlePollFormChange}
                />
              </div>
              <div className="form-group">
                <label>Дата окончания *</label>
                <input
                  type="datetime-local"
                  name="end_datetime"
                  value={pollForm.end_datetime}
                  onChange={handlePollFormChange}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="save-button" onClick={handleUpdatePoll}>Сохранить</button>
              <button className="cancel-button" onClick={() => setEditingPoll(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ПРОСМОТРА ШАБЛОНА */}
      {selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedTemplate.name}</h2>
              <button className="close-button" onClick={() => setSelectedTemplate(null)}>×</button>
            </div>
            <p>Создатель: {selectedTemplate.creator_name}</p>
            <p>Создан: {new Date(selectedTemplate.created_at).toLocaleDateString()}</p>
            <h3>Индикаторы:</h3>
            {selectedTemplate.indicators?.map((ind, idx) => (
              <div key={idx}>{idx + 1}. {ind.name}</div>
            ))}
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setSelectedTemplate(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ШАБЛОНА */}
      {editingTemplate && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Редактирование шаблона</h2>
            <div className="form-group">
              <label>Название *</label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
              />
            </div>
            <div className="indicators-section">
              <h3>Выберите индикаторы</h3>
              <div className="indicators-list">
                {allIndicators.map(indicator => (
                  <div key={indicator.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedIndicators.some(i => i.id === indicator.id)}
                        onChange={(e) => {
                          if (e.target.checked) addIndicator(indicator);
                          else removeIndicator(indicator.id);
                        }}
                      />
                      {indicator.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="save-button" onClick={handleUpdateTemplate}>Сохранить</button>
              <button className="cancel-button" onClick={() => setEditingTemplate(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Poll;