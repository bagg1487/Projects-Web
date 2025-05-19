from flask import Blueprint, request, jsonify, send_file, make_response
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from datetime import datetime
import cv2
from flask import current_app
from models import Video, Reaction, Comment, Subscription, User, db
from config import Config

videos_bp = Blueprint('videos', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@videos_bp.route('/videos', methods=['POST'])
@jwt_required()
def upload_video():
    if 'video' not in request.files:
        return jsonify({'msg': 'No video file provided'}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({'msg': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'msg': 'File extension not allowed'}), 400

    title = request.form.get('title', 'default_video_title')
    is_published = request.form.get('is_published', 'false').lower() == 'true'

    filename = secure_filename(file.filename)
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)

    thumbnail_filename = None
    if 'thumbnail' in request.files:
        thumbnail_file = request.files['thumbnail']
        if thumbnail_file and thumbnail_file.filename and allowed_file(thumbnail_file.filename):
            print(f"Saving thumbnail: {thumbnail_file.filename}")
            thumbnail_filename = secure_filename(f"{filename}_thumbnail.jpg")
            thumbnail_path = os.path.join(Config.UPLOAD_FOLDER, thumbnail_filename)
            thumbnail_file.save(thumbnail_path)
        else:
            print("Thumbnail file is invalid or not allowed")
    else:
        print("No thumbnail provided in request")

    new_video = Video(
        filename=filename,
        user_id=int(get_jwt_identity()),
        title=title,
        thumbnail=thumbnail_filename,
        is_published=is_published,
        uploaded_at=datetime.utcnow()
    )
    db.session.add(new_video)
    db.session.commit()

    return jsonify({'msg': 'Video uploaded successfully', 'id': new_video.id}), 201

@videos_bp.route('/videos/<int:video_id>', methods=['DELETE'])
@jwt_required()
def delete_video(video_id):
    try:
        video = Video.query.get(video_id)
        current_user_id = int(get_jwt_identity())

        if video.user_id != current_user_id:
            return jsonify({'msg': 'You can only delete your own videos'}), 403

        video_path = os.path.join(Config.UPLOAD_FOLDER, video.filename)
        if os.path.exists(video_path):
            os.remove(video_path)

        if video.thumbnail:
            thumbnail_path = os.path.join(Config.UPLOAD_FOLDER, video.thumbnail)
            if os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)

        Reaction.query.filter_by(video_id=video_id).delete()
        Comment.query.filter_by(video_id=video_id).delete()

        db.session.delete(video)
        db.session.commit()

        return jsonify({'msg': 'Video deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error while deleting video: {str(e)}")
        return jsonify({'msg': f'Error: {str(e)}'}), 500

@videos_bp.route('/videos/<int:video_id>/stream')
def stream_video(video_id):
    video = Video.query.get_or_404(video_id)
    video_path = os.path.join(Config.UPLOAD_FOLDER, video.filename)

    print(f"Streaming video ID {video_id}, path: {video_path}")

    if not os.path.exists(video_path):
        print(f"Video file not found: {video_path}")
        return jsonify({'msg': 'Video file not found'}), 404

    range_header = request.headers.get('Range', None)
    print(f"Range header: {range_header}")

    if not range_header:
        response = send_file(video_path, mimetype='video/mp4')
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Headers'] = 'Range, Authorization'
        return response

    file_size = os.path.getsize(video_path)
    byte_range = range_header.replace('bytes=', '')
    if '-' not in byte_range:
        return jsonify({'msg': 'Invalid Range header'}), 400

    byte1, byte2 = byte_range.split('-')
    byte1 = int(byte1) if byte1 else 0
    byte2 = int(byte2) if byte2 else file_size - 1

    if byte1 >= file_size or byte2 >= file_size:
        return jsonify({'msg': 'Range out of bounds'}), 416

    chunk_size = byte2 - byte1 + 1
    with open(video_path, 'rb') as f:
        f.seek(byte1)
        data = f.read(chunk_size)

    response = make_response(data)
    response.headers['Content-Range'] = f'bytes {byte1}-{byte2}/{file_size}'
    response.headers['Accept-Ranges'] = 'bytes'
    response.headers['Content-Length'] = chunk_size
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Headers'] = 'Range, Authorization'
    response.status_code = 206
    return response

@videos_bp.route('/videos/<int:video_id>/thumbnail', methods=['GET'])
def get_thumbnail(video_id):
    video = Video.query.get_or_404(video_id)
    if not video.thumbnail:
        default_path = os.path.join(current_app.root_path, 'static/default_thumbnail.jpg')
        print(f"Checking default thumbnail at: {default_path}")
        if not os.path.exists(default_path):
            print(f"Default thumbnail not found at: {default_path}")
            return jsonify({'msg': 'Default thumbnail not found'}), 404
        return send_file(default_path, mimetype='image/jpeg')

    thumbnail_path = os.path.join(Config.UPLOAD_FOLDER, video.thumbnail)
    print(f"Checking custom thumbnail at: {thumbnail_path}")
    if not os.path.exists(thumbnail_path):
        print(f"Custom thumbnail not found at: {thumbnail_path}")
        default_path = os.path.join(current_app.root_path, 'static/default_thumbnail.jpg')
        return send_file(default_path, mimetype='image/jpeg')

    return send_file(thumbnail_path, mimetype='image/jpeg')

@videos_bp.route('/videos', methods=['GET'])
def get_videos():
    videos = Video.query.filter_by(is_published=True).all()
    videos_list = []
    for v in videos:
        channel_name = 'Unknown'
        if v.user:
            channel_name = v.user.surname if v.user.surname else v.user.username
        videos_list.append({
            'id': v.id,
            'title': v.title,
            'uploaded_at': v.uploaded_at.isoformat(),
            'channel': channel_name,
            'thumbnail_url': f'/api/videos/{v.id}/thumbnail'
        })
    return jsonify(videos_list), 200

@videos_bp.route('/videos/all', methods=['GET'])
def list_all_videos():
    videos = Video.query.filter_by(is_published=True).all()
    videos_list = []
    for v in videos:
        channel_name = 'Unknown'
        if v.user:
            channel_name = v.user.surname if v.user.surname else v.user.username
        videos_list.append({
            'id': v.id,
            'title': v.title,
            'uploaded_at': v.uploaded_at.isoformat(),
            'channel': channel_name,
            'thumbnail_url': f'/api/videos/{v.id}/thumbnail'
        })
    return jsonify(videos_list), 200

@videos_bp.route('/videos/mine', methods=['GET'])
@jwt_required()
def get_my_videos():
    user_id = int(get_jwt_identity())
    videos = Video.query.filter_by(user_id=user_id).all()
    videos_list = []
    for v in videos:
        videos_list.append({
            'id': v.id,
            'title': v.title,
            'uploaded_at': v.uploaded_at.isoformat(),
            'is_published': v.is_published,
            'thumbnail_url': f'/api/videos/{v.id}/thumbnail'
        })
    return jsonify(videos_list), 200

@videos_bp.route('/videos/<int:video_id>', methods=['GET'])
def get_video(video_id):
    video = Video.query.get_or_404(video_id)
    return jsonify({
        'id': video.id,
        'title': video.title,
        'uploaded_at': video.uploaded_at.isoformat(),
        'is_published': video.is_published,
        'author': video.user.username,
        'video_url': f'/api/videos/{video.id}/stream'
    }), 200

@videos_bp.route('/videos/<int:video_id>/details', methods=['GET'])
def video_details(video_id):
    video = Video.query.get(video_id)
    if not video:
        return jsonify({'msg': 'Видео не найдено'}), 404

    data = {
        'id': video.id,
        'title': video.title,
        'uploaded_at': video.uploaded_at.isoformat(),
        'channel': {
            'id': video.user.id if video.user else None,
            'name': (video.user.surname if video.user and video.user.surname else
                     (video.user.username if video.user else 'Unknown'))
        },
        'video_url': f'/api/videos/{video.id}/stream',
        'thumbnail_url': f'/api/videos/{video.id}/thumbnail'
    }

    likes = Reaction.query.filter_by(video_id=video.id, is_like=True).count()
    dislikes = Reaction.query.filter_by(video_id=video.id, is_like=False).count()
    data['likes'] = likes
    data['dislikes'] = dislikes

    return jsonify(data), 200

@videos_bp.route('/videos/<int:video_id>/react', methods=['POST'])
@jwt_required()
def react_video(video_id):
    user_id = int(get_jwt_identity())
    video = Video.query.get(video_id)
    if not video:
        return jsonify({'msg': 'Видео не найдено'}), 404

    data = request.get_json()
    if not data or 'is_like' not in data:
        return jsonify({'msg': 'Не указан is_like'}), 400

    is_like = bool(data['is_like'])

    reaction = Reaction.query.filter_by(user_id=user_id, video_id=video_id).first()

    if reaction:
        if reaction.is_like == is_like:
            db.session.delete(reaction)
        else:
            reaction.is_like = is_like
    else:
        reaction = Reaction(user_id=user_id, video_id=video_id, is_like=is_like)
        db.session.add(reaction)

    db.session.commit()
    return jsonify({'msg': 'Реакция сохранена'}), 200

@videos_bp.route('/videos/<int:video_id>/myreaction', methods=['GET'])
@jwt_required()
def get_my_reaction(video_id):
    user_id = int(get_jwt_identity())
    reaction = Reaction.query.filter_by(user_id=user_id, video_id=video_id).first()
    if reaction:
        return jsonify({'is_like': reaction.is_like}), 200
    return jsonify({'is_like': None}), 200

@videos_bp.route('/videos/<int:video_id>/comments', methods=['GET'])
def get_comments(video_id):
    comments = Comment.query.filter_by(video_id=video_id).order_by(Comment.created_at.desc()).all()
    comments_list = [{
        'id': c.id,
        'content': c.content,
        'author': c.user.surname if c.user and c.user.surname else (c.user.username if c.user else 'Unknown'),
        'created_at': c.created_at.isoformat()
    } for c in comments]
    return jsonify(comments_list), 200

@videos_bp.route('/videos/<int:video_id>/comments', methods=['POST'])
@jwt_required()
def post_comment(video_id):
    user_id = int(get_jwt_identity())
    video = Video.query.get(video_id)
    if not video:
        return jsonify({'msg': 'Видео не найдено'}), 404

    data = request.get_json()
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'msg': 'Пустой комментарий'}), 400

    comment = Comment(content=content, user_id=user_id, video_id=video_id)
    db.session.add(comment)
    db.session.commit()

    return jsonify({'msg': 'Комментарий добавлен'}), 201

