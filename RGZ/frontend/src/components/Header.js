import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import logoIcon from '../assets/logo-icon.svg'; // Добавьте ваш логотип

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles['header-container']}>
        <Link to="/" className={styles.logo}>
          <img src={logoIcon} alt="ЧвякTube" className={styles['logo-icon']} />
          ЧвякTube
        </Link>

        <nav className={styles['nav-links']}>
          <Link to="/videos" className={styles['nav-link']}>Видео</Link>
          <Link to="/upload" className={styles['nav-link']}>Загрузить</Link>
          <Link to="/profile" className={styles['nav-link']}>Профиль</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;