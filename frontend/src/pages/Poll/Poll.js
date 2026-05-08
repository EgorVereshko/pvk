import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Poll.css';

// ========== ГРУППИРОВКА КОМПЕТЕНЦИЙ ПО ПВК ==========
const competenceCategories = {
  'Обучаемость': {
    color: '#3498db',
    competences: [
      'Умение анализировать, выявлять существенное',
      'Воспроизведение по инструкции',
      'Реакция на критику (устное общение)',
      'Поведение в ситуации неопределенности',
      'Исправление ошибок',
      'Умение планировать (декомпозиция)',
      'Умение планировать (логика последовательности)',
      'Умение планировать (оценка сроков)'
    ]
  },
  'Вовлеченность': {
    color: '#2ecc71',
    competences: [
      'Умение анализировать, выявлять существенное',
      'Реакция на критику (устное общение)',
      'Предупреждение о проблемах'
    ]
  },
  'Организованность': {
    color: '#f39c12',
    competences: [
      'Предупреждение о проблемах',
      'Соблюдение сроков',
      'Умение планировать (декомпозиция)',
      'Умение планировать (логика последовательности)',
      'Умение планировать (оценка сроков)',
      'Вклад во взаимосвязанную задачу (согласование)',
      'Вклад во взаимосвязанную задачу (своевременность)'
    ]
  },
  'Работа в команде': {
    color: '#e74c3c',
    competences: [
      'Предупреждение о проблемах',
      'Вклад во взаимосвязанную задачу (согласование)',
      'Вклад во взаимосвязанную задачу (своевременность)'
    ]
  }
};

// Все компетенции с привязкой к категории
const competenceOptions = [
  // Обучаемость
  { id: 1, name: 'Умение анализировать, выявлять существенное', category: 'Обучаемость' },
  { id: 2, name: 'Воспроизведение по инструкции', category: 'Обучаемость' },
  { id: 3, name: 'Реакция на критику (устное общение)', category: 'Обучаемость' },
  { id: 4, name: 'Поведение в ситуации неопределенности', category: 'Обучаемость' },
  { id: 5, name: 'Исправление ошибок', category: 'Обучаемость' },
  { id: 6, name: 'Умение планировать (декомпозиция)', category: 'Обучаемость' },
  { id: 7, name: 'Умение планировать (логика последовательности)', category: 'Обучаемость' },
  { id: 8, name: 'Умение планировать (оценка сроков)', category: 'Обучаемость' },
  // Вовлеченность
  { id: 9, name: 'Умение анализировать, выявлять существенное', category: 'Вовлеченность' },
  { id: 10, name: 'Реакция на критику (устное общение)', category: 'Вовлеченность' },
  { id: 11, name: 'Предупреждение о проблемах', category: 'Вовлеченность' },
  // Организованность
  { id: 12, name: 'Предупреждение о проблемах', category: 'Организованность' },
  { id: 13, name: 'Соблюдение сроков', category: 'Организованность' },
  { id: 14, name: 'Умение планировать (декомпозиция)', category: 'Организованность' },
  { id: 15, name: 'Умение планировать (логика последовательности)', category: 'Организованность' },
  { id: 16, name: 'Умение планировать (оценка сроков)', category: 'Организованность' },
  { id: 17, name: 'Вклад во взаимосвязанную задачу (согласование)', category: 'Организованность' },
  { id: 18, name: 'Вклад во взаимосвязанную задачу (своевременность)', category: 'Организованность' },
  // Работа в команде
  { id: 19, name: 'Предупреждение о проблемах', category: 'Работа в команде' },
  { id: 20, name: 'Вклад во взаимосвязанную задачу (согласование)', category: 'Работа в команде' },
  { id: 21, name: 'Вклад во взаимосвязанную задачу (своевременность)', category: 'Работа в команде' }
];

