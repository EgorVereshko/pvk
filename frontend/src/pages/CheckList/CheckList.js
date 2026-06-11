import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import Header from '../../components/Header/Header';
import './CheckList.scss';

const CheckList = () => {
  const { user, logout, isTutor, isOrganizer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [step, setStep] = useState(1);
  
  const [allIndicators, setAllIndicators] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    team: '',
    eventName: '',
    template: ''
  });
  
  const [scores, setScores] = useState([]);
  
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTutor() && !isOrganizer()) {
      alert('Доступ запрещен');
      navigate('/events/tutor');
    }
  }, [isTutor, isOrganizer]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsRes, templatesRes, indicatorsRes] = await Promise.all([
          api.get('/api/teams/'),
          api.get('/api/templates/'),
          api.get('/api/indicators/')
        ]);
        setTeams(teamsRes.data);
        setTemplates(templatesRes.data);
        setAllIndicators(indicatorsRes.data);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loadTemplateIndicators = async (templateId) => {
    console.log('loadTemplateIndicators started for templateId:', templateId);
    setIndicatorsLoading(true);
    try {
      const res = await api.get(`/api/templates/${templateId}/`);
      console.log('Template response:', res.data);
      if (res.data && res.data.indicators) {
        const indicatorsWithDetails = res.data.indicators.map(ind => ({
          id: ind.id,
          name: ind.name,
          quality: ind.quality || null
        }));
        console.log('Indicators to set:', indicatorsWithDetails);
        setSelectedIndicators(indicatorsWithDetails);
        
        const newScores = indicatorsWithDetails.map(() => Array(teamMembers.length).fill(null));
        setScores(newScores);
      }
    } catch (error) {
      console.error('Ошибка загрузки шаблона:', error);
    } finally {
      setIndicatorsLoading(false);
      console.log('loadTemplateIndicators finished');
    }
  };

  useEffect(() => {
    if (formData.team) {
      const loadMembers = async () => {
        try {
          const res = await api.get(`/api/teams/${formData.team}/members/`);
          setTeamMembers(res.data);
          const newScores = selectedIndicators.map(() => Array(res.data.length).fill(null));
          setScores(newScores);
        } catch (error) {
          console.error('Ошибка загрузки участников:', error);
          setTeamMembers([]);
        }
      };
      loadMembers();
    } else {
      setTeamMembers([]);
      setScores([]);
    }
  }, [formData.team]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTemplateSelect = async (e) => {
    const templateId = e.target.value;
    console.log('Template selected:', templateId);
    setFormData(prev => ({ ...prev, template: templateId }));
    
    if (templateId) {
      setSelectedIndicators([]);
      await loadTemplateIndicators(templateId);
    } else {
      setSelectedIndicators([]);
      setScores([]);
    }
  };

  useEffect(() => {
    console.log('selectedIndicators changed:', selectedIndicators.length, selectedIndicators);
  }, [selectedIndicators]);

  const handleNext = () => {
    console.log('=== handleNext called ===');
    console.log('formData.eventName:', formData.eventName);
    console.log('formData.team:', formData.team);
    console.log('teamMembers.length:', teamMembers.length);
    console.log('selectedIndicators.length:', selectedIndicators.length);
    console.log('indicatorsLoading:', indicatorsLoading);
    
    if (!formData.eventName || !formData.team) {
      alert('Заполните все поля');
      return;
    }
    if (teamMembers.length === 0) {
      alert('В выбранной команде нет студентов');
      return;
    }
    if (selectedIndicators.length === 0) {
      alert('Выберите индикаторы для оценки (выберите шаблон)');
      return;
    }
    console.log('All checks passed, moving to step 2');
    setStep(2);
  };

  const handleScoreChange = (indicatorIdx, studentIdx, value) => {
    const newScores = [...scores];
    newScores[indicatorIdx][studentIdx] = value === '' ? null : parseInt(value);
    setScores(newScores);
  };

  const addIndicatorManually = (indicatorId) => {
    const indicator = allIndicators.find(i => i.id === parseInt(indicatorId));
    if (indicator && !selectedIndicators.find(i => i.id === indicator.id)) {
      const newIndicators = [...selectedIndicators, indicator];
      setSelectedIndicators(newIndicators);
      const newScores = [...scores, Array(teamMembers.length).fill(null)];
      setScores(newScores);
    }
  };

  const removeIndicator = (idx) => {
    const newIndicators = selectedIndicators.filter((_, i) => i !== idx);
    setSelectedIndicators(newIndicators);
    const newScores = scores.filter((_, i) => i !== idx);
    setScores(newScores);
  };

  const saveAsTemplate = async () => {
    if (!newTemplateName) {
      alert('Введите название шаблона');
      return;
    }
    
    if (selectedIndicators.length === 0) {
      alert('Выберите хотя бы один индикатор');
      return;
    }
    
    try {
      await api.post('/api/templates/create/', {
        name: newTemplateName,
        indicators: selectedIndicators.map(i => i.id)
      });
      
      alert('Шаблон сохранен');
      setShowSaveTemplate(false);
      setNewTemplateName('');
      const res = await api.get('/api/templates/');
      setTemplates(res.data);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при сохранении');
    }
  };

  const saveChecklist = async () => {
    if (!formData.team || !formData.eventName) {
      alert('Заполните все поля');
      return;
    }
    
    for (let i = 0; i < selectedIndicators.length; i++) {
      for (let s = 0; s < teamMembers.length; s++) {
        if (scores[i]?.[s] === null || scores[i]?.[s] === undefined) {
          alert(`Заполните оценку для индикатора "${selectedIndicators[i].name}" у студента ${teamMembers[s].name}`);
          return;
        }
      }
    }
    
    try {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      
      const formResponse = await api.post('/api/forms/create/', {
        name: formData.eventName,
        type: 'Чек-лист',
        teams_id: [parseInt(formData.team)],
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        template_id: formData.template || null
      });
      
      const formId = formResponse.data.id;
      console.log('Форма создана, ID:', formId);
      
      const evaluatedProjectants = teamMembers.map((member, sIdx) => ({
        evaluated_projectant_id: member.id,
        scores: selectedIndicators.map((indicator, iIdx) => ({
          indicator_id: indicator.id,
          score: scores[iIdx]?.[sIdx] || 0
        }))
      }));
      
      await api.post('/api/forms/submit/check_list', {
        form_id: formId,
        evaluator_id: user?.id,
        evaluated_projectants: evaluatedProjectants
      });
      
      alert('Чек-лист успешно сохранен!');
      navigate('/events/tutor');
      
    } catch (error) {
      console.error('Ошибка сохранения чек-листа:', error);
      alert('Ошибка при сохранении: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  const getQualityForIndicator = (indicatorName) => {
    const qualityMap = {
      'Вклад во взаимосвязанную задачу': 'Работа в команде',
      'Предупреждает о возникающих проблемах': 'Работа в команде',
      'Умение планировать': 'Организованность',
      'Соблюдение сроков': 'Организованность',
      'Поведение в ситуации неопределенности': 'Обучаемость',
      'Исправление ошибок': 'Обучаемость',
      'Реакция на критику (устное общение)': 'Обучаемость',
      'Воспроизведение по инструкции': 'Обучаемость',
      'Умение анализировать, выявлять существенное': 'Обучаемость',
      'Умение анализировать, выявлять существенное': 'Вовлеченность',
      'Реакция на критику (устное общение)': 'Вовлеченность',
      'Предупреждает о возникающих проблемах': 'Вовлеченность'
    };
    return qualityMap[indicatorName] || 'Другое';
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  const isTemplateSelected = !!formData.template;
  
  const isNextDisabled = () => {
    const disabled = !formData.eventName || 
      !formData.team || 
      teamMembers.length === 0 || 
      selectedIndicators.length === 0 ||
      indicatorsLoading;
    
    console.log('isNextDisabled check:', {
      eventName: !formData.eventName,
      team: !formData.team,
      teamMembers: teamMembers.length === 0,
      indicators: selectedIndicators.length === 0,
      loading: indicatorsLoading,
      result: disabled
    });
    
    return disabled;
  };

  return (
    <div className="checklist-container">
      <Header onLogout={logout} user={user} />
      
      <div className="checklist-content">
        <div className="checklist-card">
          <h1>Создание чек-листа</h1>
          
          {step === 1 ? (
            <div className="form-step">
              <div className="form-group">
                <label>Название мероприятия *</label>
                <input type="text" name="eventName" value={formData.eventName} onChange={handleFormChange} />
              </div>
              
              <div className="form-group">
                <label>Команда *</label>
                <select name="team" value={formData.team} onChange={handleFormChange}>
                  <option value="">Выберите команду</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                {teamMembers.length > 0 && (
                  <small className="info">Студентов: {teamMembers.length}</small>
                )}
              </div>
              
              <div className="form-group">
                <label>Шаблон</label>
                <select name="template" value={formData.template} onChange={handleTemplateSelect}>
                  <option value="">Выберите шаблон</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <small className="info">Шаблон содержит набор индикаторов для оценки</small>
              </div>
              
              {/* Показываем индикаторы ТОЛЬКО если шаблон НЕ выбран */}
              {!isTemplateSelected && (
                <div className="indicators-selection">
                  <label>Индикаторы для оценки</label>
                  <p className="hint">Выберите индикаторы, по которым будет оцениваться студент</p>
                  
                  {indicatorsLoading ? (
                    <div className="loading-small">Загрузка индикаторов...</div>
                  ) : (
                    <>
                      <div className="selected-indicators-list">
                        {selectedIndicators.map((indicator, idx) => (
                          <div key={indicator.id} className="selected-indicator-item">
                            <div className="indicator-info">
                              <span className="indicator-name">{indicator.name}</span>
                              <span className="indicator-quality-badge">{getQualityForIndicator(indicator.name)}</span>
                            </div>
                            <button 
                              type="button"
                              className="remove-indicator-btn"
                              onClick={() => removeIndicator(idx)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {selectedIndicators.length === 0 && (
                          <div className="empty-indicators">
                            <span>Нет выбранных индикаторов</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="add-indicator-section">
                        <select 
                          onChange={(e) => addIndicatorManually(e.target.value)}
                          value=""
                          className="indicator-select"
                        >
                          <option value="">-- Добавить индикатор --</option>
                          {allIndicators
                            .filter(i => !selectedIndicators.find(si => si.id === i.id))
                            .map(indicator => (
                              <option key={indicator.id} value={indicator.id}>
                                {indicator.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Показываем информацию о загруженных индикаторах из шаблона */}
              {isTemplateSelected && (
                <div className="template-indicators-info">
                  <label>Индикаторы из шаблона:</label>
                  {indicatorsLoading ? (
                    <div className="loading-small">Загрузка индикаторов из шаблона...</div>
                  ) : (
                    <>
                      <div className="template-indicators-list">
                        {selectedIndicators.map((indicator, idx) => (
                          <div key={indicator.id} className="template-indicator-item">
                            <span className="indicator-name">{indicator.name}</span>
                            <span className="indicator-quality-badge">{getQualityForIndicator(indicator.name)}</span>
                          </div>
                        ))}
                      </div>
                      {selectedIndicators.length === 0 && !indicatorsLoading && (
                        <div className="warning-message">
                          ⚠️ В выбранном шаблоне нет индикаторов
                        </div>
                      )}
                      <p className="info-text">
                        ✓ Индикаторы загружены из шаблона. При необходимости вы сможете добавить дополнительные индикаторы на следующем шаге.
                      </p>
                    </>
                  )}
                </div>
              )}
              
              <div className="form-actions-step1">
                <button 
                  className="save-template-btn"
                  type="button"
                  onClick={() => setShowSaveTemplate(true)}
                  disabled={selectedIndicators.length === 0 || indicatorsLoading}
                >
                  Сохранить как шаблон
                </button>
                <button 
                  className="next-button" 
                  onClick={handleNext} 
                  disabled={isNextDisabled()}
                >
                  {indicatorsLoading ? 'Загрузка...' : 'Далее →'}
                </button>
              </div>
            </div>
          ) : (
            <div className="table-step">
              <div className="table-wrapper">
                <table className="checklist-table">
                  <thead>
                    <tr>
                      <th className="student-col">Студент</th>
                      {selectedIndicators.map((indicator, idx) => (
                        <th key={indicator.id} className="indicator-col">
                          <div className="indicator-header">
                            <span className="indicator-header-name">{indicator.name}</span>
                            <span className="indicator-header-quality">
                              {getQualityForIndicator(indicator.name)}
                            </span>
                            <button 
                              className="remove-indicator-table-btn"
                              onClick={() => removeIndicator(idx)}
                              title="Удалить индикатор"
                            >
                              ×
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member, sIdx) => (
                      <tr key={member.id}>
                        <td className="student-name-cell">
                          <span className="student-name">{member.name}</span>
                        </td>
                        {selectedIndicators.map((_, iIdx) => (
                          <td key={iIdx} className="score-cell">
                            <select
                              value={scores[iIdx]?.[sIdx] !== undefined && scores[iIdx]?.[sIdx] !== null ? scores[iIdx][sIdx] : ''}
                              onChange={(e) => handleScoreChange(iIdx, sIdx, e.target.value)}
                              className="score-select"
                            >
                              <option value="">-</option>
                              <option value="-1">-1</option>
                              <option value="0">0</option>
                              <option value="1">1</option>
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="add-indicator-table">
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      addIndicatorManually(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  value=""
                  className="indicator-select"
                >
                  <option value="">+ Добавить индикатор</option>
                  {allIndicators
                    .filter(i => !selectedIndicators.find(si => si.id === i.id))
                    .map(indicator => (
                      <option key={indicator.id} value={indicator.id}>
                        {indicator.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="actions">
                <button onClick={saveChecklist}>Сохранить чек-лист</button>
                <button onClick={() => setStep(1)}>Назад</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showSaveTemplate && (
        <div className="modal">
          <div className="modal-content">
            <h3>Сохранить шаблон</h3>
            <input
              type="text"
              placeholder="Название шаблона"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={saveAsTemplate}>Сохранить</button>
              <button onClick={() => setShowSaveTemplate(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckList;