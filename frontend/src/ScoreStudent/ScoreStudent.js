import React, {useState, useEffect} from 'react';
import {Navigate, useNavigate, useParams} from 'react-router-dom';
import Header from '../Header/Header';
import './ScoreStudent.css';
import axios from "axios";
import {useAuth} from "../authHook";

const ScoreStudent = () => {
  const {user, authLoading, handleLogout} = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState();
  const [sliderValues, setSliderValues] = useState({
    'Вовлеченность': 0,
    'Работа в команде': 0,
    'Обучаемость': 0,
    'Организованность': 0,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const competences = [
    'Вовлеченность',
    'Работа в команде',
    'Обучаемость',
    'Организованность',
  ];

  const {event_id} = useParams();


  const [eventData, setEventData] = useState(null);
  const fetchEvent = async () => {
    try {
      const response = await axios.get(`/api/get_event_members/${event_id}/`);
      setEventData(response.data)
    } catch (error) {
      console.error('Ошибка загрузки участников мероприятия:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchEvent();
    }
  }, [authLoading, event_id]);

  const handleSubmit = async () => {
    if (!selectedStudent) {
      setSaveMessage('Выберите студента');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const scoresData =
        {
          evaluated_user_id: parseInt(selectedStudent), // кого оценили
          evaluator_id: user.id,   // кто оценил
          event_id: eventData.id,
          involvement_score: sliderValues['Вовлеченность'],
          teamwork_score: sliderValues['Работа в команде'],
          learning_score: sliderValues['Обучаемость'],
          organization_score: sliderValues['Организованность'],
        };
      const response = await axios.post('/api/record_assessment/', scoresData);

      setSaveMessage('Оценки успешно сохранены!');
      console.log('Сохраненные оценки:', response.data);

      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaveMessage(`Ошибка: ${error.response?.data?.error || 'Неизвестная ошибка'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSliderChange = (competence, value) => {
    setSliderValues(prev => ({
      ...prev,
      [competence]: parseInt(value, 10),
    }));
  };


  if (authLoading || loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="score-container">
      <Header onLogout={handleLogout} user={user}/>

      <div className="score-content">
        <div className="score-card">
          <h1 className="score-title">Оценка студента</h1>

          <div className="student-selector">
            <label>Студент:</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Выберите студента</option>
              {eventData.team.members
                .filter(member => member.id !== user.id) // убираем текущего пользователя, чтобы он не оценивал самого себя
                .map((member) =>
                  <option key={member.id} value={member.id}>
                    {member.short_name}
                  </option>
                )}
            </select>
          </div>

          <div className="competence-sliders">
            {competences.map(c => (
              <div key={c} className="competence-row">
                <span className="competence-name">{c}</span>

                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="-1"
                    max="3"
                    step="1"
                    value={sliderValues[c]}
                    onChange={(e) => handleSliderChange(c, e.target.value)}
                  />

                  <div className="slider-ticks">
                    {[-1, 0, 1, 2, 3].map((v) => (
                      <div key={v} className="slider-tick">
                        <span className="tick-line"/>
                        <span className="tick-value">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="save-section">
            <div className="save-button-container">
              <button
                className="save-button"
                onClick={handleSubmit}
                disabled={saving || !selectedStudent}
              >
                {saving ? 'Сохранение...' : 'Сохранить оценки'}
              </button>
            </div>
            {saveMessage && (
              <div className={`save-message ${saveMessage.includes('успешно') ? 'success' : 'error'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreStudent;
