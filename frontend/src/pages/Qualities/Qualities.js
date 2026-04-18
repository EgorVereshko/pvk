import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Qualities.css';

const Qualities = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qualities, setQualities] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(null);
  
  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    competences: [],
    indicators: []
  });
  
  const [currentIndicator, setCurrentIndicator] = useState({
    name: '',
    weight: 1.0,
    question: ''
  });
  
  const [currentCompetence, setCurrentCompetence] = useState({
    id: '',
    coefficient: 1.0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchQualities();
    fetchCompetences();
  }, []);

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

  const fetchQualities = async () => {
    try {
      const res = await api.get('/api/qualities/');
      setQualities(res.data);
    } catch (error) {
      console.error('Ошибка загрузки качеств:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetences = async () => {
    try {
      const res = await api.get('/api/competences/list/');
      setCompetences(res.data);
    } catch (error) {
      console.error('Ошибка загрузки компетенций:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Добавление индикатора
  const addIndicator = () => {
    if (!currentIndicator.name) {
      alert('Введите название индикатора');
      return;
    }
    if (!currentIndicator.question) {
      alert('Введите вопрос для индикатора');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      indicators: [...prev.indicators, { ...currentIndicator }]
    }));
    
    setCurrentIndicator({
      name: '',
      weight: 1.0,
      question: ''
    });
  };

  // Удаление индикатора
  const removeIndicator = (index) => {
    setFormData(prev => ({
      ...prev,
      indicators: prev.indicators.filter((_, i) => i !== index)
    }));
  };

  // Добавление компетенции
  const addCompetence = () => {
    if (!currentCompetence.id) {
      alert('Выберите компетенцию');
      return;
    }
    
    const competence = competences.find(c => c.id === parseInt(currentCompetence.id));
    if (!competence) return;
    
    if (formData.competences.some(c => c.id === competence.id)) {
      alert('Эта компетенция уже добавлена');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      competences: [...prev.competences, {
        id: competence.id,
        name: competence.name,
        coefficient: currentCompetence.coefficient
      }]
    }));
    
    setCurrentCompetence({ id: '', coefficient: 1.0 });
  };

  // Удаление компетенции
  const removeCompetence = (index) => {
    setFormData(prev => ({
      ...prev,
      competences: prev.competences.filter((_, i) => i !== index)
    }));
  };

  const handleCreateQuality = async () => {
    if (!formData.name) {
      alert('Введите название качества');
      return;
    }
    
    if (formData.indicators.length === 0) {
      alert('Добавьте хотя бы один индикатор');
      return;
    }
    
    try {
      await api.post('/api/qualities/create/', formData);
      alert('Качество успешно создано');
      setShowCreateModal(false);
      resetForm();
      fetchQualities();
    } catch (error) {
      console.error('Ошибка создания:', error);
      alert('Ошибка при создании качества');
    }
  };

  const handleEditQuality = async () => {
    if (!formData.name) {
      alert('Введите название качества');
      return;
    }
    
    try {
      await api.put(`/api/qualities/${selectedQuality.id}/update/`, formData);
      alert('Качество успешно обновлено');
      setShowEditModal(false);
      resetForm();
      fetchQualities();
    } catch (error) {
      console.error('Ошибка обновления:', error);
      alert('Ошибка при обновлении качества');
    }
  };

  const handleDeleteQuality = async (id, name) => {
    if (window.confirm(`Вы уверены, что хотите удалить качество "${name}"?`)) {
      try {
        await api.delete(`/api/qualities/${id}/delete/`);
        alert('Качество удалено');
        fetchQualities();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении');
      }
    }
  };

  const openEditModal = async (quality) => {
    try {
      const res = await api.get(`/api/qualities/${quality.id}/`);
      setSelectedQuality(res.data);
      setFormData({
        name: res.data.name,
        description: res.data.description || '',
        competences: res.data.competences || [],
        indicators: res.data.indicators || []
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Ошибка загрузки качества:', error);
      alert('Ошибка при загрузке данных');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      competences: [],
      indicators: []
    });
    setCurrentIndicator({ name: '', weight: 1.0, question: '' });
    setCurrentCompetence({ id: '', coefficient: 1.0 });
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="qualities-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="qualities-content">
        <div className="qualities-header">
          <h1>Качества</h1>
          <button 
            className="create-button"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            + Создать новое качество
          </button>
        </div>

        <div className="qualities-list">
          {qualities.length === 0 ? (
            <div className="empty-state">
              <p>Нет созданных качеств</p>
              <button onClick={() => setShowCreateModal(true)}>
                Создать первое качество
              </button>
            </div>
          ) : (
            qualities.map(quality => (
              <div key={quality.id} className="quality-card">
                <div className="quality-header">
                  <h3>{quality.name}</h3>
                  <div className="quality-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => openEditModal(quality)}
                    >
                      ✏️ Редактировать
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteQuality(quality.id, quality.name)}
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
                <p className="quality-description">{quality.description || 'Нет описания'}</p>
                <div className="quality-stats">
                  <span className="stat">📊 Индикаторов: {quality.indicators_count}</span>
                  <span className="stat">🔗 Компетенций: {quality.competences_count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* МОДАЛКА СОЗДАНИЯ КАЧЕСТВА */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Создание нового качества</h2>
            
            {/* Основная информация */}
            <div className="form-group">
              <label>Название качества *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Введите название качества"
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Введите описание качества"
              />
            </div>

            {/* Компетенции */}
            <div className="section">
              <h3>Компетенции</h3>
              <div className="competence-selector">
                <select
                  value={currentCompetence.id}
                  onChange={(e) => setCurrentCompetence({...currentCompetence, id: e.target.value})}
                >
                  <option value="">Выберите компетенцию</option>
                  {competences.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Коэффициент"
                  value={currentCompetence.coefficient}
                  onChange={(e) => setCurrentCompetence({...currentCompetence, coefficient: parseFloat(e.target.value)})}
                  step="0.1"
                  min="0"
                  max="10"
                  style={{ width: '100px' }}
                />
                <button className="add-btn" onClick={addCompetence}>+ Добавить</button>
              </div>
              
              <div className="competences-list">
                {formData.competences.map((comp, idx) => (
                  <div key={idx} className="competence-tag">
                    <span>{comp.name}</span>
                    <span className="coefficient">(вес: {comp.coefficient})</span>
                    <button className="remove-small" onClick={() => removeCompetence(idx)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Индикаторы */}
            <div className="section">
              <h3>Индикаторы</h3>
              <div className="indicator-form">
                <input
                  type="text"
                  placeholder="Название индикатора *"
                  value={currentIndicator.name}
                  onChange={(e) => setCurrentIndicator({...currentIndicator, name: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Вес"
                  value={currentIndicator.weight}
                  onChange={(e) => setCurrentIndicator({...currentIndicator, weight: parseFloat(e.target.value)})}
                  step="0.1"
                  min="0"
                  max="100"
                  style={{ width: '100px' }}
                />
                <textarea
                  placeholder="Вопрос для индикатора *"
                  value={currentIndicator.question}
                  onChange={(e) => setCurrentIndicator({...currentIndicator, question: e.target.value})}
                  rows="2"
                />
                <button className="add-btn" onClick={addIndicator}>+ Добавить индикатор</button>
              </div>
              
              <div className="indicators-list">
                {formData.indicators.map((ind, idx) => (
                  <div key={idx} className="indicator-item">
                    <div className="indicator-info">
                      <strong>{ind.name}</strong>
                      <span className="weight">Вес: {ind.weight}</span>
                    </div>
                    <div className="indicator-question">{ind.question}</div>
                    <button className="remove-small" onClick={() => removeIndicator(idx)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="save-button" onClick={handleCreateQuality}>
                Сохранить
              </button>
              <button className="cancel-button" onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Редактирование качества</h2>
            
            {/* Аналогичная форма, но с данными из selectedQuality */}
            <div className="form-group">
              <label>Название качества *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
              />
            </div>

            {/* Компетенции */}
            <div className="section">
              <h3>Компетенции</h3>
              <div className="competence-selector">
                <select
                  value={currentCompetence.id}
                  onChange={(e) => setCurrentCompetence({...currentCompetence, id: e.target.value})}
                >
                  <option value="">Выберите компетенцию</option>
                  {competences.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Коэффициент"
                  value={currentCompetence.coefficient}
                  onChange={(e) => setCurrentCompetence({...currentCompetence, coefficient: parseFloat(e.target.value)})}
                  step="0.1"
                />
                <button className="add-btn" onClick={addCompetence}>+ Добавить</button>
              </div>
              
              <div className="competences-list">
                {formData.competences.map((comp, idx) => (
                  <div key={idx} className="competence-tag">
                    <span>{comp.name}</span>
                    <span className="coefficient">(вес: {comp.coefficient})</span>
                    <button className="remove-small" onClick={() => removeCompetence(idx)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Индикаторы */}
            <div className="section">
              <h3>Индикаторы</h3>
              <div className="indicator-form">
                <input
                  type="text"
                  placeholder="Название индикатора"
                  value={currentIndicator.name}
                  onChange={(e) => setCurrentIndicator({...currentIndicator, name: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Вес"
                  value={currentIndicator.weight}
                  onChange={(e) => setCurrentIndicator({...currentIndicator, weight: parseFloat(e.target.value)})}
                />
                <textarea
                  placeholder="Вопрос для индикатора"
                  value={currentIndicator.question}
                  onChange={(e) => setCurrentIndicator({...currentIndicator, question: e.target.value})}
                  rows="2"
                />
                <button className="add-btn" onClick={addIndicator}>+ Добавить индикатор</button>
              </div>
              
              <div className="indicators-list">
                {formData.indicators.map((ind, idx) => (
                  <div key={idx} className="indicator-item">
                    <div className="indicator-info">
                      <strong>{ind.name}</strong>
                      <span className="weight">Вес: {ind.weight}</span>
                    </div>
                    <div className="indicator-question">{ind.question}</div>
                    <button className="remove-small" onClick={() => removeIndicator(idx)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="save-button" onClick={handleEditQuality}>
                Сохранить изменения
              </button>
              <button className="cancel-button" onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Qualities;