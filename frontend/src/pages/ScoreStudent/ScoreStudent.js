import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './ScoreStudent.css';

const ScoreStudent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [sliderValues, setSliderValues] = useState({
    'Организованность': 0.0,
    'Вовлеченность': 0.0,
    'Работа в команде': 0.0,
    'Обучаемость': 0.0,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [currentForm360, setCurrentForm360] = useState(null);
  const [availableQualities, setAvailableQualities] = useState([
    'Организованность',
    'Вовлеченность',
    'Работа в команде',
    'Обучаемость'
  ]);
  const [teamInfo, setTeamInfo] = useState(null);
  
  const sliderRefs = {
    'Организованность': useRef(null),
    'Вовлеченность': useRef(null),
    'Работа в команде': useRef(null),
    'Обучаемость': useRef(null),
  };

  const navigate = useNavigate();

  useEffect(() => {
    const savedForm360 = localStorage.getItem('current_form360');
    if (savedForm360) {
      const form360 = JSON.parse(savedForm360);
      setCurrentForm360(form360);
      
      if (form360.qualities && form360.qualities.length > 0) {
        setAvailableQualities(form360.qualities);
        
        const initialValues = {};
        form360.qualities.forEach(quality => {
          initialValues[quality] = 0.0;
        });
        setSliderValues(initialValues);
      }
      
      setTeamInfo({
        name: form360.team_name,
        deadline: form360.deadline
      });
    }
    
    fetchUserProfile();
    fetchStudents();
  }, [navigate]);

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

  const fetchStudents = async () => {
    try {
      let studentsData = [];
      
      if (currentForm360 && currentForm360.team_id) {
        const response = await api.get(`/api/team/${currentForm360.team_id}/students/`);
        studentsData = response.data;
      } else {
        const response = await api.get('/api/students/');
        studentsData = response.data;
      }
      
      setStudents(studentsData);
      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0].id);
        loadStudentScores(studentsData[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentScores = async (studentId) => {
    if (currentForm360) {
      try {
        const response = await api.get(`/api/form360/${currentForm360.id}/student/${studentId}/scores/`);
        if (response.data && response.data.scores) {
          setSliderValues(response.data.scores);
        } else {
          const resetValues = {};
          availableQualities.forEach(quality => {
            resetValues[quality] = 0.0;
          });
          setSliderValues(resetValues);
        }
      } catch (error) {
        console.log('Нет сохранённых оценок для этого студента');
        const resetValues = {};
        availableQualities.forEach(quality => {
          resetValues[quality] = 0.0;
        });
        setSliderValues(resetValues);
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSliderChange = (competence, value) => {
    setSliderValues(prev => ({
      ...prev,
      [competence]: parseFloat(value),
    }));
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
      if (currentForm360) {
        const scoresData = Object.entries(sliderValues).map(([competenceName, score]) => ({
          competence_name: competenceName,
          score: parseFloat(score),
          student_profile_id: selectedStudent
        }));

        await api.post(`/api/form360/${currentForm360.id}/submit/`, {
          student_id: selectedStudent,
          scores: sliderValues,
          qualities_scores: scoresData
        });
        
        setSaveMessage('Оценки успешно сохранены в форму 360!');
      } else {
        const scoresData = Object.entries(sliderValues).map(([competenceName, score]) => ({
          competence_name: competenceName,
          score: parseFloat(score),
          student_profile_id: selectedStudent
        }));

        await api.post('/api/competences/scores/', scoresData);
        setSaveMessage('Оценки успешно сохранены!');
      }
      
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaveMessage(`Ошибка: ${error.response?.data?.error || 'Неизвестная ошибка'}`);
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (value) => {
    return value.toFixed(1);
  };

  const getBubblePosition = (competence) => {
    const value = sliderValues[competence] || 0;
    const percent = ((value + 1) / 4) * 100;
    return percent;
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="score-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="score-content">
        <div className="score-card">
          <h1 className="score-title">
            {currentForm360 ? `Форма 360: ${currentForm360.name}` : 'Оценка студента'}
          </h1>

          <div className="team-info">
            <span className="team-name">
              {currentForm360 ? `Команда: ${currentForm360.team_name}` : 'Команда ПВК'}
            </span>
            {currentForm360 && (
              <span className="team-deadline">
                Дедлайн: {new Date(currentForm360.deadline).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>

          <div className="students-tabs">
            {students.map((student) => (
              <button
                key={student.id}
                className={`student-tab ${selectedStudent === student.id ? 'active' : ''}`}
                onClick={() => handleTabChange(student.id)}
              >
                {student.short_name || student.full_name || `Студент ${student.id}`}
              </button>
            ))}
          </div>

          <div className="competence-sliders">
            {availableQualities.map(quality => (
              <div key={quality} className="competence-row">
                <span className="competence-name">{quality}</span>
                <div className="slider-wrapper" ref={sliderRefs[quality]}>
                  <div 
                    className="slider-value-bubble"
                    style={{ left: `${getBubblePosition(quality)}%` }}
                  >
                    <span className="current-value">
                      {formatValue(sliderValues[quality] || 0)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="3"
                    step="0.1"
                    value={sliderValues[quality] || 0}
                    onChange={(e) => handleSliderChange(quality, e.target.value)}
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
              </div>
            ))}
          </div>

          <div className="save-section">
            <div className="save-button-container">
              <button
                className="save-button"
                onClick={handleSaveScores}
                disabled={saving || !selectedStudent}
              >
                {saving ? 'Сохранение...' : 'Сохранить оценки'}
              </button>
            </div>
            {saveMessage && (
              <div className={`save-message ${saveMessage.includes('успешно') ? 'success' : 'error'}`}>
                {saveMessage}
              </div>
            )}
          </div>
          
          {currentForm360 && (
            <div className="back-to-forms">
              <button onClick={() => {
                localStorage.removeItem('current_form360');
                navigate('/form360');
              }} className="back-button">
                ← Вернуться к списку форм
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreStudent;