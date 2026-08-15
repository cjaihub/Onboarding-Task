from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, WorkItemViewSet, CommentViewSet, ActivityViewSet, dashboard_stats

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'work-items', WorkItemViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'activities', ActivityViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_stats, name='dashboard-stats'),
]
