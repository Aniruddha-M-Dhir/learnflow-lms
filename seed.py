import django
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from lms.models import Course, Lesson, Enrollment

User = get_user_model()

# Get your admin user
admin_user = User.objects.first()

# Create a sample course
course, created = Course.objects.get_or_create(
    code="CS101",
    defaults={
        "title": "Introduction to Programming",
        "description": "A beginner-friendly course covering programming fundamentals.",
        "instructor": admin_user,
    },
)

# Create some lessons
Lesson.objects.get_or_create(
    course=course, order=1, title="Lesson 1: Variables and Data Types",
    defaults={"content": "Learn about variables, types, and basic syntax."}
)
Lesson.objects.get_or_create(
    course=course, order=2, title="Lesson 2: Control Flow",
    defaults={"content": "If statements, loops, and logical conditions."}
)
Lesson.objects.get_or_create(
    course=course, order=3, title="Lesson 3: Functions",
    defaults={"content": "Defining and using functions effectively."}
)

# Enroll the admin as a student (for demo)
Enrollment.objects.get_or_create(course=course, user=admin_user)

print("✅ Seed data created successfully!")
