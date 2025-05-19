import React, { useState } from 'react';
import axios from 'axios';

const VideoUpload = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('Файл не выбран');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : 'Файл не выбран');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !file) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('video', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/videos/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Видео успешно загружено!');
      setTitle('');
      setFile(null);
      setFileName('Файл не выбран');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка загрузки видео');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Загрузка видео</h2>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Название видео</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="auth-input"
              placeholder="Введите название видео"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Видеофайл</label>
            <div className="file-upload-wrapper">
              <label className="file-label">
                Выберите файл
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </label>
              <span className="file-name">{fileName}</span>
            </div>
          </div>

          <button type="submit" className="auth-submit">
            Загрузить видео
          </button>
        </form>
      </div>
    </div>
  );
};
export default VideoUpload;