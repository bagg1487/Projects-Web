import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';
const AllVideos = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/videos/all');
        if (response.data.message === 'Нет доступных видео') {
          setVideos([]);
        } else {
          setVideos(response.data);
        }
      } catch (error) {
        setError('Ошибка загрузки видео: ' + (error.response?.data?.message || error.message));
        console.error(error);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div>
      <h2>Все опубликованные видео</h2>
      {error && <div>{error}</div>}
      {videos.length > 0 ? (
        <div className="videos-grid">
          {videos.map((video) => (
            <div key={video.id} className="video-card">
              <a href={`http://localhost:5000/api/videos/${video.id}`} target="_blank" rel="noopener noreferrer">
                <video
                  src={`http://localhost:5000/api/videos/${video.id}`}
                  preload="metadata"
                  width="320"
                  height="180"
                  controls
                />
              </a>
              <h3>{video.title}</h3>
            </div>
          ))}
        </div>
      ) : (
        <p>Нет доступных видео</p>
      )}
    </div>
  );
};

export default AllVideos;
