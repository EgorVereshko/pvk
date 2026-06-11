import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Form360.scss';

const Form360Pass = () => {
  const { id } = useParams();
  const { user, logout, isProjectant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isProjectant()) {
      alert('Только студенты могут проходить оценку 360');
      navigate('/form360');
      return;
    }
    
    fetchFormDetails();
  }, [id]);

  const fetchFormDetails = async () => {
    try {
      const res = await api.get(`/api/forms/fill/${id}/`);
      console.log('Детали формы:', res.data);
      setForm(res.data);
      
      const members = res.data.team?.members || [];
      console.log('Участники команды:', members);
      
      const formattedStudents = members.map(member => ({
        id: member.id,
        short_name: member.name,
        full_name: member.name,
        evaluated: false
      }));
      setStudents(formattedStudents);
      
      const qualities = res.data.qualities || [];
      const initialScores = {};
      qualities.forEach(quality => {
        initialScores[quality.name] = '';
      });
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
    
    const qualities = form?.qualities || [];
    const resetScores = {};
    qualities.forEach(quality => {
      resetScores[quality.name] = '';
    });
    setScores(resetScores);
  };

  const handleScoreChange = (qualityName, value) => {
    setScores(prev => ({
      ...prev,
      [qualityName]: parseInt(value, 10)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      alert('Выберите участника для оценки');
      return;
    }
    
    const qualities = form?.qualities || [];
    const allFilled = qualities.every(q => scores[q.name] !== '' && scores[q.name] !== undefined);
    if (!allFilled) {
      alert('Пожалуйста, оцените все качества');
      return;
    }
    
    setSaving(true);
    
    try {
      await api.post(`/api/forms/submit/360`, {
        form_id: parseInt(id),
        evaluated_projectants: [{
          evaluated_projectant_id: selectedStudent,
          scores: Object.entries(scores).map(([quality_name, score]) => ({
            quality_name: quality_name,
            score: score
          }))
        }]
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!form) return <div className="loading">Форма не найдена</div>;

  const qualitiesList = form.qualities || [];

  return (
    <div className="form360-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="form360-content">
        <div className="form360-pass-card">
          <div className="pass-header">
            <button className="back-btn" onClick={() => navigate('/form360')}>
              ← Назад к списку
            </button>
            <h1>{form.name}</h1>
            <div className="deadline-info">
              Дедлайн: {new Date(form.end_datetime).toLocaleDateString('ru-RU')}
            </div>
          </div>
          
          <div className="pass-body">
            <div className="students-list">
              <h3>Участники команды "{form.team?.name || 'Моя команда'}"</h3>
              <div className="students-grid">
                {students.length === 0 ? (
                  <div className="empty-students">Нет участников в команде</div>
                ) : (
                  students.map(student => (
                    <button
                      key={student.id}
                      className={`student-card ${selectedStudent === student.id ? 'active' : ''} ${student.evaluated ? 'evaluated' : ''}`}
                      onClick={() => handleStudentSelect(student.id)}
                    >
                      <div className="student-avatar">
                        {student.short_name?.charAt(0) || '?'}
                      </div>
                      <div className="student-name">{student.short_name || student.full_name}</div>
                      {student.evaluated && (
                        <div className="evaluated-badge">✓ Оценён</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {selectedStudent && (
              <div className="evaluation-section">
                <h3>Оценка участника</h3>
                <div className="scores-grid">
                  {qualitiesList.map(quality => (
                    <div key={quality.id} className="score-row">
                      <label className="score-label">{quality.name}</label>
                      <div className="score-options">
                        {[-1, 0, 1].map(value => (
                          <label key={value} className="score-option">
                            <input
                              type="radio"
                              name={quality.name}
                              value={value}
                              checked={scores[quality.name] === value}
                              onChange={(e) => handleScoreChange(quality.name, e.target.value)}
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