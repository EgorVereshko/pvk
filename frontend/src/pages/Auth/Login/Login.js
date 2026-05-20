import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Введите имя пользователя';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать не менее 3 символов';
    }
    
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Пароль должен содержать не менее 4 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setApiError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/token/', formData);
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      navigate('/profile');
      
    } catch (err) {
      console.error('Ошибка входа:', err);
      
      if (err.response?.status === 401) {
        setApiError('Неверное имя пользователя или пароль');
      } else if (err.response?.status === 400) {
        setApiError('Пожалуйста, заполните все поля правильно');
      } else if (err.message === 'Network Error') {
        setApiError('Ошибка соединения. Проверьте интернет.');
      } else {
        setApiError('Ошибка при входе. Попробуйте еще раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Вход</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`auth-input ${errors.username ? 'error' : ''}`}
              placeholder="Введите логин"
              disabled={isSubmitting}
              autoComplete="username"
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`auth-input ${errors.password ? 'error' : ''}`}
              placeholder="Введите пароль"
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
          
          {apiError && (
            <div className="error-message">
              {apiError}
            </div>
          )}
          
          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <p className="auth-link">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;