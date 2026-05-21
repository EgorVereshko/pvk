import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Auth/Login/Login';
import Register from './pages/Auth/Register/Register';
import Profile from './pages/Profile/Profile';
import EventsStudent from './pages/Events/EventsStudent/EventsStudent';
import EventsTutor from './pages/Events/EventsTutor/EventsTutor';
import ScoreStudent from './pages/ScoreStudent/ScoreStudent';
import CheckList from './pages/CheckList/CheckList';
import CheckListView from './pages/CheckList/CheckListView';
import Poll from './pages/Poll/Poll';
import PollPass from './pages/Poll/PollPass';
import ListStudent from './pages/ListStudent/ListStudent';
import Qualities from './pages/Qualities/Qualities';
import Form360List from './pages/Form360/Form360List';
import Form360Create from './pages/Form360/Form360Create';
import Form360Pass from './pages/Form360/Form360Pass';
import PollCreate from './pages/Poll/PollCreate';
import './styles/App.css';

function Home() {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem('access_token');

  if (isAuth) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="App">
      <div className="home-container">
        <h1>Сервис оценки профессионально важных качеств (ПВК)</h1>
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
        <Route path="/score/student" element={<ScoreStudent />} />
        <Route path="/events" element={<EventsStudent />} />
        <Route path="/events/tutor" element={<EventsTutor />} />
        <Route path="/polls" element={<Poll />} />
        <Route path="/poll/:link" element={<PollPass />} />
        <Route path="/students" element={<ListStudent />} />
        <Route path="/checklist/create" element={<CheckList />} />
        <Route path="/checklist/view/:id" element={<CheckListView />} />
        <Route path="/qualities" element={<Qualities />} />
        <Route path="/form360" element={<Form360List />} />
        <Route path="/form360/create" element={<Form360Create />} />
        <Route path="/form360/pass/:id" element={<Form360Pass />} />
        <Route path="/polls/create" element={<PollCreate />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;