import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import MyVideos from './components/MyVideos';
import VideoUpload from './components/VideoUpload';
import VideoPage from './components/VideoPage';
import HomePage from './components/HomePage';
import { AuthProvider, useAuth } from './components/AuthContext';
import './App.css';

const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-content">
        <div className="nav-logo-container">
          <svg className="nav-logo-img" width="98" height="70" viewBox="0 0 98 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M37.8812 19.7436L29.2847 34.6222H46.4777L37.8812 19.7436Z" fill="black"/>
            <path d="M22.247 0L11.0999 19.3185V34.6222H28.6235V19.224L39.7234 0H22.247Z" fill="black"/>
            <path d="M47.1392 69.9526H66.7411L47.1392 35.9917V69.9526Z" fill="black"/>
            <path d="M28.6707 35.3304H11.0999V69.9526H28.6707V35.3304Z" fill="black"/>
            <path d="M79.541 35.3304C69.9998 35.3304 62.2063 43.124 62.2063 52.6651C62.2063 62.2063 69.9998 69.9998 79.541 69.9998C89.0822 69.9998 96.8757 62.2063 96.8757 52.6651C96.8757 43.0767 89.1294 35.3304 79.541 35.3304Z" fill="black"/>
            <path d="M29.3323 35.3304V69.9526C38.8734 69.9526 46.667 62.1591 46.667 52.6179C46.667 43.0767 38.8734 35.3304 29.3323 35.3304Z" fill="black"/>
            <path d="M47.2808 34.6223H69.0082L49.1701 0.236267L38.3064 19.0824L47.2808 34.6223Z" fill="black"/>
            <path d="M47.5642 35.3304L57.1998 52.0511C60.7896 50.9647 63.2457 47.6584 63.2457 43.8797C63.2457 39.1564 59.4198 35.3304 54.6965 35.3304H47.5642Z" fill="black"/>
            <path d="M0 0L10.722 18.61L21.444 0H0Z" fill="black"/>
          </svg>
          <Link to="/" className="nav-logo">ЧвякTube</Link>
        </div>
        <div className="nav-account">
          {user ? (
            <div className="user-dropdown">
              <span className="nav-link user-name">{user.surname} ⯆</span>
              <div className="dropdown-menu">
                <Link to="/videos" className="dropdown-item">Мои видео</Link>
                <Link to="/upload" className="dropdown-item">Загрузить</Link>
                <button onClick={logout} className="dropdown-item">Выйти</button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/register" className="nav-link">Регистрация</Link>
              <Link to="/login" className="nav-link nav-link-login">Вход</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Загрузка...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/videos" element={<ProtectedRoute><MyVideos /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><VideoUpload /></ProtectedRoute>} />
            <Route path="/watch/:id" element={<VideoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;