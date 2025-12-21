import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import './ScoreStudent.css';
import axios from "axios";
import {useAuth} from "../authHook";

const ScoreStudent = () => {
  const {user, authLoading, handleLogout, isAuthenticated} = useAuth();
  const [selectedStudent, setSelectedStudent] = useState('Студент');
  const [sliderValues, setSliderValues] = useState({
    'Организованность': 1,
    'Вовлеченность': -1,
    'Работа в команде': 1,
    'Обучаемость': 1,
  });

  const competences = [
    'Вовлеченность',
    'Работа в команде',
    'Обучаемость',
    'Организованность',
  ];


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

  if (authLoading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="score-container">
      <Header onLogout={handleLogout} user={user} />

      <div className="score-content">
        <div className="score-card">
          <h1 className="score-title">Оценка студента</h1>

          <div className="student-selector">
            <label>Студент</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option>Студент</option>
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
                        <span className="tick-line" />
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
