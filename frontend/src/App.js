import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import Models from './pages/Models/Models';
import './styles/App.css';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Доступно всем авторизованным */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/profile/:id" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/form360" element={
        <ProtectedRoute>
          <Form360List />
        </ProtectedRoute>
      } />
      <Route path="/polls" element={
        <ProtectedRoute>
          <Poll />
        </ProtectedRoute>
      } />
      
      {/* Только для проектантов */}
      <Route path="/poll/:form_id" element={
        <ProtectedRoute allowedRoles={['Проектант']}>
          <PollPass />
        </ProtectedRoute>
      } />
      <Route path="/score/student" element={
        <ProtectedRoute allowedRoles={['Проектант']}>
          <ScoreStudent />
        </ProtectedRoute>
      } />


      {/* Только для кураторов и организаторов */}
      <Route path="/form360/create" element={
        <ProtectedRoute allowedRoles={['Куратор', 'Организатор']}>
          <Form360Create />
        </ProtectedRoute>
      } />
      <Route path="/polls/create" element={
        <ProtectedRoute allowedRoles={['Куратор', 'Организатор']}>
          <PollCreate />
        </ProtectedRoute>
      } />
      <Route path="/checklist/create" element={
        <ProtectedRoute allowedRoles={['Куратор', 'Организатор']}>
          <CheckList />
        </ProtectedRoute>
      } />
      <Route path="/checklist/view/:id" element={
        <ProtectedRoute allowedRoles={['Куратор', 'Организатор']}>
          <CheckListView />
        </ProtectedRoute>
      } />
      <Route path="/events/tutor" element={
        <ProtectedRoute allowedRoles={['Куратор', 'Организатор']}>
          <EventsTutor />
        </ProtectedRoute>
      } />
      
      {/* Только для организаторов */}
      <Route path="/students" element={
        <ProtectedRoute allowedRoles={['Организатор']}>
          <ListStudent />
        </ProtectedRoute>
      } />
      <Route path="/qualities" element={
        <ProtectedRoute allowedRoles={['Организатор']}>
          <Qualities />
        </ProtectedRoute>
      } />
      <Route path="/models" element={
        <ProtectedRoute allowedRoles={['Организатор']}>
          <Models />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;