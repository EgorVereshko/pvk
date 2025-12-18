import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Login/Login';
import Register from './Register/Register';
import Profile from './Profile/Profile';
import EventsStudent from './EventsStudent/EventsStudent';
import EventsTutor from './EventsTutor/EventsTutor';
import ProfileEdit from './ProfileEdit/ProfileEdit';
import ScoreStudent from './ScoreStudent/ScoreStudent';
import './App.css';

function Home() {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem('access_token');

  if (isAuth) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="App">
      <div className="home-container">
        <h1>Сервис оценки профессионально важных качеств</h1>
        <div className="auth-buttons">
          <button onClick={() => navigate('/login')} className="auth-button login-button">
            Войти
          </button>
          <button onClick={() => navigate('/register')} className="auth-button register-button">
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
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/score/student" element={<ScoreStudent />} />
        <Route path="/events" element={<EventsStudent />} />
        <Route path="/events/tutor" element={<EventsTutor />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;