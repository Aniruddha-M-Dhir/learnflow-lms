# Learnflow — Minimal LMS (Django REST Framework + Next.js)

This is a simple Learning Management System (LMS) that lets **instructors** create courses and **students** view and enroll in them.  
Built with **Django Rest Framework** (backend) and **Next.js** (frontend).

---

## 🚀 Features

- Instructor can create & manage courses and chapters.
- Chapters can be marked **public** or **private**.
- Students can browse and join courses.
- Authentication via JWT (using `djangorestframework-simplejwt`).
- Auto-generated API docs via `drf-spectacular`.

---

## 🧱 Tech Stack

- **Backend:** Django + Django REST Framework
- **Frontend:** Next.js (React + Tailwind)
- **Auth:** JWT (SimpleJWT)
- **Docs:** Swagger / Redoc (drf-spectacular)

---

## ⚙️ Prerequisites

Before starting, ensure you have:

- Python 3.11+  
- Node.js 18+  
- npm or pnpm  
- Git

---

## 🏁 Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/<your-username>/learnflow.git
cd learnflow
2️⃣ Backend Setup (Django + DRF)
Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
Install dependencies
pip install -r requirements.txt
If there's no requirements.txt, install core packages manually:
pip install django djangorestframework drf-spectacular djangorestframework-simplejwt django-cors-headers
Run initial migrations
python manage.py migrate
Create a superuser (for Instructor/Admin)
python manage.py createsuperuser
# Follow the prompts to enter username, email, and password
Run the backend server
python manage.py runserver
Now visit http://127.0.0.1:8000/admin/
Login with your superuser credentials.
3️⃣ Set up Instructor Access
Permissions are controlled by a helper function like:
def is_instructor_user(user):
    return user.is_staff or user.groups.filter(name="instructors").exists()
So you can either:
Mark your user as staff (is_staff=True), OR
Create a group called instructors and add your user to it in the Django admin.
Steps:
Go to Admin → Groups → Add Group → “instructors”.
Go to Admin → Users → your user → Groups → Add “instructors”.
Save.
Now your user acts as an instructor.
4️⃣ Frontend Setup (Next.js)
Open another terminal in the project root:
cd frontend
npm install
npm run dev
The frontend runs at http://localhost:3000
If your frontend uses environment variables, create .env.local inside /frontend:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
Restart npm run dev if you add new env variables.
👩‍🏫 Testing Instructor and Student Roles
To test roles, open two different browsers or profiles:
Role	Browser Example	Account	Description
Instructor	Chrome (normal window)	Superuser or instructor	Can create & manage courses
Student	Chrome Incognito or Firefox	New user	Can view & enroll in courses
🔹 Instructor Flow (Browser A)
Log in as your superuser/instructor.
Create a Course.
Add Chapters inside that course.
Mark some chapters as is_public = true and others as is_public = false.
Example API call (with JWT token):
curl -X POST http://127.0.0.1:8000/api/courses/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Intro to AI", "code": "AI101", "description": "Learn basic AI concepts."}'
🔹 Student Flow (Browser B)
Open a new browser profile or Incognito window.
Register a new user (via frontend signup or admin panel).
Log in as student1.
Browse courses.
View public chapters only — private ones will be restricted.
🔐 API Endpoints Overview
Endpoint	Method	Description
/api/token/	POST	Obtain JWT access/refresh token
/api/token/refresh/	POST	Refresh access token
/api/courses/	GET/POST	List or create courses
/api/chapters/	GET/POST	List or create chapters
/api/docs/	GET	Swagger documentation
/api/redoc/	GET	ReDoc API docs
Example token request:
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "instructor", "password": "admin123"}'
🧠 Common Issues
❌ CommandError: You must set settings.ALLOWED_HOSTS if DEBUG is False
Set in config/settings.py:
DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
❌ CORS Error (Frontend → Backend)
Add this to settings:
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", *MIDDLEWARE]
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
❌ No active account found with the given credentials
Make sure your user exists, is active, and the password is correct.
❌ 403 on Course Creation
Ensure you’re logged in as an Instructor (is_staff=True or in group instructors).
🧩 Permissions Summary
Role	Can Read	Can Create/Edit/Delete
Instructor	✅	✅ (own courses only)
Student	✅ (public only)	❌
Permission classes used (in permissions.py):
ReadOnlyOrInstructor     # Anyone authenticated can read, only instructors can write
IsOwnerInstructor        # Instructors can modify only their own courses
🧰 Quick Reset (if DB is corrupted)
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
🧪 Quick Test Script
# Get instructor token
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"instructor","password":"admin123"}' | python -c "import sys, json; print(json.load(sys.stdin)['access'])")

# Create a course
COURSE_ID=$(curl -s -X POST http://127.0.0.1:8000/api/courses/ \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Intro to AI Agents","code":"AGENT101","description":"Learn agent fundamentals"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['id'])")

# Create a public chapter
curl -X POST http://127.0.0.1:8000/api/chapters/ \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"course\":$COURSE_ID,\"title\":\"Chapter 1 — Public\",\"is_public\":true}"

# Create a private chapter
curl -X POST http://127.0.0.1:8000/api/chapters/ \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"course\":$COURSE_ID,\"title\":\"Chapter 2 — Private\",\"is_public\":false}"
🏗 Folder Overview
learnflow/
├── config/                # Django settings
├── api/                   # Course, Chapter, Lesson, Enrollment APIs
├── manage.py
├── db.sqlite3             # Local DB
└── frontend/              # Next.js app
📘 Docs Access
Swagger UI → http://127.0.0.1:8000/api/docs/
ReDoc → http://127.0.0.1:8000/api/redoc/
✅ Summary
Step	Action
1	Clone repo
2	Set up backend (migrate + superuser)
3	Create “instructors” group
4	Run backend (python manage.py runserver)
5	Run frontend (npm run dev)
6	Test Instructor (normal browser)
7	Test Student (incognito)
🧑‍💻 Author
Aniruddha M. Dhir
Software Developer Intern Project — Learnflow (LMS)
Built with ❤️ using Django + Next.js
