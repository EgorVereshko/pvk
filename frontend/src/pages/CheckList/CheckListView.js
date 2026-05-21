import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './CheckList.css';

const CheckListView = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedScores, setEditedScores] = useState([]);
  const [editedQualities, setEditedQualities] = useState([]);
  const [editedStudents, setEditedStudents] = useState([]);
  const [newCompetenceName, setNewCompetenceName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchChecklist();
  }, [id]);

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

  const fetchChecklist = async () => {
    try {
      const res = await api.get(`/api/checklist/${id}/`);
      setChecklist(res.data);
      setEditedScores(res.data.scores || []);
      setEditedQualities(res.data.qualities || []);
      setEditedStudents(res.data.students || []);
    } catch (error) {
      console.error('Ошибка загрузки чек-листа:', error);
      alert('Ошибка при загрузке чек-листа');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (qualityIndex, studentIndex, value) => {
    const newScores = [...editedScores];
    if (!newScores[qualityIndex]) {
      newScores[qualityIndex] = Array(5).fill(null);
    }
    newScores[qualityIndex][studentIndex] = (value !== null && value !== undefined && value !== '') ? parseInt(value, 10) : null;
    setEditedScores(newScores);
  };

  const handleAddCompetence = () => {
    if (!newCompetenceName.trim()) {
      alert('Введите название компетенции');
      return;
    }

    setEditedQualities(prev => [...prev, newCompetenceName.trim()]);
    setEditedScores(prev => [...prev, Array(5).fill(null)]);
    setNewCompetenceName('');
  };

  const handleRemoveCompetence = (index) => {
    if (index < 4) {
      alert('Нельзя удалить базовые компетенции');
      return;
    }

    const newQualities = editedQualities.filter((_, i) => i !== index);
    const newScores = editedScores.filter((_, i) => i !== index);

    setEditedQualities(newQualities);
    setEditedScores(newScores);
  };

  const handleSave = async () => {
    try {
      let allFilled = true;
      for (let q = 0; q < editedQualities.length; q++) {
        for (let s = 0; s < 5; s++) {
          if (editedScores[q]?.[s] === null || editedScores[q]?.[s] === undefined) {
            allFilled = false;
            break;
          }
        }
        if (!allFilled) break;
      }

      if (!allFilled) {
        alert('Заполните все оценки для всех студентов перед сохранением');
        return;
      }

      const studentsIds = checklist.students.map(s => s.id).filter(id => id !== null);
      
      await api.put(`/api/checklist/${id}/update/`, {
        scores: editedScores,
        students_ids: studentsIds,
        qualities: editedQualities
      });
      alert('Чек-лист успешно обновлен');
      setEditMode(false);
      fetchChecklist();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот чек-лист?')) {
      try {
        await api.delete(`/api/checklist/${id}/delete/`);
        alert('Чек-лист удален');
        navigate('/events/tutor');
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const displayStudents = editMode ? editedStudents : (checklist?.students || []);
  const displayQualities = editMode ? editedQualities : (checklist?.qualities || []);
  const displayScores = editMode ? editedScores : (checklist?.scores || []);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!checklist) return <div className="error">Чек-лист не найден</div>;

  return (
    <div className="checklist-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="checklist-content">
        <div className="checklist-card">
          <div className="checklist-header">
            <h1>{checklist.event.name}</h1>
            <div className="header-actions">
              {!editMode ? (
                <>
                  <button 
                    className="edit-button"
                    onClick={() => setEditMode(true)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="delete-button"
                    onClick={handleDelete}
                  >
                    Удалить
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="save-button"
                    onClick={handleSave}
                  >
                    Сохранить
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => {
                      setEditMode(false);
                      setEditedScores(checklist.scores);
                      setEditedQualities(checklist.qualities);
                      setEditedStudents(checklist.students);
                    }}
                  >
                    Отмена
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="event-info">
            <p><strong>Дата:</strong> {new Date(checklist.event.datetime).toLocaleDateString('ru-RU')}</p>
            <p><strong>Команда:</strong> {checklist.event.team_name}</p>
          </div>

          <div className="checklist-table-wrapper">
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>Студент / Качество</th>
                  {displayQualities.map((quality, qIndex) => (
                    <th key={qIndex}>
                      <div className="quality-with-remove">
                        {quality}
                        {editMode && qIndex >= 4 && (
                          <button 
                            className="remove-competence"
                            onClick={() => handleRemoveCompetence(qIndex)}
                            title="Удалить компетенцию"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map(sIndex => {
                  const student = displayStudents[sIndex];
                  return (
                    <tr key={sIndex}>
                      <td className="student-cell">
                        {student ? student.name : `Студент ${sIndex + 1}`}
                       </td>
                      {displayQualities.map((_, qIndex) => (
                        <td key={qIndex}>
                          {editMode ? (
                            <select
                              value={displayScores[qIndex]?.[sIndex] !== null && displayScores[qIndex]?.[sIndex] !== undefined 
                                ? displayScores[qIndex][sIndex] 
                                : ''}
                              onChange={(e) => handleScoreChange(qIndex, sIndex, e.target.value)}
                            >
                              <option value="">-</option>
                              <option value="-1">-1</option>
                              <option value="0">0</option>
                              <option value="1">1</option>
                            </select>
                          ) : (
                            <span className="score-value">
                              {displayScores[qIndex]?.[sIndex] !== null && displayScores[qIndex]?.[sIndex] !== undefined
                                ? displayScores[qIndex][sIndex]
                                : '-'}
                            </span>
                          )}
                         </td>
                      ))}
                     </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Блок добавления новой компетенции в режиме редактирования */}
          {editMode && (
            <div className="add-competence-section">
              <input
                type="text"
                placeholder="Название новой компетенции"
                value={newCompetenceName}
                onChange={(e) => setNewCompetenceName(e.target.value)}
                className="competence-input"
              />
              <button 
                className="add-competence-button"
                onClick={handleAddCompetence}
              >
                + Добавить компетенцию
              </button>
            </div>
          )}

          {checklist.evaluated_student && (
            <div className="evaluated-student">
              <strong>Оцениваемый студент:</strong> {checklist.evaluated_student}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckListView;