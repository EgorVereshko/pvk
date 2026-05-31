import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import './Register.scss';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    last_name: '',
    first_name: '',
    middle_name: ''
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Введите логин';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Логин должен содержать не менее 3 символов';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Логин может содержать только буквы, цифры и подчеркивание';
    }
    
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать не менее 8 символов';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну заглавную и одну строчную букву';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Введите фамилию';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Фамилия должна содержать не менее 2 символов';
    }
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Введите имя';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'Имя должно содержать не менее 2 символов';
    }
    
    if (formData.middle_name.trim() && formData.middle_name.length < 2) {
      newErrors.middle_name = 'Отчество должно содержать не менее 2 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    setApiError('');
    
    try {
      const res = await api.post('/api/register/', formData);
      
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      
      navigate('/profile');
      
    } catch (err) {
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          setErrors(err.response.data);
          setApiError(err.response.data.general || 'Ошибка при регистрации');
        } else {
          setApiError('Ошибка при регистрации');
        }
      } else {
        setApiError('Ошибка соединения с сервером. Попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldConfig = [
    { name: 'username', label: 'Логин', type: 'text', placeholder: 'Введите логин', col: 'left' },
    { name: 'password', label: 'Пароль', type: 'password', placeholder: 'Введите пароль (мин. 8 символов)', col: 'right' },
    { name: 'last_name', label: 'Фамилия', type: 'text', placeholder: 'Введите фамилию', col: 'left' },
    { name: 'first_name', label: 'Имя', type: 'text', placeholder: 'Введите имя', col: 'right' },
    { name: 'middle_name', label: 'Отчество', type: 'text', placeholder: 'Введите отчество (необязательно)', col: 'full' }
  ];

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Создать аккаунт</h2>
        <p className="auth-subtitle">Заполните данные для регистрации</p>

        {apiError && !Object.keys(errors).length && (
          <div className="error-message general-error">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-col">
              {fieldConfig.filter(f => f.col === 'left').map((field) => (
                <div className="form-group" key={field.name}>
                  <label htmlFor={field.name}>
                    {field.label}
                    {field.name !== 'middle_name' && <span className="required-star">*</span>}
                  </label>
                  <input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className={`auth-input ${errors[field.name] ? 'error' : ''}`}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    autoComplete={field.name === 'password' ? 'new-password' : field.name === 'username' ? 'username' : 'name'}
                  />
                  {errors[field.name] && (
                    <span className="error-text">
                      {errors[field.name]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="form-col">
              {fieldConfig.filter(f => f.col === 'right').map((field) => (
                <div className="form-group" key={field.name}>
                  <label htmlFor={field.name}>
                    {field.label}
                    <span className="required-star">*</span>
                  </label>
                  <input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className={`auth-input ${errors[field.name] ? 'error' : ''}`}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    autoComplete={field.name === 'password' ? 'new-password' : 'name'}
                  />
                  {errors[field.name] && (
                    <span className="error-text">
                      {errors[field.name]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group form-group-full">
            {fieldConfig.filter(f => f.col === 'full').map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={`auth-input ${errors[field.name] ? 'error' : ''}`}
                  placeholder={field.placeholder}
                  disabled={isSubmitting}
                  autoComplete="name"
                />
                {errors[field.name] && (
                  <span className="error-text">
                    {errors[field.name]}
                  </span>
                )}
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;