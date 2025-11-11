from django.urls import path, include
from rest_framework.routers import DefaultRouter
from lms import views  # import all views

# Register viewsets for standard endpoints
router = DefaultRouter()
router.register(r"courses", views.CourseViewSet, basename="course")
router.register(r"chapters", views.ChapterViewSet, basename="chapter")
router.register(r"lessons", views.LessonViewSet, basename="lesson")
router.register(r"enrollments", views.EnrollmentViewSet, basename="enrollment")

# Define URL patterns
urlpatterns = [
    # User info endpoint (used by frontend after login)
    path("me/", views.me, name="me"),
    
    # Include all router-generated routes
    path("", include(router.urls)),
]
