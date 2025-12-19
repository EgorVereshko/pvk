import React, {useState, useEffect} from 'react';
import {useNavigate, Navigate} from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import SpiderChart from '../SpiderChart/SpiderChart';
import './Profile.css';


const Profile = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const authResponse = await axios.get('/api/check_auth/');
        if (authResponse.data.is_authenticated) {
          setIsAuthenticated(true);

          const profileResponse = await axios.get('/api/user/');
          setUser(profileResponse.data)
        }
      } catch (err) {
        console.log('Error', err.message);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout/');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  if (!user) {
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
                    <SpiderChart/>
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