// ========== ДАННЫЕ КОМПЕТЕНЦИЙ С ПАРНЫМИ ИНДИКАТОРАМИ ==========
const competenceIndicators = {
  'Умение анализировать, выявлять существенное': {
    positive: 'Правильно определил проблему, причины, лежащие в основе проекта?',
    negative: 'Не смог правильно, чётко определить проблему проекта, потребности пользователей?'
  },
  'Воспроизведение по инструкции': {
    positive: 'Результат соответствует заданным требованиям, шаблону?',
    negative: 'В полученном результате много ошибок, не соответствующих требованиям к работе, инструкциям?'
  },
  'Организованность': {
    positive: 'Материалы по проекту хранит в общей проектной папке?',
    negative: 'Материалы хранятся только у студента, отсутствуют в общем доступе?'
  },
  'Реакция на критику (устное общение)': {
    positive: 'Студент внимательно слушал, уточнял, когда получал оценку, обратную связь своей работе?',
    negative: 'Студент спорил, перебивал, когда ему давали обратную связь, оценивали результаты?'
  },
  'Исправление ошибок': {
    positive: 'Исправляет указанные ошибки, недочёты?',
    negative: 'Ошибки, недочёты исправляет после нескольких напоминаний, не с первого раза?'
  },
  'Поведение в ситуации неопределенности': {
    positive: 'Задаёт уточняющие вопросы к поставленной задаче, чтобы выяснить детали?',
    negative: 'Приступает к задаче, не уточнив детали, из-за чего не получает необходимый результат?'
  },
  'Предупреждение о проблемах': {
    positive: 'Предупреждает заранее, что не справляется с задачей, не успевает на собрание и т.п., до того как у него уточняют это?',
    negative: 'Не предупреждает заранее о том, что не справляется с задачей, не успевает на собрание и т.п.?'
  },
  'Соблюдение сроков': {
    positive: 'Соблюдает поставленные сроки задач. Своевременно подключается к собраниям?',
    negative: 'Обычно задерживает сроки выполнения задач, опаздывает на собрания без предупреждения?'
  },
  'Умение планировать (декомпозиция)': {
    positive: 'Корректно разбивает (декомпозирует) задачу на отдельные работы?',
    negative: 'Нарушена логика при декомпозиции задач на отдельные работы?'
  },
  'Умение планировать (логика последовательности)': {
    positive: 'Выстраивает логику последовательность задач при планировании работы?',
    negative: 'Нарушает логику последовательности выполняемых задач при планировании работы?'
  },
  'Умение планировать (оценка сроков)': {
    positive: 'При планировании адекватно определяет сроки для задач, в которые может быть получен результат?',
    negative: 'При планировании выставляет несоответствующее объему время для выполнения той или иной задачи?'
  },
  'Вклад во взаимосвязанную задачу (согласование)': {
    positive: 'Участвует в обсуждении и согласовании сроков для задач, взаимосвязанных с другими участниками?',
    negative: 'Не принимает участие в обсуждении и согласовании сроков для задач, в которых взаимодействует с другими участниками?'
  },
  'Вклад во взаимосвязанную задачу (своевременность)': {
    positive: 'Своевременно сдавал результаты своей части работы во взаимосвязанных задачах?',
    negative: 'Задерживал сдачу результатов своей части работы во взаимосвязанных задачах?'
  }
};

// ========== ВОПРОСЫ ДЛЯ ОПРОСА (4 вопроса с категориями) ==========
const surveyQuestions = [
  {
    id: 1,
    text: 'Результат соответствует заданным требованиям, шаблону?',
    category: 'Вовлеченность',
    categoryColor: '#2ecc71'
  },
  {
    id: 2,
    text: 'Соблюдает ли поставленные задачам сроки? Своевременно подключается к собраниям?',
    category: 'Организованность',
    categoryColor: '#f39c12'
  },
  {
    id: 3,
    text: 'Обычно не участвует в обсуждении и согласовании сроков для задач, в которых взаимодействует с другими участниками?',
    category: 'Работа в команде',
    categoryColor: '#e74c3c'
  },
  {
    id: 4,
    text: 'Правильно определил проблему, причины, лежащие в основе проекта?',
    category: 'Обучаемость',
    categoryColor: '#3498db'
  }
];

