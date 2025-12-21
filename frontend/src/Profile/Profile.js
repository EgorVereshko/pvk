import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../api';
import Header from '../Header/Header';
import SpiderChart from '../SpiderChart/SpiderChart';
import LineChart from '../LineChart/LineChart';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/');
      setUser(res.data);
      setEditForm(res.data);
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

  if (loading) return <div className="loading">Загрузка профиля...</div>;
  if (!user) return <Navigate to="/" replace />;

  const renderFieldValue = (value, placeholder = 'Не указано') =>
    value && value.trim()
      ? value
      : <span className="placeholder">{placeholder}</span>;

  return (
    <div className="profile-container">
      <Header onLogout={() => { localStorage.clear(); navigate('/'); }} user={user} />

      <div className="profile-content">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Профиль пользователя
          </button>

          <button
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Личный кабинет
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'stats' && (
            <div className="stats-info">
              <div className="lk-content">
                <div className="lk-left">
                  <h1>Личный кабинет</h1>

                  <div className="lk-info">
                    <img
                      className="lk-photo"
                      src={user.photo_url || '/default_avatar.jpeg'}
                      alt="avatar"
                    />

                    <div className="lk-text">
                      <h3>{user.first_name} {user.last_name}</h3>
                      <p>4 курс РИ-410947</p>
                      <p>Команда: team1</p>
                    </div>
                  </div>

                  <LineChart />
                </div>

                <div className="lk-right">
                  <h2>Статистика</h2>
                  <div className="stats">
                    <SpiderChart />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;