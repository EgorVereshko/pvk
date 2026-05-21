import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Form360.css';

const Form360Pass = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchFormDetails();
  }, [id]);

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

  const fetchFormDetails = async () => {
    try {
      const res = await api.get(`/api/form360/${id}/`);
      setForm(res.data);
      setStudents(res.data.students || []);
      
      const initialScores = {};
      if (res.data.qualities) {
        res.data.qualities.forEach(quality => {
          initialScores[quality] = '';
        });
      }
      setScores(initialScores);
    } catch (error) {
      console.error('Ошибка загрузки формы:', error);
      alert('Форма не найдена');
      navigate('/form360');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudent(studentId);
    
    if (form && form.savedScores && form.savedScores[studentId]) {
      setScores(form.savedScores[studentId]);
    } else {
      const resetScores = {};
      if (form && form.qualities) {
        form.qualities.forEach(quality => {
          resetScores[quality] = '';
        });
      }
      setScores(resetScores);
    }
  };

  const handleScoreChange = (quality, value) => {
    setScores(prev => ({
      ...prev,
      [quality]: parseInt(value, 10)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      alert('Выберите участника для оценки');
      return;
    }
    
    const allFilled = form.qualities.every(q => scores[q] !== '' && scores[q] !== undefined);
    if (!allFilled) {
      alert('Пожалуйста, оцените все качества');
      return;
    }
    
    setSaving(true);
    
    try {
      await api.post(`/api/form360/${id}/submit/`, {
        student_id: selectedStudent,
        scores: scores
      });
      
      setSubmitted(true);
      
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent ? { ...s, evaluated: true } : s
      ));
      
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Ошибка сохранения оценок:', error);
      alert('Ошибка при сохранении оценок');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!form) return <div className="loading">Форма не найдена</div>;

  return (
    <div className="form360-container">
      <Header onLogout={() => { localStorage.clear(); navigate('/'); }} user={user} />
      
      <div className="form360-content">
        <div className="form360-pass-card">
          <div className="pass-header">
            <button className="back-btn" onClick={() => navigate('/form360')}>
              ← Назад к списку
            </button>
            <h1>{form.name}</h1>
            <div className="deadline-info">
              Дедлайн: {new Date(form.deadline).toLocaleDateString('ru-RU')}
            </div>
          </div>
          
          <div className="pass-body">
            <div className="students-list">
              <h3>Участники команды "{form.team_name}"</h3>
              <div className="students-grid">
                {students.map(student => (
                  <button
                    key={student.id}
                    className={`student-card ${selectedStudent === student.id ? 'active' : ''} ${student.evaluated ? 'evaluated' : ''}`}
                    onClick={() => handleStudentSelect(student.id)}
                  >
                    <div className="student-avatar">
                      {student.short_name?.charAt(0) || student.first_name?.charAt(0) || '?'}
                    </div>
                    <div className="student-name">{student.short_name || student.full_name}</div>
                    {student.evaluated && (
                      <div className="evaluated-badge">✓ Оценён</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedStudent && (
              <div className="evaluation-section">
                <h3>Оценка участника</h3>
                <div className="scores-grid">
                  {form.qualities.map(quality => (
                    <div key={quality} className="score-row">
                      <label className="score-label">{quality}</label>
                      <div className="score-options">
                        {[-1, 0, 1].map(value => (
                          <label key={value} className="score-option">
                            <input
                              type="radio"
                              name={quality}
                              value={value}
                              checked={scores[quality] === value}
                              onChange={(e) => handleScoreChange(quality, e.target.value)}
                            />
                            <span className={`score-value ${value === -1 ? 'negative' : value === 0 ? 'neutral' : 'positive'}`}>
                              {value === -1 ? '-1' : value === 0 ? '0' : '+1'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="submit-scores-btn"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? 'Сохранение...' : 'Сохранить оценку'}
                </button>
                
                {submitted && (
                  <div className="success-message">
                    ✓ Оценка успешно сохранена!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form360Pass;