import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Qualities.css';

const KEY_QUALITIES = 'app_qualities';
const KEY_COMPETENCES = 'app_competences';

function getQualities() {
  const item = localStorage.getItem(KEY_QUALITIES);
  return item ? JSON.parse(item) : [];
}

function setQualities(items) {
  localStorage.setItem(KEY_QUALITIES, JSON.stringify(items));
}

function addQuality(quality) {
  const items = getQualities();
  const maxId = items.length > 0 ? Math.max(...items.map(q => q.id)) : 0;
  const item = { id: maxId + 1, ...quality };
  items.push(item);
  setQualities(items);
  return item;
}

function updateQuality(id, data) {
  const items = getQualities().map(q => (q.id === id ? { ...q, ...data } : q));
  setQualities(items);
}

function deleteQuality(id) {
  const items = getQualities().filter(q => q.id !== id);
  setQualities(items);
}

const Qualities = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qualities, setQualitiesState] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

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
    loadLocalQualities();
    fetchCompetences();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

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

  const loadLocalQualities = () => {
    const items = getQualities();
    setQualitiesState(items);
    setLoading(false);
  };

  const fetchCompetences = async () => {
    try {
      const res = await api.get('/api/competences/list/');
      setCompetences(res.data);
    } catch (error) {
      console.error('Ошибка загрузки компетенций:', error);
      setCompetences([]);
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

  const removeIndicator = (index) => {
    setFormData(prev => ({
      ...prev,
      indicators: prev.indicators.filter((_, i) => i !== index)
    }));
  };

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

  const removeCompetence = (index) => {
    setFormData(prev => ({
      ...prev,
      competences: prev.competences.filter((_, i) => i !== index)
    }));
  };

  const handleCreateQuality = () => {
    if (!formData.name) {
      alert('Введите название качества');
      return;
    }
    if (formData.indicators.length === 0) {
      alert('Добавьте хотя бы один индикатор');
      return;
    }

    addQuality({
      name: formData.name,
      description: formData.description || '',
      competences: formData.competences,
      indicators: formData.indicators
    });

    alert('Качество успешно создано');
    setShowCreateModal(false);
    resetForm();
    setQualitiesState(getQualities());
  };

  const handleEditQuality = () => {
    if (!formData.name) {
      alert('Введите название качества');
      return;
    }

    updateQuality(selectedQuality.id, {
      name: formData.name,
      description: formData.description || '',
      competences: formData.competences,
      indicators: formData.indicators
    });

    alert('Качество успешно обновлено');
    setShowEditModal(false);
    resetForm();
    setQualitiesState(getQualities());
  };

  const handleDeleteQuality = (id, name) => {
    if (!window.confirm(`Вы уверены, что хотите удалить качество "${name}"?`)) return;

    deleteQuality(id);
    alert('Качество удалено');
    setQualitiesState(getQualities());
  };

  const openEditModal = (quality) => {
    setSelectedQuality(quality);
    setFormData({
      name: quality.name,
      description: quality.description || '',
      competences: quality.competences || [],
      indicators: quality.indicators || []
    });
    setShowEditModal(true);
  };

  const openMenu = (e, quality) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.right + window.scrollX - 170
    });
    setOpenMenuId(quality.id);
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
                  <div className="quality-actions-wrap" ref={menuRef}>
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
                      <div className="quality-actions-popup">
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
                  <span className="stat">📊 Индикаторов: {quality.indicators.length || 0}</span>
                  {/* <span className="stat">🔗 Компетенций: {quality.competences.length || 0}</span> */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

            {/* <div className="section">
              <h3>Компетенции</h3>
              <div className="competence-selector">
                <select
                  value={currentCompetence.id}
                  onChange={(e) => setCurrentCompetence({ ...currentCompetence, id: e.target.value })}
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
                  onChange={(e) => setCurrentCompetence({ ...currentCompetence, coefficient: parseFloat(e.target.value) })}
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
            </div> */}

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
                  placeholder="Вес"
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
              <h3>Компетенции</h3>
              <div className="competence-selector">
                <select
                  value={currentCompetence.id}
                  onChange={(e) => setCurrentCompetence({ ...currentCompetence, id: e.target.value })}
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
                  onChange={(e) => setCurrentCompetence({ ...currentCompetence, coefficient: parseFloat(e.target.value) })}
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