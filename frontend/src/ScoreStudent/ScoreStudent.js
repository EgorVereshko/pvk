import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from '../Header/Header';
import './ScoreStudent.css';

const ScoreStudent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [sliderValues, setSliderValues] = useState({
    'Организованность': 1,
    'Вовлеченность': -1,
    'Работа в команде': 1,
    'Обучаемость': 1,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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

  // Загрузка студентов из БД
  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students/');
      setStudents(response.data);
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
      [competence]: parseInt(value, 10),
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

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="score-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="score-content">
        <div className="score-card">
          <h1 className="score-title">Оценка студента</h1>

          <div className="student-selector">
            <label>Студент:</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Выберите студента</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.short_name}
                </option>
              ))}
            </select>
          </div>

          <div className="competence-sliders">
            {competences.map(c => (
              <div key={c} className="competence-row">
                <span className="competence-name">{c}</span>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="-1"
                    max="3"
                    step="1"
                    value={sliderValues[c]}
                    onChange={(e) => handleSliderChange(c, e.target.value)}
                  />
                  <div className="slider-ticks">
                    {[-1, 0, 1, 2, 3].map((v) => (
                      <div key={v} className="slider-tick">
                        <span className="tick-line" />
                        <span className="tick-value">{v}</span>
                      </div>
                    ))}
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