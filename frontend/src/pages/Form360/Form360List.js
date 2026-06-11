import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Form360.scss';

const Form360List = () => {
  const { user, logout, isOrganizer, isTutor, isProjectant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const userTeamName = user?.team_name || 'Моя команда';

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
    
    if (location.state?.completedFormId) {
      updateFormStatus(location.state.completedFormId, 'Завершена');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      let response;
      let allForms = [];
      
      if (isProjectant()) {
        response = await api.get('/api/forms/projectant/');
        console.log('Формы для проектанта:', response.data);
        
        const projectantForms = response.data.forms_360 || [];
        const formattedForms = projectantForms.map(form => ({
          id: form.id,
          name: form.name,
          team_name: userTeamName,
          deadline: form.end_datetime,
          qualities: ['Вовлеченность', 'Работа в команде', 'Обучаемость', 'Организованность'],
          status: form.status
        }));
        setForms(formattedForms);
        setLoading(false);
        return;
      }
      
      if (isTutor()) {
        response = await api.get('/api/forms/tutor/');
        console.log('Формы для куратора (/tutor/):', response.data);
        allForms = response.data;
      } else if (isOrganizer()) {
        response = await api.get('/api/forms/all/');
        console.log('Все формы для организатора (/all/):', response.data);
        allForms = response.data;
      }
      
      if (!Array.isArray(allForms)) {
        allForms = allForms.results || allForms.forms || [];
      }
      
      const filteredForms = allForms.filter(form => form.type === 'Оценка 360');
      console.log('Формы 360 после фильтрации:', filteredForms);
      
      const formattedForms = filteredForms.map(form => ({
        id: form.id,
        name: form.name,
        team_name: form.teams_names?.[0] || 'Без команды',
        deadline: form.end_datetime,
        qualities: ['Вовлеченность', 'Работа в команде', 'Обучаемость', 'Организованность'],
        status: form.status
      }));
      setForms(formattedForms);
      
    } catch (error) {
      console.error('Ошибка загрузки форм:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFormStatus = (formId, newStatus) => {
    setForms(prevForms => 
      prevForms.map(form => 
        form.id === formId ? { ...form, status: newStatus } : form
      )
    );
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

  const getStatus = (deadline, formStatus) => {
    if (formStatus === 'Завершена') {
      return 'closed';
    }
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate > now ? 'active' : 'closed';
  };

  const handleStartEvaluation = (form) => {
    if (form.status === 'Завершена') {
      alert('Эта форма уже завершена');
      return;
    }
    
    navigate('/score/student', { 
      state: { 
        formId: form.id, 
        formName: form.name
      } 
    });
  };

  const activeForms = forms.filter(f => getStatus(f.deadline, f.status) === 'active');
  const closedForms = forms.filter(f => getStatus(f.deadline, f.status) === 'closed');

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
        
        {successMessage && (
          <div className="success-message">
            ✅ {successMessage}
          </div>
        )}
        
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
                    <span className={`status-badge ${getStatus(form.deadline, form.status)}`}>
                      {form.status === 'Завершена' ? 'Завершена' : (getStatus(form.deadline, form.status) === 'active' ? 'Активна' : 'Завершена')}
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
                      disabled={form.status === 'Завершена'}
                    >
                      {form.status === 'Завершена' ? 'Завершена' : 'Пройти оценку'}
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