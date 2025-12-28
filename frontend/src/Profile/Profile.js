import React, {useState, useEffect} from 'react';
import {useNavigate, Navigate} from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import SpiderChart from '../SpiderChart/SpiderChart';
import LineChart from '../LineChart/LineChart';
import './Profile.css';
import {useAuth} from "../authHook";


const Profile = () => {
  const {user, authLoading, handleLogout, isAuthenticated} = useAuth();
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  const renderFieldValue = (value, placeholder = 'Не указано') =>
    value && value.trim()
      ? value
      : <span className="placeholder">{placeholder}</span>;

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
                      <p>{user.year_of_study ? `${user.year_of_study} курс` : ''}</p>
                      <p>{user.team_name ? `Команда: "${user.team_name}"` : 'Без команды'}</p>
                    </div>
                  </div>

                  <LineChart user={user}/>
                </div>

                <div className="lk-right">
                  <h2>Статистика</h2>
                  <div className='stats'>
                    <SpiderChart user={user}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
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
                      <p>{user.year_of_study ? `${user.year_of_study} курс` : ''}</p>
                      <p>{user.team_name ? `Команда: "${user.team_name}"` : 'Без команды'}</p>
                    </div>
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