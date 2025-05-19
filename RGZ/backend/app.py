from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db
from routes.auth import auth_bp
from routes.videos import videos_bp
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
import os
import traceback

app = Flask(__name__)
app.config.from_object(Config)

app.config['DEBUG'] = True

# Разрешаем запросы с фронтенда на localhost:3000 с поддержкой куки и заголовков авторизации
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

db.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

# Регистрируем роуты под префиксом /api
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(videos_bp, url_prefix='/api')
print(app.url_map)

@app.errorhandler(Exception)
def handle_exception(e):
    print("🔥 Ошибка на сервере:")
    traceback.print_exc()
    return jsonify({'message': 'Ошибка сервера', 'error': str(e)}), 500

@app.route('/')
def home():
    return "server is fine"

if __name__ == '__main__':
    if not os.path.exists(Config.UPLOAD_FOLDER):
        os.makedirs(Config.UPLOAD_FOLDER)

    with app.app_context():
        db.create_all()

    app.run(debug=True, host='0.0.0.0', port=5000)