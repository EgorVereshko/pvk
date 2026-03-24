import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../api';
import Header from '../Header/Header';
import SpiderChart from '../SpiderChart/SpiderChart';
import LineChart from '../LineChart/LineChart';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userScores, setUserScores] = useState({
    'Обучаемость': 1.0,
    'Вовлеченность': 1.0,
    'Организованность': 1.0,
    'Работа в команде': 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchUserScores();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/');
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      } else {
        setError('Ошибка при загрузке профиля');
      }
    }
  };

  const fetchUserScores = async () => {
    try {
      const res = await api.get('/api/user/scores/');
      setUserScores(res.data);
    } catch (err) {
      console.error('Ошибка загрузки оценок:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Загрузка профиля...</div>;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="profile-container">
      <Header onLogout={() => { localStorage.clear(); navigate('/'); }} user={user} />

      <div className="profile-content">
        <div className="stats-info">
          <div className="lk-content">
            <div className="lk-left">
              <h1>Профиль</h1>

              <div className="lk-info">
                <img
                  className="lk-photo"
                  src={user.photo_url || '/default_avatar.jpeg'}
                  alt="avatar"
                />

                <div className="lk-text">
                  <h3>{user.first_name} {user.last_name}</h3>
                  <p>{user.university || '4 курс РИ-420900'}</p>
                  <p>{user.description || 'Команда ПВК 1'}</p>
                </div>
              </div>

              <LineChart userScores={userScores} />
            </div>

            <div className="lk-right">
              <h2>Статистика</h2>
              <div className="stats">
                <SpiderChart userScores={userScores} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;