from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Project, WorkItem, Comment, Activity
from .serializers import ProjectSerializer, WorkItemSerializer, CommentSerializer, ActivitySerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class WorkItemViewSet(viewsets.ModelViewSet):
    queryset = WorkItem.objects.all().order_by('-created_at')
    serializer_class = WorkItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'project', 'assigned_to']
    search_fields = ['reference_number', 'title', 'description']
    ordering_fields = ['created_at', 'due_date']

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

@api_view(['GET'])
def dashboard_stats(request):
    total = WorkItem.objects.count()
    open_count = WorkItem.objects.filter(status='OPEN').count()
    in_progress_count = WorkItem.objects.filter(status='IN_PROGRESS').count()
    review_count = WorkItem.objects.filter(status='REVIEW').count()
    resolved_count = WorkItem.objects.filter(status='RESOLVED').count()
    closed_count = WorkItem.objects.filter(status='CLOSED').count()
    
    return Response({
        'total': total,
        'open': open_count,
        'in_progress': in_progress_count,
        'review': review_count,
        'resolved': resolved_count,
        'closed': closed_count
    })
