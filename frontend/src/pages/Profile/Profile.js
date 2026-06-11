import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useParams } from 'react-router-dom';
import api from '../../api';
import Header from '../../components/Header/Header';
import SpiderChart from '../../components/Charts/SpiderChart/SpiderChart';
import LineChart from '../../components/Charts/LineChart/LineChart';
import { useAuth } from '../../context/AuthContext';
import './Profile.scss';

const Profile = () => {
  const { id } = useParams();
  const { userRole } = useAuth();

  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [userScores, setUserScores] = useState({
    'Обучаемость': 1.0,
    'Вовлеченность': 1.0,
    'Организованность': 1.0,
    'Работа в команде': 1.0,
  });
  const [averageScore, setAverageScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isOwnProfile = !id;
  const displayUser = isOwnProfile ? user : profileUser;
  const isProjectant = userRole === 'Проектант';
  const isOrganizerOrTutor = userRole === 'Организатор' || userRole === 'Куратор';

  const getUserRole = (role) => {
    if (!role) return 'Проектант';
    return role;
  };

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const res = await api.get('/api/user/');
      setUser(res.data);

      if (!isOwnProfile) {
        const userRes = await api.get(`/api/user/${id}/`);
        setProfileUser(userRes.data);
        
        await fetchAverageScoreById(id);
      }

      if (isOwnProfile) {
        await fetchUserScores();
        await fetchAverageScore();
      } else {
        await fetchUserScoresById(id);
      }
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

  const fetchAverageScore = async () => {
    try {
      const res = await api.get('/api/latest_qualities_scores/');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const hasRealScores = res.data.some(item => item.score !== 0 && item.score !== null);
        if (hasRealScores) {
          const scores = res.data.map(item => item.score);
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          setAverageScore(Math.round(avg * 10) / 10);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки среднего балла:', err);
    }
  };

  const fetchAverageScoreById = async (userId) => {
    try {
      const res = await api.get(`/api/latest_qualities_scores/${userId}/`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const hasRealScores = res.data.some(item => item.score !== 0 && item.score !== null);
        if (hasRealScores) {
          const scores = res.data.map(item => item.score);
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          setAverageScore(Math.round(avg * 10) / 10);
        } else {
          setAverageScore(null);
        }
      } else {
        setAverageScore(null);
      }
    } catch (err) {
      console.error('Ошибка загрузки среднего балла:', err);
      setAverageScore(null);
    }
  };

  const fetchUserScores = async () => {
    try {
      const res = await api.get('/api/latest_qualities_scores/');
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

  const getScoreColor = (score) => {
    if (score === null) return '#cbd5e0';
    if (score >= 2 && score <= 3) return '#48bb78';
    if (score >= 0 && score < 2) return '#ed8936';
    if (score >= -1 && score < 0) return '#f56565';
    return '#cbd5e0';
  };

  if (loading) return <div className="loading">Загрузка профиля...</div>;
  if (error) return <div className="loading">{error}</div>;
  if (!user) return <Navigate to="/" replace />;

  const pageTitle = isOwnProfile
    ? 'Профиль'
    : `Профиль: ${displayUser?.first_name} ${displayUser?.last_name}`;

  const teamName = displayUser?.team_name || 'Без команды';
  const displayRole = getUserRole(displayUser?.role || userRole);
  
  const hasTeam = teamName !== 'Без команды' && displayUser?.team_name;

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
                  <p>{displayUser?.university || 'УрФУ'}</p>
                  {hasTeam && <p>{teamName}</p>}
                  
                  {!isOwnProfile && isOrganizerOrTutor && (
                    <div className="average-score-block">
                      <span className="average-score-label">Средний балл:</span>
                      {averageScore !== null ? (
                        <span 
                          className="average-score-value"
                          style={{ backgroundColor: getScoreColor(averageScore) }}
                        >
                          {averageScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="average-score-value no-score">—</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isProjectant && <LineChart userId={displayUser?.id} />}
            </div>

            {isProjectant && (
              <div className="lk-right">
                <h2>Статистика</h2>
                <div className="stats">
                  <SpiderChart 
                    userId={displayUser?.id} 
                    userScores={userScores} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;