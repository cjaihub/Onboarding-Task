from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, WorkItemViewSet, CommentViewSet, ActivityViewSet, 
    UserViewSet, dashboard_stats, metadata, WorkflowViewSet, 
    WorkflowExecutionViewSet, WorkflowExecutionStepViewSet,
    ProjectAttachmentViewSet, ProjectCommentViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'work-items', WorkItemViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'users', UserViewSet)
router.register(r'workflows', WorkflowViewSet)
router.register(r'workflow-executions', WorkflowExecutionViewSet)
router.register(r'workflow-execution-steps', WorkflowExecutionStepViewSet)
router.register(r'project-attachments', ProjectAttachmentViewSet)
router.register(r'project-comments', ProjectCommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_stats, name='dashboard-stats'),
    path('metadata/', metadata, name='metadata'),
]
