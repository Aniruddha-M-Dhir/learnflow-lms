Learnflow — Minimal LMS (DRF + Next.js)
End-to-end guide for running locally, making a Django superuser, and testing the app as Instructor and Student in separate browsers.
0) Prerequisites
Python 3.11+ (works on 3.12/3.13)
Node.js 18+ (LTS recommended)
npm or pnpm (npm shown below)
Git
1) Clone & open the project
git clone https://github.com/<your-username>/learnflow.git
cd learnflow
If the repo contains a top-level learnflow/ Django project and a frontend/ Next.js app, your tree will look roughly like:
learnflow/
├─ config/                # Django settings (sometimes named `learnflow/config`)
├─ api/                   # Django app(s) for courses, chapters, enrollments, etc.
├─ manage.py
├─ requirements.txt       # if present
└─ frontend/              # Next.js app (pages/app, components, etc.)
2) Backend (Django + DRF)
2.1 Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
2.2 Install dependencies
If requirements.txt exists:
pip install -r requirements.txt
If not, install the essentials (adjust if your project lists more):
pip install django djangorestframework drf-spectacular djangorestframework-simplejwt django-cors-headers
2.3 Environment variables (optional but recommended)
Create .env in the Django config folder or project root if your settings read from env:
DEBUG=True
SECRET_KEY=dev-secret-key-change-me
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000
If you’re not using an .env loader, set these directly in config/settings.py.
2.4 Apply migrations & create a superuser
python manage.py migrate
python manage.py createsuperuser
# follow prompts for email/username/password
2.5 (Important) Create the instructors group
Your permissions likely check for either user.is_staff OR membership in the instructors group.
Option A — Mark your superuser/staff as an instructor (easiest)
Superuser already has all perms. You can use it as an instructor immediately.
Or create a separate non-superuser admin:
python manage.py createsuperuser --username instructor --email instructor@example.com
# Then in Django Admin (see below), add this user to group "instructors" or set is_staff=True
Option B — Create the group in the admin
Start the server:
python manage.py runserver
Go to http://127.0.0.1:8000/admin/
Log in with your superuser.
Groups → Add Group → name = instructors → Save.
Open Users → <instructor user> → Groups → add “instructors” → Save.
Many views in this LMS use a permission helper like is_instructor_user(user) which returns True if user.is_staff or user is in group instructors. So either way works.
2.6 Run the backend
python manage.py runserver
Common API endpoints (your project may differ slightly):
Auth (JWT, SimpleJWT)
POST /api/token/ ⇒ { "username": "...", "password": "..." }
POST /api/token/refresh/ ⇒ { "refresh": "<token>" }
Schema / Docs (drf-spectacular)
GET /api/schema/
GET /api/docs/ (Swagger UI)
GET /api/redoc/
Core resources
GET /api/courses/
GET /api/chapters/ (chapters have is_public: true|false)
POST /api/enroll/ (if provided by your API)
etc.
Example: get tokens (terminal)
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"instructor","password":"<your-pass>"}'
Copy the access token from the response. Then call protected endpoints:
curl http://127.0.0.1:8000/api/courses/ \
  -H "Authorization: Bearer <access>"