@videos_bp.route('/users/<int:channel_id>/subscribe', methods=['POST'])
@jwt_required()
def subscribe(channel_id):
    user_id = int(get_jwt_identity())
    if user_id == channel_id:
        return jsonify({'msg': 'Нельзя подписаться на себя'}), 400

    subscription = Subscription.query.filter_by(subscriber_id=user_id, channel_id=channel_id).first()
    if subscription:
        db.session.delete(subscription)
        db.session.commit()
        return jsonify({'msg': 'Отписка выполнена', 'subscribed': False}), 200
    else:
        new_sub = Subscription(subscriber_id=user_id, channel_id=channel_id)
        db.session.add(new_sub)
        db.session.commit()
        return jsonify({'msg': 'Подписка выполнена', 'subscribed': True}), 200

@videos_bp.route('/users/<int:channel_id>/is_subscribed', methods=['GET'])
@jwt_required()
def is_subscribed(channel_id):
    user_id = int(get_jwt_identity())
    subscription = Subscription.query.filter_by(subscriber_id=user_id, channel_id=channel_id).first()
    return jsonify({'subscribed': subscription is not None}), 200

@videos_bp.route('/videos/<int:video_id>/publish', methods=['POST'])
@jwt_required()
def toggle_publish(video_id):
    user_id = int(get_jwt_identity())
    video = Video.query.get(video_id)
    if not video:
        return jsonify({'msg': 'Видео не найдено'}), 404
    if video.user_id != user_id:
        return jsonify({'msg': 'Нет прав на изменение видео'}), 403

    data = request.get_json()
    if 'is_published' not in data:
        return jsonify({'msg': 'Не указан параметр is_published'}), 400

    video.is_published = bool(data['is_published'])
    db.session.commit()
    return jsonify({'msg': 'Статус публикации обновлён', 'is_published': video.is_published}), 200

@videos_bp.route('/videos/<int:video_id>/thumbnail', methods=['POST'])
@jwt_required()
def upload_thumbnail(video_id):
    video = Video.query.get_or_404(video_id)
    user_id = int(get_jwt_identity())
    if video.user_id != user_id:
        return jsonify({'msg': 'Нет прав'}), 403

    if 'thumbnail' not in request.files:
        return jsonify({'msg': 'Файл превью не найден'}), 400

    file = request.files['thumbnail']
    if not allowed_file(file.filename):
        return jsonify({'msg': 'Недопустимый формат превью'}), 400

    thumbnail_filename = secure_filename(f"{video.filename}_thumbnail.jpg")
    thumbnail_path = os.path.join(Config.UPLOAD_FOLDER, thumbnail_filename)
    file.save(thumbnail_path)

    video.thumbnail = thumbnail_filename
    db.session.commit()

    return jsonify({'msg': 'Превью обновлено'}), 200