from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Course, Chapter, Lesson, Enrollment
from .serializers import (
    CourseSerializer,
    ChapterSerializer,
    LessonSerializer,
    EnrollmentSerializer,
)
from .permissions import ReadOnlyOrInstructor, IsOwnerInstructor, is_instructor_user


# ----------------------------
# Courses
# ----------------------------
class CourseViewSet(viewsets.ModelViewSet):
    """
    Read for any authenticated user.
    Create/Update/Delete only for instructors (is_staff or in 'instructors' group).
    Instructors may only modify their own courses.
    """
    queryset = Course.objects.all().order_by("id")
    serializer_class = CourseSerializer
    permission_classes = [ReadOnlyOrInstructor, IsOwnerInstructor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "title", "description", "instructor__username"]
    ordering_fields = ["id", "code", "title"]

    def perform_create(self, serializer):
        if not is_instructor_user(self.request.user):
            raise PermissionDenied("Only instructors can create courses.")
        serializer.save(instructor=self.request.user)


# ----------------------------
# Chapters (public/private + rich content)
# ----------------------------
class ChapterViewSet(viewsets.ModelViewSet):
    """
    Instructors see all chapters.
    Non-instructors only see public chapters.
    Create/Update/Delete only for instructors (via ReadOnlyOrInstructor).
    """
    queryset = Chapter.objects.all().order_by("id")
    serializer_class = ChapterSerializer
    permission_classes = [ReadOnlyOrInstructor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "course__code", "course__title"]
    ordering_fields = ["id", "title"]

    def get_queryset(self):
        user = self.request.user
        if is_instructor_user(user):
            return Chapter.objects.all().order_by("id")
        return Chapter.objects.filter(is_public=True).order_by("id")


# ----------------------------
# Lessons (inherit chapter visibility)
# ----------------------------
class LessonViewSet(viewsets.ModelViewSet):
    """
    Instructors see all lessons.
    Students only see lessons where the parent chapter is public.
    Only the course's instructor can create/update/delete lessons,
    and the selected chapter must belong to the same course.
    """
    queryset = Lesson.objects.select_related("course", "chapter").order_by("id")
    serializer_class = LessonSerializer
    permission_classes = [ReadOnlyOrInstructor, IsOwnerInstructor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "course__code", "course__title", "chapter__title"]
    ordering_fields = ["id", "order", "title"]

    def get_queryset(self):
        user = self.request.user
        if is_instructor_user(user):
            # Instructors see everything
            return Lesson.objects.select_related("course", "chapter").order_by("id")
        # Students/any authenticated: only lessons from public chapters
        return Lesson.objects.select_related("course", "chapter").filter(
            chapter__is_public=True
        ).order_by("id")

    def _assert_owns_course(self, course):
        if course.instructor_id != self.request.user.id:
            raise PermissionDenied("Only the course instructor can modify lessons for this course.")

    def _assert_chapter_matches_course(self, chapter, course):
        if chapter.course_id != course.id:
            raise PermissionDenied("Chapter does not belong to the specified course.")

    def perform_create(self, serializer):
        chapter = serializer.validated_data["chapter"]
        course = serializer.validated_data["course"]
        self._assert_owns_course(course)
        self._assert_chapter_matches_course(chapter, course)
        serializer.save()

    def perform_update(self, serializer):
        existing_course = serializer.instance.course
        self._assert_owns_course(existing_course)
        new_course = serializer.validated_data.get("course", existing_course)
        new_chapter = serializer.validated_data.get("chapter", serializer.instance.chapter)
        self._assert_chapter_matches_course(new_chapter, new_course)
        serializer.save()

    def perform_destroy(self, instance):
        self._assert_owns_course(instance.course)
        return super().perform_destroy(instance)


# ----------------------------
# Enrollments
# ----------------------------
class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    Users only see/manage their own enrollments.
    """
    queryset = Enrollment.objects.all().order_by("id")
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["course__code", "course__title", "role", "user__username"]
    ordering_fields = ["id", "created_at"]

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        # Force enrollment to the current user (no spoofing)
        serializer.save(user=self.request.user)


# ----------------------------
# User profile endpoint (/api/me/)
# ----------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    role = "instructor" if is_instructor_user(user) else "student"
    return Response({
        "id": user.id,
        "username": user.username,
        "role": role,
    })