3) Frontend (Next.js)
Open a second terminal at the project root:
cd frontend
npm install
npm run dev
The app should be available at http://localhost:3000.
If the frontend expects NEXT_PUBLIC_API_URL, create frontend/.env.local:
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
Restart npm run dev after adding envs.
4) Test as Instructor and Student (two browsers)
You’ll simulate two different users at the same time using two separate browser profiles:
Browser A (e.g., Chrome normal window) → Instructor
Browser B (e.g., Chrome Incognito / Firefox / another Chrome profile) → Student
4.1 Instructor flow (Browser A)
Log in as your superuser or the instructor account you created.
In the frontend (or via the API), create a Course.
Create Chapters inside that course:
Mark some chapters is_public = true (students can read).
Leave some is_public = false (private to instructor or restricted).
(If available) Create Lessons within chapters.
If you’re testing purely via API first, you can use /api/docs (Swagger) to make POST requests:
POST /api/courses/
POST /api/chapters/ with { "course": <course_id>, "title": "...", "is_public": true }, etc.
4.2 Student flow (Browser B)
Open the site in a separate browser profile (or Incognito) so cookies/sessions don’t mix.
Create a new user (sign up page) or use API:
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"studentpass"}'
(Adjust to your project’s user-registration route; if there is no open registration endpoint, create from the Django admin.)
Login as student1.
Go to Courses list:
You should see public courses (if your API lists them).
Join/enroll if the UI/API requires enrollment.
Open Chapters:
Public chapters should be readable.
Private chapters should be hidden or blocked with a 403/404, depending on the design.
Keep the two profiles open side-by-side so you can confirm permission behavior live.
5) Role rules (what to expect)
Instructor (is_staff or in “instructors” group):
Can create/update/delete their own courses/chapters.
Can mark chapters public/private.
Can see all chapters in their course.
Student (regular user):
Can view course list and read only public chapters.
Can enroll (if that endpoint/UI exists).
Cannot create or edit courses/chapters.
Many views are protected by DRF permissions similar to:
ReadOnlyOrInstructor — everyone authenticated can read; only instructors can write.
IsOwnerInstructor — instructors can modify only objects they own.
6) Useful admin checks
Users: set is_staff=True for instructor-like accounts (or add to instructors group).
Groups: ensure instructors exists and has the right members.
Troubleshooting auth: if an endpoint returns 401, confirm you’re sending Authorization: Bearer <access> or you’re logged in via session where applicable.
7) Common issues & fixes
Q: CommandError: You must set settings.ALLOWED_HOSTS if DEBUG is False.
A: In config/settings.py, set:
DEBUG = True  # for local dev
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
Q: CORS errors from the frontend
A: Add django-cors-headers, and in settings:
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", *MIDDLEWARE]
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
Q: “No active account found with the given credentials” on /api/token/
A: Make sure the user exists and is active. If you recently created a user in admin, verify the password and try again.
Q: 403 when creating a course as instructor
A: Ensure the login account is is_staff or in the instructors group. If your API applies owner checks, confirm you’re authenticated as the owner.
Q: Trailing slash / 301 loops
A: DRF typically expects trailing slashes. Keep to the URL shapes shown in Swagger (/api/.../). Or set APPEND_SLASH=False consistently (both backend and frontend must match routes).
Q: Fresh DB / want to reset
A:
rm db.sqlite3  # if using sqlite
python manage.py migrate
python manage.py createsuperuser
8) Quick testing script (optional)
Use these steps to seed a minimal scenario quickly (run while backend is up):
# 1) Create instructor token
INSTR_TKN=$(curl -s -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"instructor","password":"<pass>"}' | python -c "import sys, json; print(json.load(sys.stdin)['access'])")

# 2) Create a course as instructor
COURSE_ID=$(curl -s -X POST http://127.0.0.1:8000/api/courses/ \
  -H "Authorization: Bearer $INSTR_TKN" -H "Content-Type: application/json" \
  -d '{"title":"Intro to AI Agents","code":"AGENT101","description":"Build simple agents"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['id'])")

# 3) Add one public and one private chapter
curl -s -X POST http://127.0.0.1:8000/api/chapters/ \
  -H "Authorization: Bearer $INSTR_TKN" -H "Content-Type: application/json" \
  -d "{\"course\":$COURSE_ID,\"title\":\"Ch 1 — Public\",\"is_public\":true}"

curl -s -X POST http://127.0.0.1:8000/api/chapters/ \
  -H "Authorization: Bearer $INSTR_TKN" -H "Content-Type: application/json" \
  -d "{\"course\":$COURSE_ID,\"title\":\"Ch 2 — Private\",\"is_public\":false}"

# 4) Create a student and fetch tokens
# (If your project doesn't expose open registration, create the student in Django admin instead.)
STUDENT_TKN=$(curl -s -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"studentpass"}' | python -c "import sys, json; print(json.load(sys.stdin)['access'])" || true)

# 5) As student, list chapters for the course (you should only see the public one)
curl -s http://127.0.0.1:8000/api/chapters/?course=$COURSE_ID \
  -H "Authorization: Bearer $STUDENT_TKN"
9) Where to make changes
Permissions: api/permissions.py (e.g., ReadOnlyOrInstructor, IsOwnerInstructor, is_instructor_user).
ViewSets & URLs: api/views.py, config/urls.py.
Models/Serializers: api/models.py, api/serializers.py.
Frontend API client: frontend/src/lib/api.ts (or wherever your fetch wrappers live).
Frontend pages: frontend/src/app or frontend/pages depending on your Next.js routing.
10) Production notes (later)
Set DEBUG=False, provide SECRET_KEY, and set ALLOWED_HOSTS correctly.
Configure CORS for your deployed frontend URL.
Use a real database (PostgreSQL) and environment variables.
11) FAQ
Can I use one browser with two tabs?
Use separate profiles or Incognito for the second user; otherwise sessions collide.
Do I need to create the “instructors” group?
Only if your permission logic relies on it. Marking a user is_staff=True also counts as instructor in this project.
How do students see only public content?
Chapters set with is_public=false should be hidden/blocked for non-instructors by the API and/or filtered on the UI.
