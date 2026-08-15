from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    WorkItemViewSet,
    CommentViewSet,
    ActivityViewSet,
    DashboardView,
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'work-items', WorkItemViewSet, basename='workitem')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'dashboard', DashboardView, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
