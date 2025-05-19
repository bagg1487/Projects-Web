from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from models import User, db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"message": "Отсутствуют email или password"}), 400

    email = data['email']
    password = data['password']
    surname = data.get('surname', '')

    if User.query.filter_by(username=email).first():
        return jsonify({"message": "Пользователь с таким email уже существует"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=email, password=hashed_password, surname=surname)
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Пользователь успешно создан"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Ошибка при регистрации", "error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('email')).first()
    if user and check_password_hash(user.password, data.get('password')):
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            "access_token": access_token,
            "surname": user.surname
        }), 200
    return jsonify({"message": "Неверные учетные данные"}), 401
