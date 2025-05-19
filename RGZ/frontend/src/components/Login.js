import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../App.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/login', {
                email,
                password
            });

            localStorage.setItem('token', response.data.access_token);
            login({ surname: response.data.surname });
            navigate('/videos');
        } catch (error) {
            setError(error.response?.data?.message || 'Ошибка входа');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Вход</h2>
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email*</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="my_email@gmail.com"
                            required
                            className="auth-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Пароль*</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                            required
                            className="auth-input"
                        />
                    </div>

                    <button type="submit" className="auth-submit">Войти</button>
                </form>
            </div>
        </div>
    );
};

export default Login;