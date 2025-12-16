from flask import Flask, request, jsonify, session
from flask_cors import CORS
import json
import os
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'  # Измените на более безопасный ключ
CORS(app, supports_credentials=True)  # Разрешаем CORS для запросов с фронтенда

# Папка для хранения регистраций
REGISTRATIONS_DIR = os.path.join(os.path.dirname(__file__), 'registrations')
# Путь к корню проекта (на уровень выше папки api)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Создаем папку, если её нет
if not os.path.exists(REGISTRATIONS_DIR):
    os.makedirs(REGISTRATIONS_DIR)

# Учетные данные админа (в продакшене лучше использовать базу данных)
ADMIN_CREDENTIALS = {
    'username': 'admin',
    'password': 'admin123'  # Измените пароль на более безопасный
}

# Декоратор для проверки аутентификации
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session or not session['admin_logged_in']:
            return jsonify({"error": "Требуется аутентификация"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route("/")
def hello():
    return "Привет, Flask!"

@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        
        # Валидация данных
        required_fields = ['fullName', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Поле {field} обязательно для заполнения"}), 400
        
        # Добавляем timestamp
        data['registeredAt'] = datetime.now().isoformat()
        
        # Если email админский, автоматически устанавливаем флаг админа
        if data.get('email', '').strip().lower() == 'admin@admin.com':
            data['isAdmin'] = True
        
        # Генерируем имя файла с timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"registration_{timestamp}.json"
        filepath = os.path.join(REGISTRATIONS_DIR, filename)
        
        # Сохраняем в файл
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            "success": True,
            "message": "Регистрация успешно сохранена",
            "filename": filename
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Аутентификация админа (для админ-панели)
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if username == ADMIN_CREDENTIALS['username'] and password == ADMIN_CREDENTIALS['password']:
            session['admin_logged_in'] = True
            session['admin_username'] = username
            return jsonify({"success": True, "message": "Успешный вход"}), 200
        else:
            return jsonify({"error": "Неверные учетные данные"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Вход пользователя (через email и пароль из регистраций)
@app.route("/api/user-login", methods=["POST"])
def user_login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email и пароль обязательны"}), 400
        
        # Проверяем стандартные данные админа (можно войти через email admin@admin.com)
        admin_email = 'admin@admin.com'
        if email == 'admin' or email == admin_email:
            if password == ADMIN_CREDENTIALS['password']:
                session['admin_logged_in'] = True
                session['admin_username'] = 'admin'
                session['user_email'] = email
                return jsonify({
                    "success": True, 
                    "isAdmin": True,
                    "message": "Вход выполнен",
                    "fullName": "Администратор"
                }), 200
        
        # Ищем пользователя в файлах регистраций
        if os.path.exists(REGISTRATIONS_DIR):
            for filename in os.listdir(REGISTRATIONS_DIR):
                if filename.startswith('registration_') and filename.endswith('.json'):
                    filepath = os.path.join(REGISTRATIONS_DIR, filename)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            user_data = json.load(f)
                            
                            user_email = user_data.get('email', '').strip().lower()
                            user_password = user_data.get('password', '')
                            
                            # Проверяем совпадение email и пароля
                            if user_email == email and user_password == password:
                                # Устанавливаем сессию пользователя
                                session['user_logged_in'] = True
                                session['user_email'] = email
                                session['user_name'] = user_data.get('fullName', '')
                                
                                # Проверяем, является ли пользователь админом
                                # Админ определяется по полю isAdmin в данных или по специальному email
                                is_admin = user_data.get('isAdmin', False) or email == admin_email
                                
                                # Также можно использовать специальный email для админа
                                # или проверить по другим критериям
                                
                                if is_admin:
                                    session['admin_logged_in'] = True
                                    session['admin_username'] = email
                                
                                return jsonify({
                                    "success": True,
                                    "isAdmin": is_admin,
                                    "message": "Вход выполнен",
                                    "fullName": user_data.get('fullName', email)
                                }), 200
                    except Exception as e:
                        continue  # Пропускаем поврежденные файлы
        
        return jsonify({"error": "Неверный email или пароль"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    return jsonify({"success": True, "message": "Выход выполнен"}), 200

@app.route("/api/check-auth", methods=["GET"])
def check_auth():
    if 'admin_logged_in' in session and session['admin_logged_in']:
        return jsonify({"authenticated": True, "username": session.get('admin_username')}), 200
    return jsonify({"authenticated": False}), 200

# Работа с событиями
@app.route("/api/events", methods=["GET"])
@login_required
def get_events():
    try:
        events_path = os.path.join(PROJECT_ROOT, 'events.json')
        with open(events_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/events", methods=["POST"])
@login_required
def save_events():
    try:
        data = request.get_json()
        events_path = os.path.join(PROJECT_ROOT, 'events.json')
        
        # Создаем резервную копию
        backup_path = events_path + '.backup'
        if os.path.exists(events_path):
            import shutil
            shutil.copy2(events_path, backup_path)
        
        with open(events_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return jsonify({"success": True, "message": "События успешно сохранены"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Работа со статьями
@app.route("/api/articles", methods=["GET"])
@login_required
def get_articles():
    try:
        articles_path = os.path.join(PROJECT_ROOT, 'articles.json')
        with open(articles_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/articles", methods=["POST"])
@login_required
def save_articles():
    try:
        data = request.get_json()
        articles_path = os.path.join(PROJECT_ROOT, 'articles.json')
        
        # Создаем резервную копию
        backup_path = articles_path + '.backup'
        if os.path.exists(articles_path):
            import shutil
            shutil.copy2(articles_path, backup_path)
        
        with open(articles_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return jsonify({"success": True, "message": "Статьи успешно сохранены"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
