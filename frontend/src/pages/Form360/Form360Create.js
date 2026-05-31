import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Form360.scss';

const Form360Create = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const defaultQualities = [
    'Вовлеченность',
    'Работа в команде',
    'Обучаемость',
    'Организованность'
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    team_id: '',
    deadline: '',
    qualities: [...defaultQualities]
  });
  
  const [availableQualities, setAvailableQualities] = useState([
    'Вовлеченность',
    'Работа в команде',
    'Обучаемость',
    'Организованность'
  ]);
  
  const [newQuality, setNewQuality] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchTeams();
    fetchQualities();
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

  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams/');
      setTeams(res.data);
    } catch (error) {
      console.error('Ошибка загрузки команд:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQualities = async () => {
    try {
      const res = await api.get('/api/qualities/');
      if (res.data && res.data.length > 0) {
        const qualityNames = res.data.map(q => q.name);
        setAvailableQualities(qualityNames);
      }
    } catch (error) {
      console.log('Используем стандартные качества');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQualityToggle = (quality) => {
    setFormData(prev => {
      if (prev.qualities.includes(quality)) {
        return { ...prev, qualities: prev.qualities.filter(q => q !== quality) };
      } else {
        return { ...prev, qualities: [...prev.qualities, quality] };
      }
    });
  };

  const addNewQuality = () => {
    if (newQuality.trim() && !availableQualities.includes(newQuality.trim())) {
      setAvailableQualities(prev => [...prev, newQuality.trim()]);
      setFormData(prev => ({
        ...prev,
        qualities: [...prev.qualities, newQuality.trim()]
      }));
      setNewQuality('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Введите название формы');
      return;
    }
    if (!formData.team_id) {
      alert('Выберите команду');
      return;
    }
    if (!formData.deadline) {
      alert('Установите срок дедлайна');
      return;
    }
    if (formData.qualities.length === 0) {
      alert('Выберите хотя бы одно качество для оценки');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await api.post('/api/forms/create/', {
        name: formData.name,
        type: 'Оценка 360',
        teams_id: [parseInt(formData.team_id)],
        start_datetime: new Date().toISOString(),
        end_datetime: new Date(formData.deadline).toISOString()
      });
      
      console.log('Форма сохранена в БД:', response.data);
      
      alert('Форма 360 успешно создана!');
      
      navigate('/form360');
      
    } catch (error) {
      console.error('Ошибка создания формы:', error);
      alert('Ошибка при создании формы: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="form360-container">
      <Header onLogout={() => { localStorage.clear(); navigate('/'); }} user={user} />
      
      <div className="form360-content">
        <div className="form360-card">
          <h1>Создание формы 360</h1>
          <p className="form360-description">
            Создайте форму для оценки участников команды. Выберите команду, установите дедлайн и отметьте качества, 
            по которым будет проводиться оценка.
          </p>
          
          <form onSubmit={handleSubmit} className="form360-form">
            <div className="form-group">
              <label>Название формы *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Например: Оценка за 1 квартал 2026"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Команда *</label>
              <select
                name="team_id"
                value={formData.team_id}
                onChange={handleFormChange}
                required
              >
                <option value="">Выберите команду</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Срок дедлайна *</label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleFormChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Качества для оценки</label>
              <p className="hint">Выберите качества, по которым будет проводиться оценка</p>
              
              <div className="qualities-grid">
                {availableQualities.map(quality => (
                  <label key={quality} className="quality-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.qualities.includes(quality)}
                      onChange={() => handleQualityToggle(quality)}
                    />
                    <span>{quality}</span>
                  </label>
                ))}
              </div>
              
              <div className="add-quality-row">
                <input
                  type="text"
                  placeholder="Новое качество"
                  value={newQuality}
                  onChange={(e) => setNewQuality(e.target.value)}
                  className="quality-input"
                />
                <button type="button" className="add-quality-btn" onClick={addNewQuality}>
                  + Добавить
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate('/form360')}>
                Отмена
              </button>
              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Создание...' : 'Создать форму'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Form360Create;