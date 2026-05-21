import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import './CheckList.css';

const CheckList = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    date: '',
    team: '',
    eventName: '',
    template: ''
  });
  
  const [tableData, setTableData] = useState({
    students: ['', '', '', '', ''],
    studentNames: ['', '', '', '', ''],
    qualities: ['Обучаемость', 'Организованность', 'Работа в команде', 'Вовлеченность'],
    scores: []
  });
  
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newCompetenceName, setNewCompetenceName] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchTeams();
    fetchTemplates();
    fetchStudents();
  }, []);

  useEffect(() => {
    const newScores = tableData.qualities.map(() => Array(5).fill(null));
    setTableData(prev => ({ ...prev, scores: newScores }));
  }, [tableData.qualities.length]);

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

  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/students/');
      setStudents(res.data);
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    setFormData(prev => ({ ...prev, template: templateId }));
    
    if (templateId) {
      const selectedTemplate = templates.find(t => t.id === parseInt(templateId));
      if (selectedTemplate && selectedTemplate.indicators) {
        const templateQualities = selectedTemplate.competences || tableData.qualities;
        const newScores = templateQualities.map((quality, index) => {
          if (index < selectedTemplate.indicators.length) {
            const value = parseInt(selectedTemplate.indicators[index].name) || 0;
            return Array(5).fill(value);
          }
          return Array(5).fill(0);
        });
        
        setTableData(prev => ({
          ...prev,
          qualities: templateQualities,
          scores: newScores
        }));
      }
    }
  };

  const handleNext = () => {
    if (!formData.date || !formData.eventName || !formData.team) {
      alert('Заполните дату, название мероприятия и выберите команду');
      return;
    }
    setStep(2);
  };

  const handleStudentSelect = (index, studentId) => {
    const newStudents = [...tableData.students];
    const newStudentNames = [...tableData.studentNames];
    
    const selectedStudent = students.find(s => s.id === parseInt(studentId));
    
    newStudents[index] = studentId;
    newStudentNames[index] = selectedStudent ? selectedStudent.short_name : '';
    
    setTableData(prev => ({
      ...prev,
      students: newStudents,
      studentNames: newStudentNames
    }));
  };

  const handleScoreChange = (qualityIndex, studentIndex, value) => {
    const newScores = [...tableData.scores];
    if (!newScores[qualityIndex]) {
      newScores[qualityIndex] = Array(5).fill(null);
    }
    newScores[qualityIndex][studentIndex] = (value !== null && value !== undefined && value !== '') ? parseInt(value, 10) : null;
    setTableData(prev => ({ ...prev, scores: newScores }));
  };

  const handleAddCompetence = () => {
    if (!newCompetenceName.trim()) {
      alert('Введите название компетенции');
      return;
    }

    setTableData(prev => ({
      ...prev,
      qualities: [...prev.qualities, newCompetenceName.trim()],
      scores: [...prev.scores, Array(5).fill(null)]
    }));

    setNewCompetenceName('');
  };

  const handleRemoveCompetence = (index) => {
    if (index < 4) {
      alert('Нельзя удалить базовые компетенции');
      return;
    }

    const newQualities = tableData.qualities.filter((_, i) => i !== index);
    const newScores = tableData.scores.filter((_, i) => i !== index);

    setTableData(prev => ({
      ...prev,
      qualities: newQualities,
      scores: newScores
    }));
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName) {
      alert('Введите название шаблона');
      return;
    }

    try {
      let allFilled = true;
      for (let q = 0; q < tableData.qualities.length; q++) {
        for (let s = 0; s < 5; s++) {
          if (tableData.scores[q]?.[s] === null || tableData.scores[q]?.[s] === undefined) {
            allFilled = false;
            break;
          }
        }
        if (!allFilled) break;
      }

      if (!allFilled) {
        alert('Заполните все оценки для всех студентов перед сохранением шаблона');
        return;
      }

      const indicators = [];
      
      for (let q = 0; q < tableData.qualities.length; q++) {
        const values = tableData.scores[q] || [];
        const avgValue = values.length > 0 
          ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          : 0;
        
        indicators.push({
          name: avgValue.toString(),
          description: tableData.qualities[q]
        });
      }
      
      if (indicators.length >= 4) {
        const allValues = [];
        for (let q = 0; q < tableData.qualities.length; q++) {
          allValues.push(...(tableData.scores[q] || []));
        }
        const totalAvg = allValues.length > 0 
          ? Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length)
          : 0;
        
        while (indicators.length < 5) {
          indicators.push({
            name: totalAvg.toString(),
            description: 'Общая оценка'
          });
        }
      }

      await api.post('/api/templates/save/', {
        name: newTemplateName,
        indicators: indicators.slice(0, 5),
        competences: tableData.qualities
      });

      alert('Шаблон успешно сохранен');
      setShowSaveTemplate(false);
      setNewTemplateName('');
      fetchTemplates();
      
    } catch (error) {
      console.error('Ошибка сохранения шаблона:', error);
      alert('Ошибка при сохранении шаблона');
    }
  };

  const handleSaveChecklist = async () => {
    try {
      if (!formData.team || !formData.date || !formData.eventName) {
        alert('Для сохранения чек-листа необходимо указать команду, дату и название мероприятия');
        return;
      }

      const allStudentsSelected = tableData.students.every(id => id && id !== '');
      if (!allStudentsSelected) {
        alert('Выберите всех 5 студентов для оценки');
        return;
      }

      let allFilled = true;
      for (let q = 0; q < tableData.qualities.length; q++) {
        for (let s = 0; s < 5; s++) {
          if (tableData.scores[q]?.[s] === null || tableData.scores[q]?.[s] === undefined) {
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

      const eventResponse = await api.post('/api/events/create/', {
        team_id: formData.team,
        datetime: formData.date,
        name: formData.eventName
      });
      
      const checklistResponse = await api.post('/api/checklist/save/', {
        event_id: eventResponse.data.id,
        students_ids: tableData.students,
        scores: tableData.scores,
        qualities: tableData.qualities
      });

      alert('Чек-лист успешно сохранен');
      navigate('/events/tutor');
      
    } catch (error) {
      console.error('Ошибка сохранения чек-листа:', error);
      alert('Ошибка при сохранении чек-листа: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="checklist-container">
      <Header onLogout={handleLogout} user={user} />
      
      <div className="checklist-content">
        <div className="checklist-card">
          <h1>Создание чек-листа</h1>
          
          {step === 1 ? (
            <div className="form-step">
              <div className="form-group">
                <label>Дата <span className="required">*</span>:</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Команда <span className="required">*</span>:</label>
                <select
                  name="team"
                  value={formData.team}
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
                <label>Название мероприятия <span className="required">*</span>:</label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleFormChange}
                  placeholder="Введите название"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Шаблон чек-листа:</label>
                <select
                  name="template"
                  value={formData.template}
                  onChange={handleTemplateSelect}
                >
                  <option value="">Выберите шаблон</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button className="next-button" onClick={handleNext}>
                Далее
              </button>
            </div>
          ) : (
            <div className="table-step">
              <h2>Заполните оценки</h2>
              
              <div className="checklist-table-wrapper">
                  <table className="checklist-table">
                    <thead>
                      <tr>
                        <th>Студент / Качество</th>
                        {tableData.qualities.map((quality, qIndex) => (
                          <th key={qIndex}>
                            <div className="quality-with-remove">
                              {quality}
                              {qIndex >= 4 && (
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
                      {[0, 1, 2, 3, 4].map(sIndex => (
                        <tr key={sIndex}>
                          <td className="student-cell">
                            <select
                              value={tableData.students[sIndex] || ''}
                              onChange={(e) => handleStudentSelect(sIndex, e.target.value)}
                              className="student-select"
                            >
                              <option value="">Выберите студента {sIndex + 1}</option>
                              {students.map(student => (
                                <option key={student.id} value={student.id}>
                                  {student.short_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          {tableData.qualities.map((_, qIndex) => (
                            <td key={qIndex}>
                              <select
                                value={tableData.scores[qIndex]?.[sIndex] !== null && tableData.scores[qIndex]?.[sIndex] !== undefined 
                                  ? tableData.scores[qIndex]?.[sIndex] 
                                  : ''}
                                onChange={(e) => handleScoreChange(qIndex, sIndex, e.target.value)}
                                disabled={!tableData.students[sIndex]}
                              >
                                <option value="">-</option>
                                <option value="-1">-1</option>
                                <option value="0">0</option>
                                <option value="1">1</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              {/* Блок добавления новой компетенции */}
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
              
              <div className="table-actions">
                <button 
                  className="template-button"
                  onClick={() => setShowSaveTemplate(true)}
                >
                  Сохранить как шаблон
                </button>
                <button 
                  className="save-button"
                  onClick={handleSaveChecklist}
                >
                  Сохранить чек-лист
                </button>
                <button 
                  className="back-button"
                  onClick={() => setStep(1)}
                >
                  Назад
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Модальное окно сохранения шаблона */}
      {showSaveTemplate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Сохранить шаблон</h3>
            <input
              type="text"
              placeholder="Название шаблона"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={handleSaveTemplate}>Сохранить</button>
              <button onClick={() => {
                setShowSaveTemplate(false);
                setNewTemplateName('');
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

export default CheckList;