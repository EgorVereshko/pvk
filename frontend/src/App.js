import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login/Login';
import Register from './Register/Register';
import Profile from './Profile/Profile';
import EventsStudent from './EventsStudent/EventsStudent';
import EventsTutor from './EventsTutor/EventsTutor';
import './App.css';

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/user/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
        console.error('Ошибка:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/profile');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="App">
      <div className="home-container">
        <h1>Сервис оценки профессионально важных качеств</h1>
        <div className="auth-buttons">
          <button 
            onClick={() => navigate('/login')}
            className="auth-button login-button"
          >
            Войти
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="auth-button register-button"
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/events" element={<EventsStudent />} />
        <Route path="/events/tutor" element={<EventsTutor />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;