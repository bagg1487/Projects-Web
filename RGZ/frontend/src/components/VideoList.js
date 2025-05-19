import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './VideoList.css';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/videos/mine', { // Изменено на /mine, так как это список "Мои видео"
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.message === 'Нет доступных видео') {
          setVideos([]);
        } else {
          setVideos(response.data);
        }
      } catch (error) {
        setError('Ошибка загрузки списка видео: ' + (error.response?.data?.message || error.message));
      }
    };
    fetchVideos();
  }, []);

  const togglePublish = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post( // Изменено на POST, так как в videos.py используется POST для /publish
        `http://localhost:5000/api/videos/${id}/publish`,
        { is_published: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_published: !currentStatus } : v))
      );
    } catch (err) {
      alert('Ошибка изменения статуса публикации');
    }
  };

  const deleteVideo = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить это видео?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/videos/${id}/delete`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      alert('Видео удалено');
    } catch (err) {
      alert('Ошибка удаления видео: ' + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div className="video-list-container">
      <h2>Мои видео</h2>
      {error && <div className="error-message">{error}</div>}
      {videos.length > 0 ? (
        <div className="videos-grid">
          {videos.map((video) => (
            <div key={video.id} className="video-card">
              <Link to={`/watch/${video.id}`}>
                <img
                  className="video-preview"
                  src={`http://localhost:5000/api/videos/${video.id}/thumbnail`}
                  alt={video.title}
                  width="320"
                  height="180"
                />
              </Link>
              <h3 className="video-title">{video.title}</h3>
              <button
                className="publish-btn"
                onClick={() => togglePublish(video.id, video.is_published)}
              >
                {video.is_published ? 'Скрыть' : 'Опубликовать'}
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteVideo(video.id)}
                style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      ) : (
        !error && <p>Нет доступных видео</p>
      )}
    </div>
  );
};

export default VideoList;