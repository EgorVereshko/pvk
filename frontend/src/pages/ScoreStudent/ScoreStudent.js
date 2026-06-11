import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './ScoreStudent.scss';

const ScoreStudent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [sliderValues, setSliderValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [tooltipText, setTooltipText] = useState({});
  const [formName, setFormName] = useState('');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [editingValue, setEditingValue] = useState({});
  const [completedStudents, setCompletedStudents] = useState({});
  const [formStatus, setFormStatus] = useState('');
  
  const location = useLocation();
  const formId = location.state?.formId;
  
  const defaultQualities = ['Обучаемость', 'Вовлеченность', 'Организованность', 'Работа в команде'];
  const sliderRefs = useRef({});
  const navigate = useNavigate();

  const qualityTooltips = {
    'Организованность': {
      '-1': 'Проектант часто опаздывает на встречи, забывает о дедлайнах, материалы хранит только у себя, не делится с командой.',
      '0': 'Проектант в целом соблюдает сроки, но иногда забывает обновлять статус задач.',
      '1': 'Проектант всегда соблюдает дедлайны, заранее предупреждает о возможных задержках.',
      '2': 'Проектант отлично организует свою работу, помогает команде с планированием.',
      '3': 'Проектант демонстрирует выдающуюся организованность, оптимизирует процессы.'
    },
    'Вовлеченность': {
      '-1': 'Проектант пассивен на собраниях, не проявляет инициативу, делает только то, что прямо сказали.',
      '0': 'Проектант участвует в обсуждениях, когда его спрашивают. Иногда предлагает идеи.',
      '1': 'Проектант активно участвует в жизни команды, предлагает идеи, помогает коллегам.',
      '2': 'Проектант постоянно генерирует идеи, вдохновляет команду.',
      '3': 'Проектант — настоящий лидер, его вовлечённость повышает эффективность всей команды.'
    },
    'Работа в команде': {
      '-1': 'Проектант работает изолированно, не синхронизируется с командой.',
      '0': 'Проектант отвечает на сообщения, участвует в обсуждениях, но редко помогает коллегам.',
      '1': 'Проектант активно взаимодействует с командой, помогает коллегам, делится знаниями.',
      '2': 'Проектант отлично координирует совместную работу, разрешает конфликты.',
      '3': 'Проектант — душа команды, создаёт атмосферу доверия и взаимопомощи.'
    },
    'Обучаемость': {
      '-1': 'Проектант долго осваивает новые инструменты, не задаёт уточняющих вопросов.',
      '0': 'Проектант осваивает новое в среднем темпе, задаёт вопросы когда что-то непонятно.',
      '1': 'Проектант быстро осваивает новые технологии, инструменты и процессы.',
      '2': 'Проектант не только быстро учится, но и помогает другим освоить новое.',
      '3': 'Проектант — эксперт в обучении, легко переквалифицируется и внедряет новые подходы.'
    }
  };

  useEffect(() => {
    fetchUserProfile();
    
    if (formId) {
      fetchFormQualities();
      loadCompletedStudents();
      loadFormStatus();
    } else {
      fetchStudents();
      fetchQualities();
    }
  }, [formId]);

  const loadCompletedStudents = async () => {
    try {
      const response = await api.get(`/api/forms/${formId}/completed-students/`);
      setCompletedStudents(response.data);
      
      const totalStudents = students.length;
      const completedCount = Object.keys(response.data).length;
      if (totalStudents > 0 && completedCount === totalStudents) {
        setFormStatus('Завершена');
      }
    } catch (error) {
      console.error('Ошибка загрузки информации о завершённых студентах:', error);
    }
  };

  const loadFormStatus = async () => {
    try {
      const response = await api.post(`/api/forms/${formId}/check-complete/`);
      setFormStatus(response.data.form_status);
    } catch (error) {
      console.error('Ошибка загрузки статуса формы:', error);
    }
  };

  const checkAndCompleteForm = async () => {
    try {
      const response = await api.post(`/api/forms/${formId}/check-complete/`);
      if (response.data.completed) {
        setSaveMessage(response.data.message);
        setFormStatus('Завершена');
        setTimeout(() => {
          navigate('/form360');
        }, 2000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка проверки завершения формы:', error);
      return false;
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/');
      setUser(res.data);
      
      if (res.data.team_name) {
        setTeamName(res.data.team_name);
      } else {
        try {
          const teamRes = await api.get('/api/user/team/');
          if (teamRes.data && teamRes.data.name) {
            setTeamName(teamRes.data.name);
          }
        } catch (err) {
          console.log('Не удалось получить команду пользователя');
          setTeamName('Моя команда');
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  const fetchFormQualities = async () => {
    try {
      const res = await api.get(`/api/forms/fill/${formId}/`);
      console.log('Детали формы:', res.data);
      
      setFormName(res.data.name);
      
      const qualities = res.data.qualities || [];
      const qualityNames = qualities.map(q => q.name);
      setAvailableQualities(qualityNames);
      
      const initialValues = {};
      qualityNames.forEach(quality => {
        initialValues[quality] = 0.0;
      });
      setSliderValues(initialValues);
      
      const members = res.data.team?.members || [];
      const formattedStudents = members.map(member => ({
        id: member.id,
        short_name: member.name,
        full_name: member.name
      }));
      setStudents(formattedStudents);
      if (formattedStudents.length > 0) {
        setSelectedStudent(formattedStudents[0].id);
      }
      if (res.data.team?.name) {
        setTeamName(res.data.team.name);
      }
    } catch (error) {
      console.error('Ошибка загрузки формы:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQualities = async () => {
    try {
      const res = await api.get('/api/qualities/');
      if (res.data && res.data.length > 0) {
        const qualityNames = res.data.map(q => q.name);
        setAvailableQualities(qualityNames);
        
        const initialValues = {};
        qualityNames.forEach(quality => {
          initialValues[quality] = 0.0;
        });
        setSliderValues(initialValues);
      } else {
        setAvailableQualities(defaultQualities);
        const initialValues = {};
        defaultQualities.forEach(quality => {
          initialValues[quality] = 0.0;
        });
        setSliderValues(initialValues);
      }
    } catch (error) {
      console.log('Используем стандартные качества');
      setAvailableQualities(defaultQualities);
      const initialValues = {};
      defaultQualities.forEach(quality => {
        initialValues[quality] = 0.0;
      });
      setSliderValues(initialValues);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students/');
      console.log('Студенты:', response.data);
      
      if (response.data && response.data.length > 0) {
        setStudents(response.data);
        const firstStudentId = response.data[0].id;
        setSelectedStudent(firstStudentId);
        await loadStudentScores(firstStudentId);
      }
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentScores = async (studentId) => {
    try {
      const response = await api.get(`/api/latest_qualities_scores/${studentId}/`);
      console.log(`Оценки студента ${studentId}:`, response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const scoresObject = {};
        response.data.forEach(item => {
          scoresObject[item.quality_name] = item.score;
        });
        setSliderValues(scoresObject);
      }
    } catch (error) {
      console.log(`Нет сохранённых оценок для студента ${studentId}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSliderChange = (competence, value) => {
    const numValue = parseFloat(value);
    setSliderValues(prev => ({
      ...prev,
      [competence]: numValue,
    }));
  };

  const handleInputChange = (competence, value) => {
    setEditingValue(prev => ({ ...prev, [competence]: value }));
  };

  const handleInputBlur = (competence) => {
    const value = editingValue[competence];
    if (value !== undefined && value !== '') {
      let numValue = parseFloat(value);
      if (isNaN(numValue)) {
        numValue = 0;
      }
      numValue = Math.max(-1, Math.min(3, numValue));
      numValue = Math.round(numValue * 10) / 10;
      
      setSliderValues(prev => ({
        ...prev,
        [competence]: numValue,
      }));
    }
    setEditingValue(prev => ({ ...prev, [competence]: undefined }));
  };

  const handleInputKeyDown = (competence, e) => {
    if (e.key === 'Enter') {
      handleInputBlur(competence);
    }
  };

  const handleTabChange = async (studentId) => {
    setSelectedStudent(studentId);
    await loadStudentScores(studentId);
  };

  const handleSaveScores = async () => {
    if (!selectedStudent) {
      setSaveMessage('Выберите студента');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const scoresData = Object.entries(sliderValues).map(([competenceName, score]) => ({
        competence_name: competenceName,
        score: parseFloat(score),
        student_profile_id: selectedStudent
      }));

      const url = formId 
        ? `/api/competences/scores/?form_id=${formId}`
        : '/api/competences/scores/';
      
      console.log('Saving scores to URL:', url);
      console.log('Scores data:', scoresData);
      
      await api.post(url, scoresData);
      
      if (formId) {
        setCompletedStudents(prev => ({
          ...prev,
          [selectedStudent]: true
        }));
        
        console.log('Checking if form is complete...');
        const checkResponse = await api.post(`/api/forms/${formId}/check-complete/`);
        console.log('Check response:', checkResponse.data);
        
        if (checkResponse.data.completed) {
          setSaveMessage(checkResponse.data.message);
          setFormStatus('Завершена');
          setTimeout(() => {
            navigate('/form360');
          }, 2000);
        } else {
          const remaining = checkResponse.data.remaining;
          setSaveMessage(`Оценки сохранены! Осталось оценить ${remaining} студентов`);
          setTimeout(() => {
            setSaveMessage('');
          }, 3000);
        }
      } else {
        setSaveMessage('Оценки успешно сохранены!');
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaveMessage(`Ошибка: ${error.response?.data?.error || error.message || 'Неизвестная ошибка'}`);
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (value) => (value || 0).toFixed(1);
  
  const getBubblePosition = (competence) => {
    const value = sliderValues[competence] || 0;
    const percent = ((value + 1) / 4) * 100;
    return percent;
  };

  const showTooltip = (quality) => {
    setTooltipText(prev => ({ ...prev, [quality]: qualityTooltips[quality] }));
  };

  const hideTooltip = (quality) => {
    setTooltipText(prev => ({ ...prev, [quality]: '' }));
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  const qualitiesList = availableQualities.length > 0 ? availableQualities : defaultQualities;
  const isFormActive = formStatus !== 'Завершена';
  const completedCount = Object.keys(completedStudents).length;
  const totalStudents = students.length;
  const progressPercent = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

  if (formId && formStatus === 'Завершена') {
    return (
      <div className="score-container">
        <Header onLogout={handleLogout} user={user} />
        <div className="score-content">
          <div className="score-card">
            <h1 className="score-title">Форма 360</h1>
            <div className="form-completed-message">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h2>Форма "{formName}" завершена!</h2>
              <p>Вы успешно оценили всех студентов.</p>
              <button className="back-button" onClick={() => navigate('/form360')}>
                ← Вернуться к списку форм
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="score-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="score-content">
        <div className="score-card">
          <h1 className="score-title">Оценка студента</h1>
          
          {formId && formName && (
            <div className="form-info-badge">
              📝 {formName}
            </div>
          )}

          <div className="team-info">
            <span className="team-name">Команда: {teamName || 'Загрузка...'}</span>
            <span className="team-deadline">Оценка от -1 до 3</span>
          </div>

          {/* Прогресс-бар */}
          {formId && students.length > 0 && (
            <div className="progress-section">
              <div className="progress-info">
                <span>Прогресс оценки:</span>
                <span>{completedCount} / {totalStudents} студентов</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="students-tabs">
            {students.length === 0 ? (
              <div className="empty-students">Нет студентов для оценки</div>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  className={`student-tab ${selectedStudent === student.id ? 'active' : ''} ${completedStudents[student.id] ? 'completed' : ''}`}
                  onClick={() => handleTabChange(student.id)}
                  disabled={completedStudents[student.id]}
                >
                  {student.short_name || student.full_name || `Студент ${student.id}`}
                  {completedStudents[student.id] && <span className="completed-check"> ✓</span>}
                </button>
              ))
            )}
          </div>

          {selectedStudent && completedStudents[selectedStudent] && (
            <div className="already-completed-warning">
              ⚠️ Этот студент уже оценён. Вы не можете изменить оценку.
            </div>
          )}

          <div className="competence-sliders">
            {qualitiesList.map(quality => (
              <div key={quality} className="competence-row">
                <div className="competence-name-wrapper">
                  <span className="competence-name">{quality}</span>
                  <div 
                    className="tooltip-icon"
                    onMouseEnter={() => showTooltip(quality)}
                    onMouseLeave={() => hideTooltip(quality)}
                  >
                    ?
                    {tooltipText[quality] && (
                      <div className="tooltip-content">
                        <div className="tooltip-arrow"></div>
                        <div className="tooltip-values">
                          <div className="tooltip-value negative">
                            <strong>-1:</strong> {tooltipText[quality]?.['-1']}
                          </div>
                          <div className="tooltip-value neutral">
                            <strong>0:</strong> {tooltipText[quality]?.['0']}
                          </div>
                          <div className="tooltip-value positive">
                            <strong>+1:</strong> {tooltipText[quality]?.['1']}
                          </div>
                          <div className="tooltip-value positive">
                            <strong>+2:</strong> {tooltipText[quality]?.['2']}
                          </div>
                          <div className="tooltip-value positive">
                            <strong>+3:</strong> {tooltipText[quality]?.['3']}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="slider-wrapper" ref={el => sliderRefs.current[quality] = el}>
                  <div 
                    className="slider-value-bubble"
                    style={{ left: `${getBubblePosition(quality)}%` }}
                  >
                    <span className="current-value">
                      {formatValue(sliderValues[quality])}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="3"
                    step="0.1"
                    value={sliderValues[quality] || 0}
                    onChange={(e) => handleSliderChange(quality, e.target.value)}
                    disabled={completedStudents[selectedStudent] || !isFormActive}
                  />
                  <div className="slider-markers">
                    {[-1, -0.9, -0.8, -0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 
                      0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 
                      1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 
                      2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 
                      3].map((v) => (
                      <div 
                        key={v} 
                        className={`marker ${Number.isInteger(v) ? 'major' : 'minor'}`}
                        style={{ left: `${((v + 1) / 4) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="slider-labels">
                    <span className="slider-label">-1</span>
                    <span className="slider-label">0</span>
                    <span className="slider-label">1</span>
                    <span className="slider-label">2</span>
                    <span className="slider-label">3</span>
                  </div>
                </div>
                <div className="manual-input">
                  <input
                    type="text"
                    className="manual-input-field"
                    value={editingValue[quality] !== undefined ? editingValue[quality] : formatValue(sliderValues[quality])}
                    onChange={(e) => handleInputChange(quality, e.target.value)}
                    onBlur={() => handleInputBlur(quality)}
                    onKeyDown={(e) => handleInputKeyDown(quality, e)}
                    disabled={completedStudents[selectedStudent] || !isFormActive}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="save-section">
            <div className="save-button-container">
              <button
                className="save-button"
                onClick={handleSaveScores}
                disabled={saving || !selectedStudent || completedStudents[selectedStudent] || !isFormActive}
              >
                {saving ? 'Сохранение...' : 'Сохранить оценки'}
              </button>
            </div>
            {saveMessage && (
              <div className={`save-message ${saveMessage.includes('успешно') || saveMessage.includes('сохранены') ? 'success' : 'error'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreStudent;