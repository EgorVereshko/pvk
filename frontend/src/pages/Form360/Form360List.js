import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Form360.css';

const Form360List = () => {
  const { user, logout, isOrganizer, isTutor, isProjectant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const navigate = useNavigate();

  const userTeamName = user?.team_name || 'Моя команда';

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      let response;
      
      if (isProjectant()) {
        response = await api.get('/api/forms/projectant/');
        console.log('Формы для проектанта:', response.data);
        
        const projectantForms = response.data.forms_360 || [];
        const formattedForms = projectantForms.map(form => ({
          id: form.id,
          name: form.name,
          team_name: userTeamName,
          deadline: form.end_datetime,
          qualities: form.qualities?.map(q => q.name) || ['Вовлеченность', 'Работа в команде', 'Обучаемость', 'Организованность'],
          status: form.status
        }));
        setForms(formattedForms);
      } else {
        response = await api.get('/api/forms/tutor/');
        console.log('Формы для куратора:', response.data);
        
        const formattedForms = response.data.map(form => ({
          id: form.id,
          name: form.name,
          team_name: form.teams_names?.[0] || 'Без команды',
          deadline: form.end_datetime,
          qualities: form.qualities?.map(q => q.name) || ['Вовлеченность', 'Работа в команде', 'Обучаемость', 'Организованность'],
          status: form.status
        }));
        setForms(formattedForms);
      }
    } catch (error) {
      console.error('Ошибка загрузки форм:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту форму?')) {
      try {
        await api.delete(`/api/forms/delete/${formId}/`);
        alert('Форма удалена');
        fetchForms();
      } catch (error) {
        console.error('Ошибка удаления формы:', error);
        alert('Ошибка при удалении формы');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatus = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate > now ? 'active' : 'closed';
  };

  const handleStartEvaluation = (form) => {
    navigate('/score/student', { state: { formId: form.id, formName: form.name } });
  };

  const activeForms = forms.filter(f => getStatus(f.deadline) === 'active');
  const closedForms = forms.filter(f => getStatus(f.deadline) === 'closed');

  const displayedForms = activeTab === 'active' ? activeForms : closedForms;

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="form360-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="form360-content">
        <div className="form360-header">
          <h1>Форма 360</h1>
          {(isOrganizer() || isTutor()) && (
            <button className="create-form-btn" onClick={() => navigate('/form360/create')}>
              + Создать форму
            </button>
          )}
        </div>
        
        <div className="form360-tabs">
          <button 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Активные ({activeForms.length})
          </button>
          <button 
            className={`tab ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed')}
          >
            Завершённые ({closedForms.length})
          </button>
        </div>
        
        <div className="forms-list">
          {displayedForms.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Нет {activeTab === 'active' ? 'активных' : 'завершённых'} форм</p>
              {(isOrganizer() || isTutor()) && (
                <button onClick={() => navigate('/form360/create')}>
                  Создать первую форму
                </button>
              )}
            </div>
          ) : (
            displayedForms.map(form => (
              <div key={form.id} className="form-item">
                <div className="form-item-header">
                  <h3>{form.name}</h3>
                  <div className="form-actions-buttons">
                    {(isOrganizer() || isTutor()) && (
                      <button 
                        className="delete-form-btn"
                        onClick={() => handleDeleteForm(form.id)}
                        title="Удалить форму"
                      >
                        🗑️
                      </button>
                    )}
                    <span className={`status-badge ${getStatus(form.deadline)}`}>
                      {getStatus(form.deadline) === 'active' ? 'Активна' : 'Завершена'}
                    </span>
                  </div>
                </div>
                <div className="form-item-details">
                  <div className="detail">
                    <span className="detail-label">Команда:</span>
                    <span className="detail-value">{form.team_name}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Дедлайн:</span>
                    <span className="detail-value">
                      {new Date(form.deadline).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Качества:</span>
                    <div className="qualities-tags">
                      {form.qualities.slice(0, 5).map((q, idx) => (
                        <span key={idx} className="quality-tag">{q}</span>
                      ))}
                      {form.qualities.length > 5 && (
                        <span className="quality-tag more">+{form.qualities.length - 5}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-item-actions">
                  {isProjectant() && (
                    <button 
                      className="start-btn"
                      onClick={() => handleStartEvaluation(form)}
                      disabled={getStatus(form.deadline) !== 'active'}
                    >
                      {getStatus(form.deadline) === 'active' ? 'Пройти оценку' : 'Просмотреть результаты'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Form360List;