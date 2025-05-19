import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/videos/all');
        setVideos(res.data);
      } catch (error) {
        setError('Ошибка при загрузке видео: ' + (error.response?.data?.message || error.message));
        console.error('Ошибка при загрузке видео', error);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoError = (e, videoId) => {
    const target = e.target;
    const networkState = target.networkState;
    const errorCode = target.error?.code || 'Unknown';
    const errorMessage = target.error?.message || 'Неизвестная ошибка';
    console.error(`Ошибка воспроизведения видео ID ${videoId}:`, {
      networkState,
      errorCode,
      errorMessage,
      event: e,
    });
    setError(`Не удалось воспроизвести видео ID ${videoId}. Код ошибки: ${errorCode} - ${errorMessage}. Проверь консоль для деталей.`);
  };

  return (
    <div className="video-grid">
      <h2 className="section-title">Популярные видео</h2>
      {error && <div className="error">{error}</div>}
      <div className="grid">
        {videos.map((video) => (
          <Link to={`/watch/${video.id}`} key={video.id} className="video-card">
            <video
              width="100%"
              height="100%"
              controls
              onError={(e) => handleVideoError(e, video.id)}
            >
              <source src={`http://localhost:5000/api/videos/${video.id}/stream`} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
            <div className="video-info">
              <h4 className="video-title">{video.title}</h4>
              <p className="video-channel">{video.channel}</p>
            </div>
          </Link>
        ))}
      </div>
      {videos.length === 0 && !error && <p className="no-videos">Видео пока нет</p>}
    </div>
  );
};

export default HomePage;