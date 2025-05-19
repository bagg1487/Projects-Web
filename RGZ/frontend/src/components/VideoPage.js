import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const VideoPage = () => {
  const { id } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [liked, setLiked] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const videoRes = await axios.get(`http://localhost:5000/api/videos/${id}/details`);
        setVideoData(videoRes.data);
        setLikesCount(videoRes.data.likes);
        setDislikesCount(videoRes.data.dislikes);

        if (token) {
          const myReactionRes = await axios.get(`http://localhost:5000/api/videos/${id}/myreaction`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setLiked(myReactionRes.data.is_like);

          const channelId = videoRes.data.channel.id;
          const subscribedRes = await axios.get(`http://localhost:5000/api/users/${channelId}/is_subscribed`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSubscribed(subscribedRes.data.subscribed);
        }

        const commentsRes = await axios.get(`http://localhost:5000/api/videos/${id}/comments`);
        setComments(commentsRes.data);

        const recRes = await axios.get('http://localhost:5000/api/videos');
        setRecommendations(recRes.data.filter((v) => v.id !== Number(id)).slice(0, 5));
      } catch (err) {
        setError('Ошибка загрузки данных: ' + (err.response?.data?.message || err.message));
      }
    };
    fetchData();
  }, [id, token]);

  const react = async (isLike) => {
    if (!token) {
      setError('Войдите в систему, чтобы ставить лайки');
      return;
    }
    try {
      await axios.post(
        `http://localhost:5000/api/videos/${id}/react`,
        { is_like: isLike },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (liked === isLike) {
        setLiked(null);
        if (isLike) setLikesCount(likesCount - 1);
        else setDislikesCount(dislikesCount - 1);
      } else {
        if (liked === null) {
          if (isLike) setLikesCount(likesCount + 1);
          else setDislikesCount(dislikesCount + 1);
        } else {
          if (isLike) {
            setLikesCount(likesCount + 1);
            setDislikesCount(dislikesCount - 1);
          } else {
            setLikesCount(likesCount - 1);
            setDislikesCount(dislikesCount + 1);
          }
        }
        setLiked(isLike);
      }
    } catch (err) {
      setError('Ошибка при отправке реакции: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleSubscribe = async () => {
    if (!token) {
      setError('Войдите в систему, чтобы подписываться');
      return;
    }
    try {
      const channelId = videoData.channel.id;
      const res = await axios.post(
        `http://localhost:5000/api/users/${channelId}/subscribe`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubscribed(res.data.subscribed);
    } catch (err) {
      setError('Ошибка подписки: ' + (err.response?.data?.message || err.message));
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Войдите в систему, чтобы комментировать');
      return;
    }
    if (!commentText.trim()) return;
    try {
      await axios.post(
        `http://localhost:5000/api/videos/${id}/comments`,
        { content: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const commentsRes = await axios.get(`http://localhost:5000/api/videos/${id}/comments`);
      setComments(commentsRes.data);
      setCommentText('');
    } catch (err) {
      setError('Ошибка добавления комментария: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleVideoError = (e, videoId) => {
    console.error(`Ошибка воспроизведения видео ID ${videoId}:`, e);
    console.log(`URL видео: http://localhost:5000/api/videos/${videoId}/stream`);
    setError(`Не удалось воспроизвести видео ID ${videoId}. Проверьте консоль для деталей.`);
  };

  const handleVideoLoad = (videoId) => {
    console.log(`Видео ID ${videoId} успешно загружено`);
  };

  if (!videoData) return <div>Загрузка...</div>;

  return (
    <div className="video-page">
      <div className="video-player">
        <video
          className="player"
          controls
          autoPlay
          key={videoData.id}
          onError={(e) => handleVideoError(e, videoData.id)}
          onLoadedData={() => handleVideoLoad(videoData.id)}
        >
          <source src={`http://localhost:5000/api/videos/${videoData.id}/stream`} type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>

        <div className="video-details">
          <h2 className="video-title">{videoData.title}</h2>

          <div className="channel-info">
            <div className="reaction-buttons">
              <span className="channel-name">{videoData.channel.name}</span>
              <button
                onClick={() => react(true)}
                className={`like-button ${liked === true ? 'active' : ''}`}
              >
                👍 {likesCount}
              </button>
              <button
                onClick={() => react(false)}
                className={`dislike-button ${liked === false ? 'active' : ''}`}
              >
                👎 {dislikesCount}
              </button>
            </div>

            <button
              onClick={toggleSubscribe}
              className={`subscribe-button ${subscribed ? 'subscribed' : ''}`}
            >
              {subscribed ? 'Вы подписаны' : 'Подписаться'}
            </button>
          </div>

          <div className="comments-section">
            <h3 className="section-title">Комментарии</h3>
            {error && <div className="error">{error}</div>}
            {token ? (
              <form onSubmit={addComment} className="comment-form">
                <textarea
                  rows="3"
                  className="comment-textarea"
                  placeholder="Оставьте комментарий"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" className="comment-submit">
                  Отправить
                </button>
              </form>
            ) : (
              <p>Войдите, чтобы оставлять комментарии.</p>
            )}
            {comments.length === 0 && <p>Комментариев пока нет.</p>}
            <ul className="comments-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <div>
                    <span className="comment-author">{c.author}</span>
                    <small className="comment-date">{new Date(c.created_at).toLocaleString()}</small>
                  </div>
                  <p className="comment-content">{c.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="recommendations">
        <h3 className="section-title">Рекомендации</h3>
        {recommendations.length > 0 ? (
          recommendations.map((video) => (
            <div key={video.id} className="recommendation-item">
              <h4>{video.title}</h4>
              <video
                className="recommendation-video"
                controls
                key={video.id}
                onError={(e) => handleVideoError(e, video.id)}
                onLoadedData={() => handleVideoLoad(video.id)}
              >
                <source src={`http://localhost:5000/api/videos/${video.id}/stream`} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          ))
        ) : (
          <p className="no-videos">Рекомендации не найдены.</p>
        )}
      </div>
    </div>
  );
};

export default VideoPage;