# PVK Project

Веб-сервис для проведения оценки профессионально-важных качеств стажёров во время проектной работы.

## Требования

- Python 3.8+
- Node.js 14+
- npm или yarn

## Установка и запуск

### Backend (Django)

1. Перейдите в папку backend:
```bash
cd backend
```

2. Создайте и активируйте виртуальное окружение:
```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate
```

3. Установите зависимости (если нужно):
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
```

4. Примените миграции:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Запустите сервер:
```bash
python manage.py runserver
```

Backend будет доступен на `http://localhost:8000`

### Frontend (React)

1. Перейдите в папку frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите приложение:
```bash
npm start
```

Frontend будет доступен на `http://localhost:3000`

## Технологии

- **Backend**: Django, Django REST Framework, JWT
- **Frontend**: React, React Router, Axios
- **База данных**: SQLite