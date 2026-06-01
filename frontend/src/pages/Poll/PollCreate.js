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
    type: 'Опросник',
    template_id: '',
    teams_id: [],
    start_datetime: '',
    end_datetime: ''
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
      const res = await api.get('/api/templates/');
      setTemplates(res.data);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams/');
      const teamsWithCount = await Promise.all(
        res.data.map(async (team) => {
          try {
            const membersRes = await api.get(`/api/teams/${team.id}/member-count/`);
            return {
              ...team,
              member_count: membersRes.data?.count || 0
            };
          } catch (err) {
            console.error(`Ошибка загрузки участников команды ${team.id}:`, err);
            return {
              ...team,
              member_count: 0
            };
          }
        })
      );
      setTeams(teamsWithCount);
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
      const newTeamIds = prev.teams_id.includes(teamId)
        ? prev.teams_id.filter(id => id !== teamId)
        : [...prev.teams_id, teamId];
      return { ...prev, teams_id: newTeamIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Введите название опросника');
      return;
    }
    if (!formData.start_datetime) {
      alert('Установите дату начала');
      return;
    }
    if (!formData.end_datetime) {
      alert('Установите дату окончания');
      return;
    }
    if (formData.teams_id.length === 0) {
      alert('Выберите хотя бы одну команду');
      return;
    }
    
    setSaving(true);
    
    try {
      await api.post('/api/forms/create/', {
        name: formData.name,
        type: 'Опросник',
        template_id: formData.template_id || null,
        teams_id: formData.teams_id,
        start_datetime: new Date(formData.start_datetime).toISOString(),
        end_datetime: new Date(formData.end_datetime).toISOString()
      });
      
      alert('Опросник успешно создан!');
      navigate('/polls');
    } catch (error) {
      console.error('Ошибка создания опросника:', error);
      alert('Ошибка при создании опросника');
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
              <p className="hint">Шаблон определяет набор индикаторов для оценки</p>
            </div>

            <div className="form-group">
              <label>Команды для опроса *</label>
              <p className="hint">Выберите команды, участники которых будут проходить опрос</p>
              <div className="teams-grid">
                {teams.map(team => (
                  <label key={team.id} className="team-card">
                    <input
                      type="checkbox"
                      checked={formData.teams_id.includes(team.id)}
                      onChange={() => handleTeamSelect(team.id)}
                    />
                    <div className="team-card-content">
                      <div className="team-card-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div className="team-card-info">
                        <span className="team-card-name">{team.name}</span>
                        <span className="team-card-count">Участники: {team.member_count || '—'}</span>
                      </div>
                      <div className="team-card-check">
                        <svg className={`check-icon ${formData.teams_id.includes(team.id) ? 'checked' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {formData.teams_id.length === 0 && (
                <p className="error-hint">Выберите хотя бы одну команду</p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Дата начала *</label>
                <input
                  type="datetime-local"
                  name="start_datetime"
                  value={formData.start_datetime}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Дата окончания *</label>
                <input
                  type="datetime-local"
                  name="end_datetime"
                  value={formData.end_datetime}
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