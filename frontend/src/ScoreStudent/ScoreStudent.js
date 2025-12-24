import React, {useState, useEffect} from 'react';
import {Navigate, useNavigate, useParams} from 'react-router-dom';
import Header from '../Header/Header';
import './ScoreStudent.css';
import axios from "axios";
import {useAuth} from "../authHook";

const ScoreStudent = () => {
  const {user, authLoading, handleLogout} = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('Студент');
  const [sliderValues, setSliderValues] = useState({
    'Организованность': 0,
    'Вовлеченность': 0,
    'Работа в команде': 0,
    'Обучаемость': 0,
  });

  const competences = [
    'Вовлеченность',
    'Работа в команде',
    'Обучаемость',
    'Организованность',
  ];

  const {event_id} = useParams();

  useEffect(() => {
    if (!authLoading) {
      fetchEvent();
    }
  }, [authLoading, event_id]);

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

  const [formData, setFormData] = useState([
    {
      evaluated_user_id: null, // кого оценили
      evaluator_id: null,   // кто оценил
      event_id: null,
      learning_score: 0,
      involvement_score: 0,
      organization_score: 0,
      teamwork_score: 0
    }
  ]);

  const [sumbit_error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);


    try {
      const response = await axios.post('/api/record_assessment/', formData);
      console.log('Оценки созданы:', response.data);
    } catch (error) {
      console.error('Ошибка отправки оценок:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSliderChange = (competence, value) => {
    setSliderValues(prev => ({
      ...prev,
      [competence]: parseInt(value, 10),
    }));
  };

  const spiderChartData = competences.map(c => ({
    label: c,
    value: sliderValues[c],
  }));

  if (authLoading || loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="score-container">
      <Header onLogout={handleLogout} user={user}/>

      <div className="score-content">
        <div className="score-card">
          <h1 className="score-title">Оценка студента</h1>

          <div className="student-selector">
            <label>Студент</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {eventData.team.members
                .filter(member => member.id !== user.id) // убираем текущего пользователя, чтобы он не оценивал самого себя
                .map((member) =>
                  <option>{member.short_name}</option>
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
        </div>
      </div>
    </div>
  );
};

export default ScoreStudent;
