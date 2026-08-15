from django.contrib.auth.models import User
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# pyrefly: ignore [missing-import]
from .models import Project, WorkItem, Comment, Activity
from .serializers import (
    ProjectSerializer,
    WorkItemListSerializer,
    WorkItemDetailSerializer,
    CommentSerializer,
    ActivitySerializer,
)
from .services import record_activity


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]


class WorkItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for WorkItems.
    - List uses WorkItemListSerializer (lightweight).
    - Retrieve/Create/Update uses WorkItemDetailSerializer (full).
    - Supports filtering by status, priority, project, assignee.
    - Supports search on title and description.
    - Supports ordering on created_at, updated_at, due_date, priority.
    """
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'reference_number']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = WorkItem.objects.select_related(
            'project', 'assigned_to', 'reported_by'
        ).prefetch_related('comments', 'activities')

        # Manual filtering — status, priority, project, assigned_to
        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')
        project_param = self.request.query_params.get('project')
        assigned_to_param = self.request.query_params.get('assigned_to')

        if status_param:
            qs = qs.filter(status=status_param)
        if priority_param:
            qs = qs.filter(priority=priority_param)
        if project_param:
            qs = qs.filter(project_id=project_param)
        if assigned_to_param:
            qs = qs.filter(assigned_to_id=assigned_to_param)

        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkItemListSerializer
        return WorkItemDetailSerializer

    def perform_create(self, serializer):
        """Record creation activity after saving."""
        instance = serializer.save()
        record_activity(instance, 'CREATED')

    def perform_update(self, serializer):
        """Diff and record changed fields as activity entries before saving."""
        old = self.get_object()
        tracked_fields = ['status', 'assigned_to', 'priority']
        old_values = {f: str(getattr(old, f) or '') for f in tracked_fields}

        instance = serializer.save()

        for field in tracked_fields:
            new_val = str(getattr(instance, field) or '')
            if old_values[field] != new_val:
                record_activity(
                    instance,
                    activity_type='UPDATED',
                    field_changed=field,
                    old_value=old_values[field],
                    new_value=new_val,
                )

    @action(detail=True, methods=['get'], url_path='comments')
    def comments(self, request, pk=None):
        """GET /api/work-items/{id}/comments/"""
        work_item = self.get_object()
        comments = work_item.comments.select_related('author').order_by('created_at')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='comments/add')
    def add_comment(self, request, pk=None):
        """POST /api/work-items/{id}/comments/add/"""
        work_item = self.get_object()
        serializer = CommentSerializer(data={**request.data, 'work_item': work_item.pk})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        record_activity(
            work_item,
            activity_type='COMMENTED',
            new_value=comment.message,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='activity')
    def activity(self, request, pk=None):
        """GET /api/work-items/{id}/activity/ — chronological order (Rule 8)"""
        work_item = self.get_object()
        activities = work_item.activities.order_by('timestamp')
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related('author', 'work_item').order_by('created_at')
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """Activity log is read-only — only the backend writes to it."""
    queryset = Activity.objects.select_related('work_item').order_by('timestamp')
    serializer_class = ActivitySerializer
    permission_classes = [AllowAny]


class DashboardView(viewsets.ViewSet):
    """
    Provides backend-aggregated dashboard totals (DOMAIN_RULES Rule 10).
    The frontend must not compute these by downloading all items.
    """
    permission_classes = [AllowAny]

    def list(self, request):
        from django.utils import timezone
        from django.db.models import Count, Q

        today = timezone.now().date()
        active_statuses = ('OPEN', 'IN_PROGRESS', 'REVIEW')

        totals = WorkItem.objects.aggregate(
            total=Count('id'),
            open=Count('id', filter=Q(status='OPEN')),
            in_progress=Count('id', filter=Q(status='IN_PROGRESS')),
            review=Count('id', filter=Q(status='REVIEW')),
            resolved=Count('id', filter=Q(status='RESOLVED')),
            closed=Count('id', filter=Q(status='CLOSED')),
            overdue=Count('id', filter=Q(
                due_date__lt=today,
                status__in=active_statuses
            )),
        )

        return Response(totals)
