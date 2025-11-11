from django.contrib import admin
from .models import Course, Chapter, Lesson, Enrollment

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "instructor")
    search_fields = ("code", "title", "instructor__username")

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "is_public")
    list_filter = ("is_public", "course")
    search_fields = ("title", "course__code", "course__title")

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "chapter", "order")
    list_filter = ("course", "chapter")
    search_fields = ("title", "course__code", "chapter__title")

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "role", "created_at")
    list_filter = ("role", "course")
    search_fields = ("user__username", "course__code", "course__title")
