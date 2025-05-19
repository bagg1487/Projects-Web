import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY') or 'super-secret-key'
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or 'super-secret-key'
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgresql:changeme@localhost:5432/video_platform')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')  # абсолютный путь
    ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi'}
    JWT_ACCESS_TOKEN_EXPIRES = 24 * 60 * 60  # 24 часа