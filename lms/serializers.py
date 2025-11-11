from rest_framework import serializers
from .models import Course, Lesson, Enrollment, Chapter


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "course", "chapter", "title", "order", "content"]
        read_only_fields = ["id"]


class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    # --- THIS IS THE FIX ---
    # This tells the serializer that the 'instructor' field
    # will be filled in automatically from the request's user.
    instructor = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )
    # --- END FIX ---

    class Meta:
        model = Course
        fields = ["id", "title", "code", "description", "instructor", "lessons"]
        # 'instructor' is no longer in read_only_fields
        read_only_fields = ["id"]


class EnrollmentSerializer(serializers.ModelSerializer):
    # auto-fill from request.user (no spoofing)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Enrollment
        fields = ["id", "course", "user", "role", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ["id", "course", "title", "description", "is_public", "content"]  # include content
        read_only_fields = ["id"]