import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import Header from '../../components/Header/Header';
import './CheckList.scss';

const CheckListView = () => {
  const { id } = useParams();
  const { user, logout, isTutor, isOrganizer } = useAuth();
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [scores, setScores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTutor() && !isOrganizer()) {
      alert('Доступ запрещен');
      navigate('/events/tutor');
    }
    loadChecklist();
  }, [id]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      console.log('Загрузка чек-листа с ID:', id);
      
      // 1. Получаем форму чек-листа через /api/forms/tutor/
      const formsRes = await api.get('/api/forms/tutor/');
      const form = formsRes.data.find(f => f.id === parseInt(id) && f.type === 'Чек-лист');
      console.log('Найденная форма:', form);
      
      if (!form) {
        alert('Чек-лист не найден');
        navigate('/events/tutor');
        return;
      }
      
      // 2. Получаем название команды
      const teamName = form.teams_names?.[0] || 'Без команды';
      
      // 3. Получаем студентов из команды
      let members = [];
      if (teamName !== 'Без команды') {
        const teamsRes = await api.get('/api/teams/');
        const team = teamsRes.data.find(t => t.name === teamName);
        if (team) {
          const membersRes = await api.get(`/api/teams/${team.id}/members/`);
          members = membersRes.data;
          console.log('Студенты команды:', members);
        }
      }
      setTeamMembers(members);
      
      // 4. Получаем индикаторы из шаблона или из сохраненных оценок
      let indicatorsList = [];
      
      if (form.template && form.template.id) {
        const templateRes = await api.get(`/api/templates/${form.template.id}/`);
        if (templateRes.data && templateRes.data.indicators) {
          indicatorsList = templateRes.data.indicators.map(ind => ({
            id: ind.id,
            name: ind.name
          }));
        }
      }
      
      if (indicatorsList.length === 0 && members.length > 0) {
        const firstStudent = members[0];
        const scoresRes = await api.get(`/api/indicator_scores/${id}/${firstStudent.id}/`);
        if (scoresRes.data && scoresRes.data.length > 0) {
          const uniqueIndicators = new Map();
          scoresRes.data.forEach(score => {
            if (!uniqueIndicators.has(score.indicator_id)) {
              uniqueIndicators.set(score.indicator_id, {
                id: score.indicator_id,
                name: score.indicator_name
              });
            }
          });
          indicatorsList = Array.from(uniqueIndicators.values());
        }
      }
      
      setIndicators(indicatorsList);
      
      // 5. Получаем оценки индикаторов для каждого студента
      const scoresPromises = members.map(async (member) => {
        try {
          const scoresRes = await api.get(`/api/indicator_scores/${id}/${member.id}/`);
          console.log(`Оценки для студента ${member.name}:`, scoresRes.data);
          
          const scoreMap = new Map();
          scoresRes.data.forEach(score => {
            scoreMap.set(score.indicator_id, score.score);
          });
          
          return { studentId: member.id, scoreMap };
        } catch (err) {
          console.error(`Ошибка загрузки оценок для студента ${member.id}:`, err);
          return { studentId: member.id, scoreMap: new Map() };
        }
      });
      
      const allScores = await Promise.all(scoresPromises);
      
      // 6. Формируем таблицу оценок: [индикатор][студент] = оценка
      const scoresTable = indicatorsList.map((indicator, idx) => {
        return members.map(member => {
          const studentScores = allScores.find(s => s.studentId === member.id);
          if (studentScores && studentScores.scoreMap) {
            const score = studentScores.scoreMap.get(indicator.id);
            return score !== undefined ? score : null;
          }
          return null;
        });
      });
      setScores(scoresTable);
      
      setChecklist({
        id: form.id,
        name: form.name,
        date: form.end_datetime,
        team_name: teamName,
        indicators: indicatorsList,
        status: form.status
      });
      
    } catch (error) {
      console.error('Ошибка загрузки чек-листа:', error);
      alert('Ошибка при загрузке чек-листа: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return '—';
    if (score === -1) return '-1';
    if (score === 0) return '0';
    if (score === 1) return '1';
    return score;
  };

  const getScoreClass = (score) => {
    if (score === null || score === undefined) return 'score-none';
    if (score === -1) return 'score-negative';
    if (score === 0) return 'score-neutral';
    if (score === 1) return 'score-positive';
    return '';
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!checklist) return <div className="error">Чек-лист не найден</div>;

  return (
    <div className="checklist-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="checklist-content">
        <div className="checklist-card">
          <div className="checklist-header">
            <h1>{checklist.name}</h1>
            <button className="back-button" onClick={() => navigate('/events/tutor')}>
              ← Назад
            </button>
          </div>

          <div className="event-info">
            <p><strong>Дата:</strong> {new Date(checklist.date).toLocaleDateString('ru-RU')}</p>
            <p><strong>Команда:</strong> {checklist.team_name}</p>
            <p><strong>Статус:</strong> {checklist.status}</p>
            <p><strong>Студентов в команде:</strong> {teamMembers.length}</p>
            <p><strong>Индикаторов для оценки:</strong> {indicators.length}</p>
          </div>

          {teamMembers.length === 0 ? (
            <div className="empty-state">
              <p>Нет студентов в этой команде</p>
            </div>
          ) : indicators.length === 0 ? (
            <div className="empty-state">
              <p>Нет индикаторов для этого чек-листа</p>
            </div>
          ) : (
            <div className="checklist-table-wrapper">
              <table className="checklist-table">
                <thead>
                  <tr>
                    <th className="student-col">Студент</th>
                    {indicators.map((indicator, idx) => (
                      <th key={idx} className="indicator-col">
                        <div className="indicator-header">
                          <span className="indicator-header-name">{indicator.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, sIdx) => (
                    <tr key={member.id}>
                      <td className="student-cell">
                        <strong>{member.name}</strong>
                      </td>
                      {indicators.map((_, iIdx) => (
                        <td key={iIdx} className="score-cell">
                          <span className={`score-value ${getScoreClass(scores[iIdx]?.[sIdx])}`}>
                            {formatScore(scores[iIdx]?.[sIdx])}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckListView;