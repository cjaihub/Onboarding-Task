from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from django.db import models

from django.contrib.auth.models import User
from .models import Project, WorkItem, Comment, Activity, Workflow, WorkflowExecution, WorkflowExecutionStep, ProjectAttachment, ProjectComment
from .services import record_activity
from .serializers import (
    ProjectSerializer, WorkItemSerializer, CommentSerializer, 
    ActivitySerializer, UserSerializer, WorkflowSerializer,
    WorkflowExecutionSerializer, WorkflowExecutionStepSerializer,
    ProjectAttachmentSerializer, ProjectCommentSerializer
)

from rest_framework.exceptions import PermissionDenied

class ProjectAttachmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectAttachment.objects.all()
    serializer_class = ProjectAttachmentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project']

    def perform_create(self, serializer):
        project = serializer.validated_data.get('project')
        if project and not project.members.filter(id=self.request.user.id).exists():
            raise PermissionDenied("You must be a member of this project to upload attachments.")
        serializer.save(uploaded_by=self.request.user)

class ProjectCommentViewSet(viewsets.ModelViewSet):
    queryset = ProjectComment.objects.all().order_by('-created_at')
    serializer_class = ProjectCommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project']

    def perform_create(self, serializer):
        # Allow any authenticated user to comment on team projects
        serializer.save(author=self.request.user)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['project_type', 'status']
    search_fields = ['name', 'description']

    def perform_create(self, serializer):
        project = serializer.save()
        if self.request.user.is_authenticated:
            project.members.add(self.request.user)
            record_activity(project=project, activity_type='CREATED', user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            project.members.add(user)
            return Response(ProjectSerializer(project, context={'request': request}).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
            project.members.remove(user)
            return Response(ProjectSerializer(project, context={'request': request}).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class WorkItemFilter(django_filters.FilterSet):
    tags = django_filters.CharFilter(method='filter_tags')

    class Meta:
        model = WorkItem
        fields = ['status', 'priority', 'project', 'assigned_to', 'category']

    def filter_tags(self, queryset, name, value):
        if value:
            tags_list = [t.strip() for t in value.split(',')]
            for tag in tags_list:
                queryset = queryset.filter(tags__icontains=tag)
        return queryset

class WorkItemViewSet(viewsets.ModelViewSet):
    queryset = WorkItem.objects.all().order_by('-created_at')
    serializer_class = WorkItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = WorkItemFilter
    search_fields = ['reference_number', 'title', 'description']
    ordering_fields = ['created_at', 'due_date', 'updated_at', 'priority']

    def perform_create(self, serializer):
        work_item = serializer.save()
        if work_item.assigned_to:
            from collaboration.models import Notification
            Notification.objects.create(
                actor=self.request.user if self.request.user.is_authenticated else None,
                recipient=work_item.assigned_to,
                project=work_item.project,
                work_item=work_item,
                message=f"You have been assigned a new task: {work_item.title}"
            )

    def perform_update(self, serializer):
        old_assigned_to = self.get_object().assigned_to
        work_item = serializer.save()
        if work_item.assigned_to and work_item.assigned_to != old_assigned_to:
            from collaboration.models import Notification
            Notification.objects.create(
                actor=self.request.user if self.request.user.is_authenticated else None,
                recipient=work_item.assigned_to,
                project=work_item.project,
                work_item=work_item,
                message=f"You have been assigned to task: {work_item.title}"
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def transition(self, request, pk=None):
        work_item = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({'status': 'Status is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from .services import transition_work_item
            transition_work_item(work_item, new_status, request.user)
            
            serializer = self.get_serializer(work_item)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'status': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def assign(self, request, pk=None):
        work_item = self.get_object()
        user_id = request.data.get('assigned_to')
        
        if not user_id:
            return Response({'error': 'assigned_to is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(id=user_id)
            old_assigned_to = work_item.assigned_to
            work_item.assigned_to = user
            work_item.save(update_fields=['assigned_to', 'updated_at'])
            
            from .services import record_activity
            record_activity(
                work_item=work_item,
                activity_type='UPDATED',
                field_changed='assigned_to',
                old_value=str(old_assigned_to) if old_assigned_to else None,
                new_value=str(user),
                user=request.user if request.user.is_authenticated else None
            )
            
            serializer = self.get_serializer(work_item)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        work_item = self.get_object()
        
        if request.method == 'GET':
            comments = Comment.objects.filter(work_item=work_item).order_by('created_at')
            page = self.paginate_queryset(comments)
            if page is not None:
                serializer = CommentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            data = request.data.copy()
            data['work_item'] = work_item.id
            serializer = CommentSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        work_item = self.get_object()
        activities = Activity.objects.filter(work_item=work_item).order_by('-timestamp')
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = ActivitySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

from rest_framework.decorators import api_view, action, permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def metadata(request):
    from .models import Project
    project_types = [{'value': k, 'label': v} for k, v in Project.PROJECT_TYPES]
    tech_tools = [
        {'value': 'JAVA', 'label': 'Java'},
        {'value': 'PYTHON', 'label': 'Python'},
        {'value': 'JS', 'label': 'JavaScript'},
        {'value': 'TS', 'label': 'TypeScript'},
        {'value': 'REACT', 'label': 'React'},
        {'value': 'NEXTJS', 'label': 'Next.js'},
        {'value': 'FLUTTER', 'label': 'Flutter'},
        {'value': 'SQL', 'label': 'SQL Database'},
        {'value': 'NOSQL', 'label': 'NoSQL Database'},
        {'value': 'AWS', 'label': 'AWS'},
        {'value': 'GCP', 'label': 'Google Cloud'},
    ]
    return Response({
        'project_types': project_types,
        'tech_tools': tech_tools
    })

@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def dashboard_stats(request):
    total = WorkItem.objects.count()
    
    status_counts = WorkItem.objects.values('status').annotate(count=models.Count('status'))
    by_status = {item['status']: item['count'] for item in status_counts}
    
    open_count = by_status.get('OPEN', 0)
    in_progress_count = by_status.get('IN_PROGRESS', 0)
    review_count = by_status.get('REVIEW', 0)
    resolved_count = by_status.get('RESOLVED', 0)
    closed_count = by_status.get('CLOSED', 0)

    priority_counts = WorkItem.objects.values('priority').annotate(count=models.Count('priority'))
    by_priority = {item['priority']: item['count'] for item in priority_counts}
    
    critical_count = by_priority.get('CRITICAL', 0)

    import datetime
    today = datetime.date.today()
    overdue_count = WorkItem.objects.filter(due_date__lt=today).exclude(status__in=['RESOLVED', 'CLOSED']).count()

    recent_activities = Activity.objects.all().select_related('work_item', 'actor').order_by('-timestamp')[:5]
    activity_serializer = ActivitySerializer(recent_activities, many=True)
    
    return Response({
        'total': total,
        'open': open_count,
        'in_progress': in_progress_count,
        'review': review_count,
        'resolved': resolved_count,
        'closed': closed_count,
        'critical': critical_count,
        'overdue': overdue_count,
        'by_priority': by_priority,
        'by_status': by_status,
        'recent_activity': activity_serializer.data,
    })

class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all().order_by('-created_at')
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'description']

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def activate(self, request, pk=None):
        workflow = self.get_object()
        workflow.is_active = True
        workflow.save()
        return Response({'status': 'Workflow activated'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def deactivate(self, request, pk=None):
        workflow = self.get_object()
        workflow.is_active = False
        workflow.save()
        return Response({'status': 'Workflow deactivated'})
        
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def execute(self, request, pk=None):
        from .workflow_engine import execute_workflow_run
        workflow = self.get_object()
        
        # We need a trigger node to start from. Let's find the first manual trigger or any trigger.
        nodes = workflow.definition.get("nodes", [])
        edges = workflow.definition.get("edges", [])
        
        trigger_nodes = [n for n in nodes if n.get("type") == "trigger"]
        if not trigger_nodes:
            return Response({'error': 'No trigger node found in workflow'}, status=400)
            
        # Prioritize manual trigger, else just use the first one
        start_node = next((n for n in trigger_nodes if n.get("data", {}).get("type_id") == "trigger_manual"), trigger_nodes[0])
        
        execution = WorkflowExecution.objects.create(
            workflow=workflow,
            status="RUNNING",
            trigger_data={"manual": True}
        )
        
        # Start execution in a fire-and-forget manner (for MVP, we just run it synchronously here since it's local)
        # In production this should be a Celery task
        try:
            execute_workflow_run(execution, start_node["id"], nodes, edges)
        except Exception as e:
            execution.status = "FAILED"
            execution.save()
            return Response({'error': str(e)}, status=500)
            
        return Response({'status': 'Workflow executed', 'execution_id': execution.id})

class WorkflowExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowExecution.objects.all().order_by('-started_at')
    serializer_class = WorkflowExecutionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['workflow', 'status']

class WorkflowExecutionStepViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowExecutionStep.objects.all().order_by('started_at')
    serializer_class = WorkflowExecutionStepSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['execution', 'status']
