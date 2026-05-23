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

  useEffect(() => {
    fetchUserProfile();
    if (isOwnProfile) {
      fetchUserScores();
    } else {
      fetchUserScoresById(id);
    }
  }, [navigate, id]);

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

  const fetchUserScoresById = async (userId) => {
    try {
      const userRes = await api.get(`/api/user/${userId}/`);
      setProfileUser(userRes.data);
      
      const scoresRes = await api.get(`/api/latest_qualities_scores/${userId}/`);
      console.log(`Оценки пользователя ${userId}:`, scoresRes.data);
      
      if (scoresRes.data && Array.isArray(scoresRes.data)) {
        const scoresObject = {};
        scoresRes.data.forEach(item => {
          scoresObject[item.quality_name] = item.score;
        });
        setUserScores(scoresObject);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных пользователя:', err);
      setError('Не удалось загрузить профиль пользователя');
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Загрузка профиля...</div>;
  if (!user) return <Navigate to="/" replace />;

  const displayUser = isOwnProfile ? user : profileUser;
  const pageTitle = isOwnProfile ? 'Профиль' : `Профиль: ${displayUser?.first_name} ${displayUser?.last_name}`;

  return (
    <div className="profile-container">
      <Header onLogout={() => { localStorage.clear(); navigate('/'); }} user={user} />

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
                  <p>{displayUser?.description || 'Команда ПВК 1'}</p>
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