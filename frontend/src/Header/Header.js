import React from 'react';
import './Header.css';

const Header = ({ onLogout, user }) => {
  const handleExitClick = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="main-header">
      <a href='/' className='header__item'>Главная</a>
      <a href='#' className='header__item'>Веб сервис стажировок</a>
      <a href='/profile' className='header__item'>
        <img className='header__ava' src='/ava.jpg' />
      </a>
      {user && (
        <a 
          href='#' 
          className='header__item header__exit'
          onClick={handleExitClick}
        >
          <img src="/exit.png" alt="Выход" className="header__logo" />
        </a>
      )}
    </header>
  );
};

export default Header;