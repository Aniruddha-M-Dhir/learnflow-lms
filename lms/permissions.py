from rest_framework.permissions import BasePermission, SAFE_METHODS

def is_instructor_user(user):
    return (
        getattr(user, "is_staff", False)
        or user.groups.filter(name="instructors").exists()
    )

class IsInstructor(BasePermission):
    """Allow only instructors (is_staff or in 'instructors' group)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and is_instructor_user(request.user)

class ReadOnlyOrInstructor(BasePermission):
    """Read for everyone authenticated; write only for instructors."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and is_instructor_user(request.user)

class IsOwnerInstructor(BasePermission):
    """
    Object-level: only the instructor who owns the object may modify it.
    Assumes the object has 'instructor' FK (Course) or relates to Course.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # obj may be Course or Lesson; both should resolve to a Course with .instructor
        course = getattr(obj, "course", obj)  # Lesson -> course, Course -> itself
        return request.user.is_authenticated and course.instructor_id == request.user.id
