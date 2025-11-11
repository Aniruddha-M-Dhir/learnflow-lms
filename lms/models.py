from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Course(models.Model):
    title = models.CharField(max_length=200)
    code = models.CharField(max_length=32, unique=True)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="courses")

    def __str__(self):
        return f"{self.code} — {self.title}"


class Chapter(models.Model):
    """
    A chapter belongs to a course, can be public/private, and stores rich content
    (HTML/JSON from Plate.js) in the `content` field.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="chapters")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    content = models.TextField(blank=True)  # <-- Plate.js content goes here (HTML or JSON)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.course.code}: {self.title}"


class Lesson(models.Model):
    """
    Lessons inherit visibility from their parent chapter (handled in the viewset).
    """
    chapter = models.ForeignKey("Chapter", on_delete=models.CASCADE, related_name="lessons")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=1)
    content = models.TextField(blank=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.course.code}: {self.title}"


class Enrollment(models.Model):
    STUDENT = "student"
    ROLES = [(STUDENT, "Student")]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="enrollments")
    role = models.CharField(max_length=16, choices=ROLES, default=STUDENT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("course", "user")

    def __str__(self):
        return f"{self.user} in {self.course.code}"
