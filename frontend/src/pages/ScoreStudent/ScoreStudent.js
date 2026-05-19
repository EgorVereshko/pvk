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
  const sliderRefs = {
    'Организованность': useRef(null),
    'Вовлеченность': useRef(null),
    'Работа в команде': useRef(null),
    'Обучаемость': useRef(null),
  };

  const navigate = useNavigate();

  const competences = [
    'Вовлеченность',
    'Работа в команде',
    'Обучаемость',
    'Организованность',
  ];

  useEffect(() => {
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
      const response = await api.get('/api/students/');
      setStudents(response.data);
      // Автоматически выбираем первого студента, если список не пуст
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error);
    } finally {
      setLoading(false);
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

      const response = await api.post('/api/competences/scores/', scoresData);
     
      setSaveMessage('Оценки успешно сохранены!');
      console.log('Сохраненные оценки:', response.data);
      
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
    const value = sliderValues[competence];
    // Преобразуем значение -1...3 в проценты 0%...100%
    const percent = ((value + 1) / 4) * 100;
    return percent;
  };

  const handleTabChange = (studentId) => {
    setSelectedStudent(studentId);
    // Здесь можно добавить загрузку сохраненных оценок для выбранного студента
    // loadStudentScores(studentId);
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="score-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="score-content">
        <div className="score-card">
          <h1 className="score-title">Оценка студента</h1>

          {/* Информация о команде и сроке */}
          <div className="team-info">
            <span className="team-name">Команда ПВК</span>
            <span className="team-deadline">Срок: 18.05.2026</span>
          </div>

          {/* Вкладки студентов вместо выпадающего списка */}
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

          {/* Информация о выбранном студенте */}
          <div className="competence-sliders">
            {competences.map(c => (
              <div key={c} className="competence-row">
                <span className="competence-name">{c}</span>
                <div className="slider-wrapper" ref={sliderRefs[c]}>
                  <div 
                    className="slider-value-bubble"
                    style={{ left: `${getBubblePosition(c)}%` }}
                  >
                    <span className="current-value">
                      {formatValue(sliderValues[c])}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="3"
                    step="0.1"
                    value={sliderValues[c]}
                    onChange={(e) => handleSliderChange(c, e.target.value)}
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
        </div>
      </div>
    </div>
  );
};

export default ScoreStudent;