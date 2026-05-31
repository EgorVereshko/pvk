import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './PollPass.scss';

const PollPass = () => {
  const { form_id } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    if (form_id) {
      fetchPollByLink();
    } else {
      alert('Неверная ссылка для опросника');
      navigate('/profile');
    }
  }, [form_id]);

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
      console.log(`Загрузка опросника: /api/forms/fill/${form_id}/`);
      const response = await api.get(`/api/forms/fill/${form_id}/`);
      console.log('Ответ сервера:', response.data);
      setPoll(response.data);
      
      const initialAnswers = {};
      if (response.data.template && response.data.template.indicators) {
        response.data.template.indicators.forEach(indicator => {
          if (indicator.questions) {
            indicator.questions.forEach(question => {
              initialAnswers[question.id] = '';
            });
          }
        });
      }
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Ошибка загрузки опросника:', error);
      alert(error.response?.data?.error || 'Опросник не найден');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const handleSubmit = async () => {
    const unanswered = Object.keys(answers).filter(qId => answers[qId] === '' || answers[qId] === null);
    if (unanswered.length > 0) {
      alert('Ответьте на все вопросы');
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        question_id: parseInt(questionId),
        value: value
      }));

      await api.post('/api/forms/submit/poll', {
        form_id: parseInt(form_id),
        answers: formattedAnswers
      });

      alert('Ответы успешно сохранены!');
      navigate('/profile');
    } catch (error) {
      console.error('Ошибка сохранения ответов:', error);
      alert(error.response?.data?.error || 'Ошибка при сохранении ответов');
    } finally {
      setSubmitting(false);
    }
  };

  const getAllQuestions = () => {
    const questions = [];
    if (poll && poll.template && poll.template.indicators) {
      poll.template.indicators.forEach(indicator => {
        if (indicator.questions) {
          indicator.questions.forEach(question => {
            questions.push({
              id: question.id,
              text: question.question,
              required: true
            });
          });
        }
      });
    }
    return questions;
  };

  const questions = getAllQuestions();
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const isCurrentQuestionAnswered = () => {
    if (questions.length === 0) return false;
    const currentQ = questions[currentQuestion];
    return answers[currentQ.id] !== '' && answers[currentQ.id] !== null;
  };

  if (loading) return (
    <div className="poll-pass-container">
      <div className="poll-pass-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка опросника...</p>
      </div>
    </div>
  );

  if (!poll) return (
    <div className="poll-pass-container">
      <div className="poll-pass-error">
        <p>Опросник не найден</p>
        <button onClick={() => navigate('/profile')}>Вернуться в профиль</button>
      </div>
    </div>
  );

  const currentQ = questions[currentQuestion];

  return (
    <div className="poll-pass-container">
      <Header onLogout={() => { localStorage.clear(); navigate('/'); }} user={user} />

      <div className="poll-pass-wrapper">
        <div className="poll-pass-content">
          <div className="poll-pass-card">
            {/* Прогресс-бар */}
            <div className="poll-pass-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">
                Вопрос {currentQuestion + 1} из {questions.length}
              </div>
            </div>

            {/* Заголовок опросника */}
            <div className="poll-pass-header">
              <div>
                <h1>{poll.name}</h1>
                <div className="poll-pass-meta">
                  <span className="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Создатель: {poll.template?.creator_name || '—'}
                  </span>
                  <span className="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v16h16V4H4zm2 2h12v12H6V6z"></path>
                      <path d="M8 8h8v2H8zM8 12h6v2H8z"></path>
                    </svg>
                    Вопросов: {questions.length}
                  </span>
                </div>
              </div>
              <div className="poll-pass-deadline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Дедлайн: {poll.end_datetime ? new Date(poll.end_datetime).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '—'}
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="poll-pass-no-questions">
                <p>В этом опроснике нет вопросов</p>
              </div>
            ) : (
              <div className="poll-pass-question-container">
                <div className="poll-pass-question-card">
                  <div className="question-counter">Вопрос {currentQuestion + 1}</div>
                  <div className="question-text-large">
                    {currentQ?.text}
                    <span className="required-star">*</span>
                  </div>

                  <div className="question-options-large">
                    <label className={`option-card ${answers[currentQ?.id] === -1 ? 'selected negative' : ''}`}>
                      <input
                        type="radio"
                        name="answer"
                        value="-1"
                        checked={answers[currentQ?.id] === -1}
                        onChange={() => handleAnswerChange(currentQ?.id, -1)}
                      />
                      <div className="option-content">
                        <span className="option-value">-1</span>
                        <span className="option-label-text">Низкий уровень</span>
                        <span className="option-description">Требует внимания и развития</span>
                      </div>
                    </label>

                    <label className={`option-card ${answers[currentQ?.id] === 0 ? 'selected neutral' : ''}`}>
                      <input
                        type="radio"
                        name="answer"
                        value="0"
                        checked={answers[currentQ?.id] === 0}
                        onChange={() => handleAnswerChange(currentQ?.id, 0)}
                      />
                      <div className="option-content">
                        <span className="option-value">0</span>
                        <span className="option-label-text">Средний уровень</span>
                        <span className="option-description">Соответствует ожиданиям</span>
                      </div>
                    </label>

                    <label className={`option-card ${answers[currentQ?.id] === 1 ? 'selected positive' : ''}`}>
                      <input
                        type="radio"
                        name="answer"
                        value="1"
                        checked={answers[currentQ?.id] === 1}
                        onChange={() => handleAnswerChange(currentQ?.id, 1)}
                      />
                      <div className="option-content">
                        <span className="option-value">+1</span>
                        <span className="option-label-text">Высокий уровень</span>
                        <span className="option-description">Превосходит ожидания</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="poll-pass-navigation">
              <button 
                className="nav-btn prev"
                onClick={goToPrev}
                disabled={currentQuestion === 0}
              >
                ← Назад
              </button>
              
              {currentQuestion === questions.length - 1 ? (
                <button 
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting || !isCurrentQuestionAnswered()}
                >
                  {submitting ? 'Отправка...' : '✅ Отправить ответы'}
                </button>
              ) : (
                <button 
                  className="nav-btn next"
                  onClick={goToNext}
                  disabled={!isCurrentQuestionAnswered()}
                >
                  Далее →
                </button>
              )}
            </div>

            {/* Индикатор ответов */}
            <div className="poll-pass-indicator">
              {questions.map((_, idx) => (
                <div 
                  key={idx}
                  className={`indicator-dot ${answers[questions[idx].id] !== '' && answers[questions[idx].id] !== null ? 'answered' : ''} ${currentQuestion === idx ? 'current' : ''}`}
                  onClick={() => setCurrentQuestion(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollPass;