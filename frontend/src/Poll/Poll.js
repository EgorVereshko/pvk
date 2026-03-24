import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../Header/Header';
import './Poll.css';

const Poll = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('polls');
  const [polls, setPolls] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [editingPoll, setEditingPoll] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Форма создания опросника
  const [pollForm, setPollForm] = useState({
    name: '',
    description: '',
    template_id: '',
    team_ids: [],
    start_date: '',
    end_date: ''
  });
  
  // Форма создания шаблона - только название и описание
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: ''
  });

  // Статичные вопросы для каждой компетенции
  const competenceQuestions = {
    'Вовлеченность': 'Случалось ли вам замечать проблему, которая касалась не вашей части работы, но могла повлиять на общий результат, и вы сообщили о ней команде?',
    'Организованность': 'Возникала ли за время проекта ситуация, когда вы, понимая, что не успеваете к дедлайну или столкнулись с трудностью, написали об этом в общий чат до того, как вас начали спрашивать о статусе?',
    'Работа в команде': 'Помогали ли вы кому-то из коллег осваивать новый инструмент или формат работы?',
    'Обучаемость': 'Потребовалось ли вам больше одного дня, чтобы разобраться с шаблоном и принципами работы в Archimate?'
  };

  // Статичный список компетенций
  const competenceOptions = [
    { id: 1, name: 'Проактивная коммуникация' },
    { id: 2, name: 'Тайм-менеджмент и соблюдение дедлайнов' },
    { id: 3, name: 'Совместная работа над задачами, взаимодействие задач между участниками команды' },
    { id: 4, name: 'Адаптивность к новым инструментам, форматам работы' }
  ];

  const [selectedCompetences, setSelectedCompetences] = useState([]);

  // Добавление компетенции в шаблон
  const addCompetence = (competence) => {
    if (!selectedCompetences.find(c => c.id === competence.id)) {
      setSelectedCompetences([...selectedCompetences, competence]);
    }
  };

  // Удаление компетенции из шаблона
  const removeCompetence = (competenceId) => {
    setSelectedCompetences(selectedCompetences.filter(c => c.id !== competenceId));
  };

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchPolls();
    fetchTemplates();
    fetchTeams();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/');
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  const fetchPolls = async () => {
    try {
      const res = await api.get('/api/polls/');
      setPolls(res.data);
    } catch (error) {
      console.error('Ошибка загрузки опросников:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/api/poll-templates/');
      const templatesWithQuestions = await Promise.all(
        res.data.map(async (template) => {
          try {
            const detailRes = await api.get(`/api/poll-templates/${template.id}/`);
            return detailRes.data;
          } catch (error) {
            return template;
          }
        })
      );
      setTemplates(templatesWithQuestions);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchPollDetails = async (pollId) => {
    try {
        const response = await api.get(`/api/polls/${pollId}/`);
        setSelectedPoll(response.data);
        console.log('Детали опросника:', response.data); // Для отладки
    } catch (error) {
        console.error('Ошибка загрузки деталей опросника:', error);
        alert('Не удалось загрузить детали опросника');
    }
    };

  // ========== ШАБЛОНЫ ==========

  const handleCreateTemplate = async () => {
    if (!templateForm.name) {
      alert('Введите название шаблона');
      return;
    }
    
    if (selectedCompetences.length === 0) {
      alert('Выберите хотя бы одну компетенцию');
      return;
    }
    
    try {
      const questions = selectedCompetences.map(comp => ({
        text: competenceQuestions[comp.name] || comp.name,
        type: 'rating',
        required: true,
        options: [
            { value: -1, label: 'Низкий' },
            { value: 0, label: 'Средний' },
            { value: 1, label: 'Высокий' }
        ]
      }));
      
      await api.post('/api/poll-templates/create/', {
        ...templateForm,
        questions
      });
      
      alert('Шаблон успешно создан');
      setShowCreateTemplate(false);
      setTemplateForm({ name: '', description: '' });
      setSelectedCompetences([]);
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка создания шаблона:', error);
      alert('Ошибка при создании шаблона');
    }
  };

  // Функция для открытия редактирования опросника
  const handleEditPoll = (poll) => {
    setEditingPoll(poll);
    setPollForm({
      name: poll.name,
      description: poll.description || '',
      template_id: poll.template?.id || '',
      team_ids: poll.teams.map(t => t.id),
      start_date: poll.start_date ? new Date(poll.start_date).toISOString().slice(0, 16) : '',
      end_date: poll.end_date ? new Date(poll.end_date).toISOString().slice(0, 16) : ''
    });
  };

  // Функция для обновления опросника
  const handleUpdatePoll = async () => {
    if (!pollForm.name || !pollForm.start_date || !pollForm.end_date || pollForm.team_ids.length === 0) {
      alert('Заполните все обязательные поля');
      return;
    }
    
    try {
      const formData = {
        ...pollForm,
        start_date: new Date(pollForm.start_date).toISOString(),
        end_date: new Date(pollForm.end_date).toISOString(),
      };
      
      await api.put(`/api/polls/${editingPoll.id}/update/`, formData);
      alert('Опросник успешно обновлен');
      setEditingPoll(null);
      setPollForm({
        name: '',
        description: '',
        template_id: '',
        team_ids: [],
        start_date: '',
        end_date: ''
      });
      fetchPolls();
    } catch (error) {
      console.error('Ошибка обновления опросника:', error);
      alert('Ошибка при обновлении: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  // Функция для удаления опросника
  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот опросник?')) {
      try {
        await api.delete(`/api/polls/${pollId}/delete/`);
        alert('Опросник удален');
        fetchPolls();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении');
      }
    }
  };

  // Функция для открытия редактирования шаблона
  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    
    // Преобразуем вопросы обратно в компетенции
    const competences = template.questions?.map((q, index) => ({
      id: index + 1,
      name: Object.keys(competenceQuestions).find(key => competenceQuestions[key] === q.text) || q.text
    })) || [];
    
    setSelectedCompetences(competences);
    setTemplateForm({
      name: template.name,
      description: template.description || ''
    });
  };

  // Функция для обновления шаблона
  const handleUpdateTemplate = async () => {
    if (!templateForm.name) {
      alert('Введите название шаблона');
      return;
    }
    
    if (selectedCompetences.length === 0) {
      alert('Выберите хотя бы одну компетенцию');
      return;
    }
    
    try {
      const questions = selectedCompetences.map(comp => ({
        text: competenceQuestions[comp.name] || comp.name,
        type: 'rating',
        required: true,
        options: [
            { value: -1, label: 'Низкий' },
            { value: 0, label: 'Средний' },
            { value: 1, label: 'Высокий' }
        ]
      }));
      
      await api.put(`/api/poll-templates/${editingTemplate.id}/update/`, {
        ...templateForm,
        questions
      });
      
      alert('Шаблон успешно обновлен');
      setEditingTemplate(null);
      setTemplateForm({ name: '', description: '' });
      setSelectedCompetences([]);
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка обновления шаблона:', error);
      alert('Ошибка при обновлении');
    }
  };

  // Функция для удаления шаблона
  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      try {
        await api.delete(`/api/poll-templates/${templateId}/delete/`);
        alert('Шаблон удален');
        fetchTemplates();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении');
      }
    }
  };

  useEffect(() => {
    if (!showCreateTemplate && !editingTemplate) {
      setSelectedCompetences([]);
    }
  }, [showCreateTemplate, editingTemplate]);

  // ========== ОПРОСНИКИ ==========

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

  const handleCreatePoll = async () => {
    if (!pollForm.name || !pollForm.start_date || !pollForm.end_date || pollForm.team_ids.length === 0) {
      alert('Заполните все обязательные поля');
      return;
    }
    
    try {
      const formData = {
        ...pollForm,
        start_date: new Date(pollForm.start_date).toISOString(),
        end_date: new Date(pollForm.end_date).toISOString(),
      };
      
      console.log('Отправляемые данные:', formData);
      
      await api.post('/api/polls/create/', formData);
      alert('Опросник успешно создан');
      setShowCreatePoll(false);
      setPollForm({
        name: '',
        description: '',
        template_id: '',
        team_ids: [],
        start_date: '',
        end_date: ''
      });
      fetchPolls();
    } catch (error) {
      console.error('Ошибка создания опросника:', error);
      console.error('Детали ошибки:', error.response?.data);
      alert('Ошибка при создании опросника: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  const copyLink = (link) => {
    const fullLink = `${window.location.origin}/poll/${link}`;
    navigator.clipboard.writeText(fullLink);
    alert('Ссылка скопирована');
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="poll-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="poll-content">
        <div className="poll-header">
          <h1>Функциональные опросники</h1>
          <div className="header-actions">
            <button 
              className="create-button"
              onClick={() => setShowCreatePoll(true)}
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
        </div>

        <div className="poll-tabs">
          <button 
            className={`tab ${activeTab === 'polls' ? 'active' : ''}`}
            onClick={() => setActiveTab('polls')}
          >
            Опросники
          </button>
          <button 
            className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Шаблоны
          </button>
        </div>

        {/* СПИСОК ОПРОСНИКОВ */}
        {activeTab === 'polls' && (
          <div className="polls-list">
            {polls.map(poll => (
              <div key={poll.id} className="poll-item">
                <div className="poll-item-header">
                  <h3>{poll.name}</h3>
                  <div className="poll-actions">
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
                    <span className={`status ${poll.status}`}>
                      {poll.status === 'active' ? 'Активен' : 
                       poll.status === 'draft' ? 'Черновик' : 'Закрыт'}
                    </span>
                  </div>
                </div>
                <p className="poll-description">{poll.description}</p>
                <div className="poll-meta">
                  <span>📅 {new Date(poll.start_date).toLocaleDateString()} - {new Date(poll.end_date).toLocaleDateString()}</span>
                  <span>👥 {poll.assignments_count} участников</span>
                  <span>✅ {poll.completed_count} прошли</span>
                </div>
                <div className="poll-teams">
                  {poll.teams.map(team => (
                    <span key={team.id} className="team-tag">{team.name}</span>
                  ))}
                </div>
                <div className="poll-item-footer">
                  <button 
                    className="view-button"
                    onClick={() => fetchPollDetails(poll.id)}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* СПИСОК ШАБЛОНОВ */}
        {activeTab === 'templates' && (
          <div className="templates-list">
            {templates.length === 0 ? (
              <div className="empty-state">
                <p>Нет созданных шаблонов</p>
                <button onClick={() => setShowCreateTemplate(true)}>
                  Создать первый шаблон
                </button>
              </div>
            ) : (
              templates.map(template => (
                <div key={template.id} className="template-item">
                  <div className="template-header">
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
                  <p>{template.description}</p>
                  <div className="questions-count">
                    Компетенций: {template.questions?.length || 0}
                  </div>
                  <button 
                    className="view-button"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    Просмотреть
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* МОДАЛКА СОЗДАНИЯ ОПРОСНИКА */}
        {showCreatePoll && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <h2>Создание опросника</h2>
              
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  name="name"
                  value={pollForm.name}
                  onChange={handlePollFormChange}
                  placeholder="Введите название опросника"
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  name="description"
                  value={pollForm.description}
                  onChange={handlePollFormChange}
                  placeholder="Введите описание"
                />
              </div>

              <div className="form-group">
                <label>Шаблон</label>
                <select
                  name="template_id"
                  value={pollForm.template_id}
                  onChange={handlePollFormChange}
                >
                  <option value="">Без шаблона</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Команды для оценки *</label>
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
                    name="start_date"
                    value={pollForm.start_date}
                    onChange={handlePollFormChange}
                  />
                </div>

                <div className="form-group">
                  <label>Дата окончания *</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={pollForm.end_date}
                    onChange={handlePollFormChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="save-button" onClick={handleCreatePoll}>
                  Создать
                </button>
                <button className="cancel-button" onClick={() => setShowCreatePoll(false)}>
                  Отмена
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
                  placeholder="Введите название опросника"
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  name="description"
                  value={pollForm.description}
                  onChange={handlePollFormChange}
                  placeholder="Введите описание"
                />
              </div>

              <div className="form-group">
                <label>Шаблон</label>
                <select
                  name="template_id"
                  value={pollForm.template_id}
                  onChange={handlePollFormChange}
                >
                  <option value="">Без шаблона</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Команды для оценки *</label>
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
                    name="start_date"
                    value={pollForm.start_date}
                    onChange={handlePollFormChange}
                  />
                </div>

                <div className="form-group">
                  <label>Дата окончания *</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={pollForm.end_date}
                    onChange={handlePollFormChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="save-button" onClick={handleUpdatePoll}>
                  Сохранить изменения
                </button>
                <button className="cancel-button" onClick={() => setEditingPoll(null)}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

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

              <div className="competences-section">
                <h3>Выберите компетенции для оценки</h3>
                
                <div className="competences-list">
                  {competenceOptions.map(competence => (
                    <div key={competence.id} className="competence-item">
                      <div className="competence-select">
                        <input
                          type="checkbox"
                          checked={selectedCompetences.some(c => c.id === competence.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addCompetence(competence);
                            } else {
                              removeCompetence(competence.id);
                            }
                          }}
                        />
                        <span className="competence-name">{competence.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCompetences.length > 0 && (
                  <div className="selected-summary">
                    <h4>Выбранные компетенции:</h4>
                    <div className="summary-list">
                      {selectedCompetences.map(comp => (
                        <div key={comp.id} className="summary-item">
                          <span>{comp.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="save-button" onClick={handleCreateTemplate}>
                  Создать шаблон
                </button>
                <button className="cancel-button" onClick={() => {
                  setShowCreateTemplate(false);
                  setSelectedCompetences([]);
                }}>
                  Отмена
                </button>
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

              <div className="competences-section">
                <h3>Выберите компетенции для оценки</h3>
                
                <div className="competences-list">
                  {competenceOptions.map(competence => (
                    <div key={competence.id} className="competence-item">
                      <div className="competence-select">
                        <input
                          type="checkbox"
                          checked={selectedCompetences.some(c => c.id === competence.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addCompetence(competence);
                            } else {
                              removeCompetence(competence.id);
                            }
                          }}
                        />
                        <span className="competence-name">{competence.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCompetences.length > 0 && (
                  <div className="selected-summary">
                    <h4>Выбранные компетенции:</h4>
                    <div className="summary-list">
                      {selectedCompetences.map(comp => (
                        <div key={comp.id} className="summary-item">
                          <span>{comp.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="save-button" onClick={handleUpdateTemplate}>
                  Сохранить изменения
                </button>
                <button className="cancel-button" onClick={() => {
                  setEditingTemplate(null);
                  setSelectedCompetences([]);
                }}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* МОДАЛКА ПРОСМОТРА ШАБЛОНА */}
        {selectedTemplate && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h2>{selectedTemplate.name}</h2>
                <button className="close-button" onClick={() => setSelectedTemplate(null)}>×</button>
              </div>
              
              <p className="template-detail-description">{selectedTemplate.description}</p>

              <div className="template-detail-info">
                <p><strong>Дата создания:</strong> {new Date(selectedTemplate.created_at).toLocaleDateString()}</p>
                <p><strong>Количество компетенций:</strong> {selectedTemplate.questions?.length || 0}</p>
              </div>

              <div className="template-questions-section">
                <h3>Вопросы в шаблоне:</h3>
                <div className="template-questions-list">
                  {selectedTemplate.questions?.map((question, idx) => (
                    <div key={idx} className="template-question-detail">
                      <div className="question-header">
                        <span className="question-number">{idx + 1}</span>
                        <span className="question-text">{question.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button className="edit-button" onClick={() => {
                  handleEditTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                }}>
                  Редактировать
                </button>
                <button className="cancel-button" onClick={() => setSelectedTemplate(null)}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* МОДАЛКА ПРОСМОТРА ОПРОСНИКА */}
        {selectedPoll && (
        <div className="modal-overlay">
            <div className="modal-content large">
            <div className="modal-header">
                <h2>{selectedPoll.name}</h2>
                <button className="close-button" onClick={() => setSelectedPoll(null)}>×</button>
            </div>
            
            <p className="poll-detail-description">{selectedPoll.description}</p>

            {/* Вопросы из шаблона */}
            {selectedPoll.template && selectedPoll.template.questions && selectedPoll.template.questions.length > 0 ? (
                <div className="poll-questions-section">
                <h3>Вопросы для оценки:</h3>
                <p className="questions-hint">Выберите один из вариантов ответа для каждого вопроса</p>
                
                <div className="poll-questions-list">
                    {selectedPoll.template.questions.map((question, idx) => (
                    <div key={idx} className="poll-question-card">
                        <div className="poll-question-header">
                        <span className="question-number">{idx + 1}</span>
                        <span className="question-text">{question.text}</span>
                        </div>
                        
                        <div className="poll-question-options">
                        {question.options?.map(opt => (
                        <label key={opt.value} className="poll-option-label">
                            <input
                            type="radio"
                            name={`question-${idx}`}
                            value={opt.value}
                            disabled
                            />
                            <span className={`poll-option-badge ${
                            opt.value === -1 ? 'negative' :
                            opt.value === 0 ? 'neutral' : 'positive'
                            }`}>
                            {opt.value === -1
                                ? `${opt.value} (${opt.label})`
                                : opt.value === 1
                                ? `+${opt.value} (${opt.label})`
                                : `${opt.value} (${opt.label})`}
                            </span>
                        </label>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            ) : (
                // <div className="no-questions-message">
                //   <p>В этом опроснике нет вопросов</p>
                // </div>
                <div className="poll-questions-section">
                  <h3>Вопросы для оценки:</h3>

                  {[
                    'Случалось ли вам замечать проблему, которая касалась не вашей части работы, но могла повлиять на общий результат, и вы сообщили о ней команде?',
                    'Возникала ли за время проекта ситуация, когда вы, понимая, что не успеваете к дедлайну или столкнулись с трудностью, написали об этом в общий чат до того, как вас начали спрашивать о статусе?',
                    'Помогали ли вы кому-то из коллег осваивать новый инструмент или формат работы?',
                    'Потребовалось ли вам больше одного дня, чтобы разобраться с шаблоном и принципами работы в Archimate?'
                  ].map((question, idx) => (
                    <div key={idx} className="poll-question-card">
                      <div className="poll-question-header">
                        <span className="question-number">{idx + 1}</span>
                        <span className="question-text">{question}</span>
                      </div>

                      <div className="poll-question-options">
                        {[-1, 0, 1].map(value => (
                          <label key={value} className="poll-option-label">
                            <input
                              type="radio"
                              name={`static-question-${idx}`}
                              value={value}
                              disabled
                            />
                            <span className={`poll-option-badge ${
                              value === -1 ? 'negative' :
                              value === 0 ? 'neutral' : 'positive'
                            }`}>
                              {value === 1 ? `+${value}` : value}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            )}

            {/* Информация об опроснике */}
            <div className="poll-detail-info">
                <div className="info-item">
                <span className="info-label">Статус:</span>
                <span className={`status-badge ${selectedPoll.status}`}>
                    {selectedPoll.status === 'active' ? 'Активен' : 
                    selectedPoll.status === 'draft' ? 'Черновик' : 'Закрыт'}
                </span>
                </div>
                <div className="info-item">
                <span className="info-label">Период:</span>
                <span>{new Date(selectedPoll.start_date).toLocaleDateString()} - {new Date(selectedPoll.end_date).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                <span className="info-label">Участников:</span>
                <span>{selectedPoll.assignments_count || 0} (прошло: {selectedPoll.completed_count || 0})</span>
                </div>
            </div>

            <div className="modal-actions">
                <button className="close-modal-btn" onClick={() => setSelectedPoll(null)}>
                Закрыть
                </button>
            </div>
            </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Poll;