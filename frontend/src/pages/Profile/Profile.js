import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useParams } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import SpiderChart from '../../components/Charts/SpiderChart/SpiderChart';
import LineChart from '../../components/Charts/LineChart/LineChart';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [userScores, setUserScores] = useState({
    'Обучаемость': 1.0,
    'Вовлеченность': 1.0,
    'Организованность': 1.0,
    'Работа в команде': 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isOwnProfile = !id;
  const displayUser = isOwnProfile ? user : profileUser;

  useEffect(() => {
    fetchUserProfile();
  }, [id, navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/user/');
      setUser(res.data);

      if (!isOwnProfile) {
        const userRes = await api.get(`/api/user/${id}/`);
        setProfileUser(userRes.data);
      }

      await fetchUserScores();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      } else {
        setError('Ошибка при загрузке профиля');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserScores = async () => {
    try {
      const res = await api.get('/api/latest_qualities_scores/');
      console.log('Свои оценки:', res.data);

      if (res.data && Array.isArray(res.data)) {
        const scoresObject = {};
        res.data.forEach(item => {
          scoresObject[item.quality_name] = item.score;
        });
        setUserScores(scoresObject);
      }
    } catch (err) {
      console.error('Ошибка загрузки оценок:', err);
    }
  };

  const fetchUserScoresById = async (userId) => {
    try {
      const res = await api.get(`/api/latest_qualities_scores/${userId}/`);
      console.log(`Оценки пользователя ${userId}:`, res.data);

      if (res.data && Array.isArray(res.data)) {
        const scoresObject = {};
        res.data.forEach(item => {
          scoresObject[item.quality_name] = item.score;
        });
        setUserScores(scoresObject);
      }
    } catch (err) {
      console.error('Ошибка загрузки оценок:', err);
    }
  };

  if (loading) return <div className="loading">Загрузка профиля...</div>;
  if (!user) return <Navigate to="/" replace />;

  const pageTitle = isOwnProfile
    ? 'Профиль'
    : `Профиль: ${displayUser?.first_name} ${displayUser?.last_name}`;

  const teamName = displayUser?.team_name || 'Без команды';

  return (
    <div className="profile-container">
      <Header
        onLogout={() => {
          localStorage.clear();
          navigate('/');
        }}
        user={user}
      />

      <div className="profile-content">
        <div className="stats-info">
          <div className="lk-content">
            <div className="lk-left">
              <h1>{pageTitle}</h1>

              <div className="lk-info">
                <img
                  className="lk-photo"
                  src={displayUser?.photo_url || '/default_avatar.jpeg'}
                  alt="avatar"
                />

                <div className="lk-text">
                  <h3>{displayUser?.first_name} {displayUser?.last_name}</h3>
                  <p>{displayUser?.university || 'Университет не указан'}</p>
                  <p>{teamName}</p>
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