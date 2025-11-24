import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import SpiderChart from '../SpiderChart/SpiderChart';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/user/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/');
        } else {
          setError('Ошибка при загрузке данных пользователя');
        }
        console.error('Ошибка:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="profile-container">
      <Header onLogout={handleLogout} user={user} />
      
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
          {activeTab === 'profile' && (
            <div className="profile-info">
              <h1>Профиль пользователя</h1>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="user-card">
                <h2>Информация о пользователе</h2>
                <div className="user-details">
                  <p><strong>Имя пользователя:</strong> {user.username}</p>
                  <p><strong>Имя:</strong> {user.name}</p>
                  <p><strong>Возраст:</strong> {user.age}</p>
                  <p><strong>Описание:</strong> {user.description || 'Не указано'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-info">
              <div className="lk-content">
                <div className="lk-left">
                  <h1>Личный кабинет</h1>
                  <div className='lk-info'>
                    <div className='lk-photo'></div>
                    <div className='lk-text'>
                      <p>Иванов Иван Иванович</p>
                      <p>4 курс РИ 410947</p>
                      <p>команда 1</p>
                    </div>
                  </div>
                </div>

                <div className='lk-right'>
                  <p>Статистика</p>
                  <div className='stats'>
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