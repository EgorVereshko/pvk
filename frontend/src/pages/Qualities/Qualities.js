import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Qualities.scss';

const Qualities = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qualities, setQualities] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    indicators: []
  });

  const [currentIndicator, setCurrentIndicator] = useState({
    name: '',
    weight: 1.0,
    question: '',
    answer_positive: '',
    answer_neutral: '',
    answer_negative: ''
  });

  const navigate = useNavigate();

  const fetchQualities = async () => {
    try {
      const response = await api.get('/api/qualities/');
      setQualities(response.data);
    } catch (error) {
      console.error('Ошибка загрузки качеств:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchQualities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addIndicator = () => {
    if (!currentIndicator.name) {
      alert('Введите название индикатора');
      return;
    }

    setFormData(prev => ({
      ...prev,
      indicators: [...prev.indicators, { ...currentIndicator }]
    }));

    setCurrentIndicator({
      name: '',
      weight: 1.0,
      question: '',
      answer_positive: '',
      answer_neutral: '',
      answer_negative: ''
    });
  };

  const removeIndicator = (index) => {
    setFormData(prev => ({
      ...prev,
      indicators: prev.indicators.filter((_, i) => i !== index)
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
      await api.post('/api/qualities/create/', {
        name: formData.name,
        description: formData.description,
        indicators: formData.indicators.map(ind => ({
          name: ind.name,
          description: '',
          weight: ind.weight,
          question: ind.question,
          answer_positive: ind.answer_positive,
          answer_neutral: ind.answer_neutral,
          answer_negative: ind.answer_negative
        }))
      });

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
      await api.put(`/api/qualities/${selectedQuality.id}/update/`, {
        name: formData.name,
        description: formData.description,
        indicators: formData.indicators.map(ind => ({
          id: ind.id,
          name: ind.name,
          description: '',
          weight: ind.weight
        }))
      });

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
    if (!window.confirm(`Вы уверены, что хотите удалить качество "${name}"?`)) return;

    try {
      await api.delete(`/api/qualities/${id}/delete/`);
      alert('Качество удалено');
      fetchQualities();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении качества');
    }
  };

  const openEditModal = (quality) => {
    setSelectedQuality(quality);
    setFormData({
      name: quality.name,
      description: quality.description || '',
      indicators: quality.indicators || []
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      indicators: []
    });
    setCurrentIndicator({
      name: '',
      weight: 1.0,
      question: '',
      answer_positive: '',
      answer_neutral: '',
      answer_negative: ''
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
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
                  <div className="quality-actions-wrap">
                    <button
                      className="dots-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === quality.id ? null : quality.id);
                      }}
                    >
                      ⋮
                    </button>

                    {openMenuId === quality.id && (
                      <div className="quality-actions-popup" ref={menuRef}>
                        <button
                          className="popup-action-btn"
                          onClick={() => openEditModal(quality)}
                        >
                          Редактировать
                        </button>
                        <button
                          className="popup-action-btn danger"
                          onClick={() => handleDeleteQuality(quality.id, quality.name)}
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="quality-description">{quality.description || 'Нет описания'}</p>
                <div className="quality-stats">
                  <span className="stat">📊 Индикаторов: {quality.indicators?.length || 0}</span>
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

            <div className="section">
              <h3>Индикаторы</h3>
              <div className="indicator-form">
                <input
                  type="text"
                  placeholder="Название индикатора *"
                  value={currentIndicator.name}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Вес (0-1)"
                  value={currentIndicator.weight}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, weight: parseFloat(e.target.value) })}
                  step="0.1"
                  min="0"
                  max="1"
                  style={{ width: '100px' }}
                />
                <textarea
                  placeholder="Вопрос для индикатора *"
                  value={currentIndicator.question}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, question: e.target.value })}
                  rows="2"
                />
                <textarea
                  placeholder="Ответ: проявлено полностью"
                  value={currentIndicator.answer_positive}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, answer_positive: e.target.value })}
                  rows="1"
                />
                <textarea
                  placeholder="Ответ: нейтрально / частично"
                  value={currentIndicator.answer_neutral}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, answer_neutral: e.target.value })}
                  rows="1"
                />
                <textarea
                  placeholder="Ответ: не проявлено"
                  value={currentIndicator.answer_negative}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, answer_negative: e.target.value })}
                  rows="1"
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
              <button
                className="cancel-button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ КАЧЕСТВА */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Редактирование качества</h2>

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

            <div className="section">
              <h3>Индикаторы</h3>
              <div className="indicator-form">
                <input
                  type="text"
                  placeholder="Название индикатора"
                  value={currentIndicator.name}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Вес"
                  value={currentIndicator.weight}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, weight: parseFloat(e.target.value) })}
                  step="0.1"
                  min="0"
                  max="1"
                  style={{ width: '100px' }}
                />
                <textarea
                  placeholder="Вопрос для индикатора"
                  value={currentIndicator.question}
                  onChange={(e) => setCurrentIndicator({ ...currentIndicator, question: e.target.value })}
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
              <button
                className="cancel-button"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
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