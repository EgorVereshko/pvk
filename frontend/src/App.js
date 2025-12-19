import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useNavigate} from 'react-router-dom';
import axios from 'axios';
import Login from './Login/Login';
import Register from './Register/Register';
import Profile from './Profile/Profile';
import EventsStudent from './EventsStudent/EventsStudent';
import EventsTutor from './EventsTutor/EventsTutor';
import './App.css';
import {setupAxiosInterceptors} from "./api";

axios.defaults.withCredentials = true;
setupAxiosInterceptors();

function Home() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
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
    return <div className="loading">Загрузка...</div>;
  }

  if (user) {
    return <Navigate to="/profile" replace/>;
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
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/events" element={<EventsStudent/>}/>
        <Route path="/events/tutor" element={<EventsTutor/>}/>
        <Route path="*" element={<Navigate to="/"/>}/>
      </Routes>
    </Router>
  );
}

export default App;