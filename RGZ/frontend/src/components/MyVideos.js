import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyVideos = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/videos/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideos(response.data);
    } catch (error) {
      setError('Ошибка загрузки списка видео: ' + (error.response?.data?.message || error.message));
    }
  };

  const togglePublish = async (videoId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/videos/${videoId}/publish`,
        { is_published: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideos((prevVideos) =>
        prevVideos.map((video) =>
          video.id === videoId ? { ...video, is_published: !currentStatus } : video
        )
      );
    } catch (error) {
      setError('Ошибка при изменении статуса публикации: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteVideo = async (videoId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это видео?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoId));
      alert('Видео успешно удалено!');
    } catch (error) {
      setError('Ошибка при удалении видео: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleVideoError = (e, videoId) => {
    console.error(`Ошибка воспроизведения видео ID ${videoId}:`, e);
    setError(`Не удалось воспроизвести видео ID ${videoId}. Проверьте консоль для деталей.`);
  };

  return (
    <div className="my-videos">
      <h2 className="section-title">Мои видео</h2>
      {error && <div className="error">{error}</div>}

      {videos.length > 0 ? (
        <div className="video-list">
          {videos.map((video) => (
            <div key={video.id} className="video-item">
              <h3 className="video-title">{video.title}</h3>
              <video
                width="100%"
                height="180"
                controls
                onError={(e) => handleVideoError(e, video.id)}
              >
                <source src={`http://localhost:5000/api/videos/${video.id}/stream`} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
              <div className="video-actions">
                <button
                  className="publish-toggle"
                  onClick={() => togglePublish(video.id, video.is_published)}
                >
                  {video.is_published ? 'Снять с публикации' : 'Опубликовать'}
                </button>
                <button
                  className="delete-button"
                  onClick={() => deleteVideo(video.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-videos">Нет видео</p>
      )}
    </div>
  );
};

export default MyVideos;