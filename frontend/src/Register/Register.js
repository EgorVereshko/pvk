import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Register.css';

const Register = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    last_name: '',
    first_name: '',
    middle_name: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fieldConfig = [
    { name: 'username', label: 'Логин', type: 'text' },
    { name: 'password', label: 'Пароль (минимум 8 символов)', type: 'password' },
    { name: 'last_name', label: 'Фамилия', type: 'text' },
    { name: 'first_name', label: 'Имя', type: 'text' },
    { name: 'middle_name', label: 'Отчество', type: 'text' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const response = await axios.post('http://localhost:8000/api/register/', formData);
      onRegister(response.data)
      navigate('/profile');
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Ошибка соединения с сервером. Попробуйте позже.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Регистрация</h2>

        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {fieldConfig.map((field) => (
            <div className="form-group" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                required
                className={`auth-input ${errors[field.name] ? 'error' : ''}`}
                minLength={field.name === 'password' ? 8 : undefined}
                disabled={isSubmitting}
                autoComplete={
                  field.name === 'password' ? 'new-password' : 
                  field.name === 'username' ? 'username' : 'name'
                }
              />
              {errors[field.name] && (
                <span className="error-text">
                  {Array.isArray(errors[field.name]) 
                    ? errors[field.name].join(', ') 
                    : errors[field.name]}
                </span>
              )}
            </div>
          ))}

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