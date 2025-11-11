# lms/pagination.py
from rest_framework.pagination import PageNumberPagination

class DefaultPagination(PageNumberPagination):
    page_size = 10                    # default per-page
    page_size_query_param = "page_size"  # lets you do ?page_size=25
    max_page_size = 100               # safety cap