// Функция генерации вопросов из выбранных компетенций
const generateQuestionsFromCompetences = (selectedCompetences) => {
  const questions = [];
  
  selectedCompetences.forEach(comp => {
    const indicators = competenceIndicators[comp.name];
    if (indicators) {
      questions.push({
        text: indicators.positive,
        type: 'boolean',
        required: true,
        options: [
          { value: 1, label: 'Да' },
          { value: 0, label: 'Нет' }
        ]
      });
      
      questions.push({
        text: indicators.negative,
        type: 'boolean',
        required: true,
        options: [
          { value: 1, label: 'Да' },
          { value: 0, label: 'Нет' }
        ]
      });
    }
  });
  
  return questions;
};

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
  
  const [pollForm, setPollForm] = useState({
    name: '',
    description: '',
    template_id: '',
    team_ids: [],
    start_date: '',
    end_date: ''
  });
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: ''
  });

  const [selectedCompetences, setSelectedCompetences] = useState([]);

  // Состояния для модального окна опроса
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [selectedSurveyPoll, setSelectedSurveyPoll] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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
    } catch (error) {
      console.error('Ошибка загрузки деталей опросника:', error);
      alert('Не удалось загрузить детали опросника');
    }
  };

  // Открытие модального окна опроса
  const openSurveyModal = (poll) => {
    setSelectedSurveyPoll(poll);
    setSurveyAnswers({});
    setShowSurveyModal(true);
  };

  // Обработка изменения ответа
  const handleAnswerChange = (questionId, value) => {
    setSurveyAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  // Сохранение ответов
  const handleSaveSurvey = async () => {
    // Проверяем, что все вопросы отвечены
    const allAnswered = surveyQuestions.every(q => surveyAnswers[q.id] !== undefined);
    
    if (!allAnswered) {
      alert('Пожалуйста, ответьте на все вопросы');
      return;
    }

    try {
      // Здесь можно отправить ответы на сервер
      // await api.post(`/api/polls/${selectedSurveyPoll?.id}/submit/`, {
      //   answers: surveyAnswers
      // });
      
      console.log('Сохраненные ответы:', surveyAnswers);
      
      // Закрываем модальное окно
      setShowSurveyModal(false);
      setSelectedSurveyPoll(null);
      setSurveyAnswers({});
      
      // Показываем зеленую плашку
      setShowSuccessToast(true);
      
      // Скрываем плашку через 3 секунды
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка сохранения ответов:', error);
      alert('Ошибка при сохранении ответов');
    }
  };

  const addCompetence = (competence) => {
    if (!selectedCompetences.find(c => c.id === competence.id)) {
      setSelectedCompetences([...selectedCompetences, competence]);
    }
  };

  const removeCompetence = (competenceId) => {
    setSelectedCompetences(selectedCompetences.filter(c => c.id !== competenceId));
  };

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
      const questions = generateQuestionsFromCompetences(selectedCompetences);
      
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

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    
    const competences = [];
    const questionTexts = template.questions?.map(q => q.text) || [];
    
    Object.keys(competenceIndicators).forEach(compName => {
      const indicators = competenceIndicators[compName];
      if (questionTexts.includes(indicators.positive) && questionTexts.includes(indicators.negative)) {
        const option = competenceOptions.find(opt => opt.name === compName);
        if (option && !competences.find(c => c.id === option.id)) {
          competences.push(option);
        }
      }
    });
    
    setSelectedCompetences(competences);
    setTemplateForm({
      name: template.name,
      description: template.description || ''
    });
  };

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
      const questions = generateQuestionsFromCompetences(selectedCompetences);
      
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
      alert('Ошибка при создании опросника: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

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
                  <button 
                    className="survey-button"
                    onClick={() => openSurveyModal(poll)}
                  >
                    Пройти опрос
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
                    Вопросов: {template.questions?.length || 0}
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
                <h3>Выберите индикаторы для оценки</h3>
                <p className="hint">
                  Каждая компетенция будет представлена двумя вопросами: 
                  положительным и отрицательным индикатором.
                  Компетенции сгруппированы по четырем ПВК.
                </p>
                
                {Object.entries(competenceCategories).map(([category, data]) => (
                  <div key={category} className="category-group">
                    <div 
                      className="category-header"
                      style={{ borderLeftColor: data.color }}
                    >
                      <h4 style={{ color: data.color }}>{category}</h4>
                      <span className="category-count">
                        {data.competences.length} индикаторов
                      </span>
                    </div>
                    
                    <div className="competences-list category-competences">
                      {data.competences.map(compName => {
                        const option = competenceOptions.find(
                          opt => opt.name === compName && opt.category === category
                        );
                        if (!option) return null;
                        
                        const isSelected = selectedCompetences.some(c => 
                          c.name === option.name && c.category === option.category
                        );
                        
                        return (
                          <div key={option.id} className="competence-item">
                            <label className="competence-select">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    addCompetence(option);
                                  } else {
                                    removeCompetence(option.id);
                                  }
                                }}
                              />
                              <span className="competence-name">{compName}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {selectedCompetences.length > 0 && (
                  <div className="selected-summary">
                    <h4>Выбранные компетенции ({selectedCompetences.length}):</h4>
                    <div className="summary-list">
                      {Object.entries(competenceCategories).map(([category, data]) => {
                        const selectedInCategory = selectedCompetences.filter(
                          c => c.category === category
                        );
                        if (selectedInCategory.length === 0) return null;
                        
                        return (
                          <div key={category} className="summary-category">
                            <span 
                              className="summary-category-badge"
                              style={{ backgroundColor: data.color }}
                            >
                              {category}
                            </span>
                            <div className="summary-category-items">
                              {selectedInCategory.map(comp => (
                                <span key={comp.id} className="summary-item">
                                  {comp.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="summary-hint">
                      Будет создано {selectedCompetences.length * 2} вопросов 
                      (положительный и отрицательный индикатор для каждой компетенции)
                    </p>
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
                <h3>Выберите индикаторы для оценки</h3>
                <p className="hint">
                  Каждая компетенция будет представлена двумя вопросами: 
                  положительным и отрицательным индикатором.
                  Компетенции сгруппированы по четырем ПВК.
                </p>
                
                {Object.entries(competenceCategories).map(([category, data]) => (
                  <div key={category} className="category-group">
                    <div 
                      className="category-header"
                      style={{ borderLeftColor: data.color }}
                    >
                      <h4 style={{ color: data.color }}>{category}</h4>
                      <span className="category-count">
                        {data.competences.length} индикаторов
                      </span>
                    </div>
                    
                    <div className="competences-list category-competences">
                      {data.competences.map(compName => {
                        const option = competenceOptions.find(
                          opt => opt.name === compName && opt.category === category
                        );
                        if (!option) return null;
                        
                        const isSelected = selectedCompetences.some(c => 
                          c.name === option.name && c.category === option.category
                        );
                        
                        return (
                          <div key={option.id} className="competence-item">
                            <label className="competence-select">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    addCompetence(option);
                                  } else {
                                    removeCompetence(option.id);
                                  }
                                }}
                              />
                              <span className="competence-name">{compName}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {selectedCompetences.length > 0 && (
                  <div className="selected-summary">
                    <h4>Выбранные компетенции ({selectedCompetences.length}):</h4>
                    <div className="summary-list">
                      {Object.entries(competenceCategories).map(([category, data]) => {
                        const selectedInCategory = selectedCompetences.filter(
                          c => c.category === category
                        );
                        if (selectedInCategory.length === 0) return null;
                        
                        return (
                          <div key={category} className="summary-category">
                            <span 
                              className="summary-category-badge"
                              style={{ backgroundColor: data.color }}
                            >
                              {category}
                            </span>
                            <div className="summary-category-items">
                              {selectedInCategory.map(comp => (
                                <span key={comp.id} className="summary-item">
                                  {comp.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="summary-hint">
                      Будет создано {selectedCompetences.length * 2} вопросов 
                      (положительный и отрицательный индикатор для каждой компетенции)
                    </p>
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
                <p><strong>Количество вопросов:</strong> {selectedTemplate.questions?.length || 0}</p>
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
                      <div className="question-options-preview">
                        <span className="option-badge positive">Да</span>
                        <span className="option-badge negative">Нет</span>
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
                                opt.value === 1 ? 'positive' : 'negative'
                              }`}>
                                {opt.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-questions-message">
                  <p>В этом опроснике нет вопросов. Выберите шаблон с вопросами при создании.</p>
                </div>
              )}

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

        {/* МОДАЛКА ПРОХОЖДЕНИЯ ОПРОСА */}
        {showSurveyModal && (
          <div className="modal-overlay">
            <div className="modal-content survey-modal">
              <div className="modal-header">
                <h2>Прохождение опроса</h2>
                <button className="close-button" onClick={() => setShowSurveyModal(false)}>×</button>
              </div>
              
              <p className="survey-description">
                Оцените сотрудника по следующим критериям
              </p>

              <div className="survey-questions">
                {surveyQuestions.map((question) => (
                  <div key={question.id} className="survey-question-card">
                    <div 
                      className="survey-question-category"
                      style={{ backgroundColor: question.categoryColor }}
                    >
                      {question.category}
                    </div>
                    <div className="survey-question-text">
                      {question.text}
                    </div>
                    <div className="survey-question-options">
                      <label className="survey-option">
                        <input
                          type="radio"
                          name={`q${question.id}`}
                          value="1"
                          checked={surveyAnswers[question.id] === 1}
                          onChange={() => handleAnswerChange(question.id, '1')}
                        />
                        <span className="option-value positive">Да</span>
                      </label>
                      <label className="survey-option">
                        <input
                          type="radio"
                          name={`q${question.id}`}
                          value="-1"
                          checked={surveyAnswers[question.id] === -1}
                          onChange={() => handleAnswerChange(question.id, '-1')}
                        />
                        <span className="option-value negative">Нет</span>
                      </label>
                      <label className="survey-option">
                        <input
                          type="radio"
                          name={`q${question.id}`}
                          value="0"
                          checked={surveyAnswers[question.id] === 0}
                          onChange={() => handleAnswerChange(question.id, '0')}
                        />
                        <span className="option-value neutral">Не оценить</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button className="save-button" onClick={handleSaveSurvey}>
                  Сохранить
                </button>
                <button className="cancel-button" onClick={() => setShowSurveyModal(false)}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ЗЕЛЕНАЯ ПЛАШКА УСПЕХА */}
        {showSuccessToast && (
          <div className="success-toast">
            <span className="toast-icon">✓</span>
            <span className="toast-message">Данные сохранены</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Poll;