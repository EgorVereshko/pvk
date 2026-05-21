import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './Poll.css';

const PollCreate = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
    team_ids: [],
    start_date: '',
    end_date: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchTemplates();
    fetchTeams();
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

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/api/poll-templates/');
      setTemplates(res.data);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamSelect = (teamId) => {
    setFormData(prev => {
      const newTeamIds = prev.team_ids.includes(teamId)
        ? prev.team_ids.filter(id => id !== teamId)
        : [...prev.team_ids, teamId];
      return { ...prev, team_ids: newTeamIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Введите название опросника');
      return;
    }
    if (!formData.start_date) {
      alert('Установите дату начала');
      return;
    }
    if (!formData.end_date) {
      alert('Установите дату окончания');
      return;
    }
    if (formData.team_ids.length === 0) {
      alert('Выберите хотя бы одну команду');
      return;
    }
    
    setSaving(true);
    
    try {
      const formDataToSend = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };
      
      await api.post('/api/polls/create/', formDataToSend);
      alert('Опросник успешно создан!');
      navigate('/polls');
    } catch (error) {
      console.error('Ошибка создания опросника:', error);
      alert('Ошибка при создании опросника: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="poll-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="poll-content">
        <div className="poll-card">
          <div className="poll-header">
            <button className="back-btn" onClick={() => navigate('/polls')}>
              ← Назад к списку
            </button>
            <h1>Создание опросника</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="poll-form">
            <div className="form-group">
              <label>Название опросника *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Введите название опросника"
                required
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Введите описание опросника"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Шаблон опросника</label>
              <select
                name="template_id"
                value={formData.template_id}
                onChange={handleFormChange}
              >
                <option value="">Без шаблона</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Команды для опроса *</label>
              <p className="hint">Выберите команды, участники которых будут проходить опрос</p>
              <div className="teams-select">
                {teams.map(team => (
                  <label key={team.id} className="team-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.team_ids.includes(team.id)}
                      onChange={() => handleTeamSelect(team.id)}
                    />
                    <span>{team.name}</span>
                  </label>
                ))}
              </div>
              {formData.team_ids.length === 0 && (
                <p className="error-hint">Выберите хотя бы одну команду</p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Дата начала *</label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Дата окончания *</label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate('/polls')}>
                Отмена
              </button>
              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Создание...' : 'Создать опросник'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PollCreate;