import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Poll.css';

const PollPass = () => {
  const { link } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPollByLink();
    fetchUserProfile();
  }, [link]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/');
      setUser(res.data);
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
    }
  };

  const fetchPollByLink = async () => {
    try {
      const response = await api.get(`/api/poll/link/${link}/`);
      setPoll(response.data);
      
      // Инициализируем ответы
      const initialAnswers = {};
      response.data.questions.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Ошибка загрузки опросника:', error);
      alert('Опросник не найден или ссылка недействительна');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    // Проверяем, что все обязательные вопросы заполнены
    const unansweredRequired = poll.questions.filter(q => 
      q.required && !answers[q.id] && answers[q.id] !== 0
    );

    if (unansweredRequired.length > 0) {
      alert('Заполните все обязательные вопросы');
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        question_id: parseInt(questionId),
        value: parseInt(value)
      }));

      await api.post('/api/poll/submit/', {
        assignment_id: poll.assignment_id,
        answers: formattedAnswers
      });

      alert('Ответы успешно сохранены!');
      navigate('/profile');
    } catch (error) {
      console.error('Ошибка сохранения ответов:', error);
      alert('Ошибка при сохранении ответов');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Загрузка опросника...</div>;

  return (
    <div className="poll-pass-container">
      <Header onLogout={() => { localStorage.clear(); navigate('/'); }} user={user} />

      <div className="poll-pass-content">
        <div className="poll-pass-card">
          <h1>{poll.poll_name}</h1>
          <p className="poll-pass-description">{poll.poll_description}</p>
          
          <div className="poll-pass-info">
            <p><strong>Студент:</strong> {poll.student_name}</p>
            <p><strong>Дедлайн:</strong> {new Date(poll.end_date).toLocaleDateString()}</p>
          </div>

          <div className="poll-pass-questions">
            {poll.questions.map((question, idx) => (
              <div key={question.id} className="poll-pass-question">
                <div className="question-header">
                  <span className="question-number">{idx + 1}.</span>
                  <span className="question-text">
                    {question.text}
                    {question.required && <span className="required-star">*</span>}
                  </span>
                </div>

                <div className="question-options">
                  {[-1, 0, 1].map(value => (
                    <label key={value} className="option-label">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={value}
                        checked={answers[question.id] === value}
                        onChange={() => handleAnswerChange(question.id, value)}
                      />
                      <span className={`option-badge ${value === -1 ? 'negative' : value === 0 ? 'neutral' : 'positive'}`}>
                        {value === -1 ? '-1 (Низкий)' : value === 0 ? '0 (Средний)' : '+1 (Высокий)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="poll-pass-actions">
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Отправка...' : 'Отправить ответы'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollPass;