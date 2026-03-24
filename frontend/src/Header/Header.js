import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ onLogout, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();

  const handleExitClick = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
    }
    setIsMenuOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMenuOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          avatarRef.current && !avatarRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="main-header">
      <a href='/score/student' className='header__item'>Форма 360</a>
      <a href='/events' className='header__item'>Оценочные мероприятия</a>
      <a href='/polls' className='header__item'>Опросники</a>
      
      <div className="header__avatar-wrapper">
        <button 
          ref={avatarRef}
          className="header__avatar-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <img 
            className='header__ava' 
            src={user?.photo_url || '/default_avatar.jpeg'} 
            alt="Avatar"
          />
        </button>
        
        {isMenuOpen && (
          <div ref={menuRef} className="dropdown-menu">
            <div className="dropdown-menu__user">
              <img 
                className="dropdown-menu__avatar" 
                src={user?.photo_url || '/default_avatar.jpeg'} 
                alt="Avatar"
              />
              <div className="dropdown-menu__info">
                <div className="dropdown-menu__name">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="dropdown-menu__email">
                  {user?.email || user?.username || 'user@example.com'}
                </div>
              </div>
            </div>
            
            <div className="dropdown-menu__divider"></div>
            
            <button 
              className="dropdown-menu__item"
              onClick={handleProfileClick}
            >
              <svg className="dropdown-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Профиль
            </button>
            
            <button 
              className="dropdown-menu__item"
              onClick={handleSettingsClick}
            >
              <svg className="dropdown-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Настройки
            </button>
            
            <div className="dropdown-menu__divider"></div>
            
            <button 
              className="dropdown-menu__item dropdown-menu__item--logout"
              onClick={handleExitClick}
            >
              <svg className="dropdown-menu__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Выйти из профиля
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;