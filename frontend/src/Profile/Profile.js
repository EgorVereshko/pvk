import React, {useState, useEffect} from 'react';
import {useNavigate, Navigate} from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import SpiderChart from '../SpiderChart/SpiderChart';
import './Profile.css';
import {useAuth} from "../authHook";


const Profile = () => {
  const {user, authLoading, handleLogout, isAuthenticated} = useAuth();
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  if (authLoading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace/>;
  }

  return (
    <div className="profile-container">
      <Header onLogout={handleLogout} user={user}/>

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

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <h1>Информация о пользователе</h1>
              <div className="user-details">
                <p><strong>Имя:</strong> {user.first_name} {user.last_name}</p>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-info">
              <div className="lk-content">
                <div className="lk-left">
                  <h1>Личный кабинет</h1>
                  <div className='lk-info'>
                    <img className='lk-photo' src={user.photo_url}/>
                    <div className='lk-text'>
                      <p>{user.first_name} {user.last_name}</p>
                      <p>4 курс РИ 410947</p>
                      <p>команда 1</p>
                    </div>
                  </div>
                </div>

                <div className='lk-right'>
                  <h2>Статистика</h2>
                  <div className='stats'>
                    <SpiderChart user={user}/>
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