from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, WorkItem, Comment, Activity


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['created_at']


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'work_item', 'activity_type', 'field_changed', 'old_value', 'new_value', 'timestamp']
        read_only_fields = ['timestamp']


class CommentSerializer(serializers.ModelSerializer):
    author_detail = UserBriefSerializer(source='author', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'work_item', 'author', 'author_detail', 'message', 'created_at']
        read_only_fields = ['created_at']


class WorkItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — avoids deep nesting on large result sets."""
    assigned_to_detail = UserBriefSerializer(source='assigned_to', read_only=True)
    reported_by_detail = UserBriefSerializer(source='reported_by', read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = WorkItem
        fields = [
            'id', 'reference_number', 'title', 'project', 'category',
            'priority', 'status', 'assigned_to', 'assigned_to_detail',
            'reported_by', 'reported_by_detail', 'due_date', 'is_overdue',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['reference_number', 'created_at', 'updated_at']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.due_date and obj.status not in ('RESOLVED', 'CLOSED'):
            return obj.due_date < timezone.now().date()
        return False


class WorkItemDetailSerializer(serializers.ModelSerializer):
    """Full serializer for retrieve/create/update operations."""
    assigned_to_detail = UserBriefSerializer(source='assigned_to', read_only=True)
    reported_by_detail = UserBriefSerializer(source='reported_by', read_only=True)
    project_detail = ProjectSerializer(source='project', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = WorkItem
        fields = [
            'id', 'reference_number', 'title', 'description', 'project', 'project_detail',
            'category', 'priority', 'status', 'assigned_to', 'assigned_to_detail',
            'reported_by', 'reported_by_detail', 'due_date', 'resolution_note',
            'is_overdue', 'created_at', 'updated_at', 'comments', 'activities',
        ]
        read_only_fields = ['reference_number', 'created_at', 'updated_at']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.due_date and obj.status not in ('RESOLVED', 'CLOSED'):
            return obj.due_date < timezone.now().date()
        return False

    def validate(self, data):
        """
        Enforce backend workflow rules:
          - RESOLVED requires assignee + non-empty resolution_note
          - Cannot transition directly from OPEN to CLOSED
        Per DOMAIN_RULES.md Rule 2, 3, 7: PATCH partial updates must
        consult the existing model instance for fields not in the payload.
        """
        instance = self.instance  # None on create

        # Merge incoming data with existing instance values (DOMAIN_RULES Rule 7)
        new_status = data.get('status', getattr(instance, 'status', None))
        new_assignee = data.get('assigned_to', getattr(instance, 'assigned_to', None))
        new_resolution_note = data.get(
            'resolution_note', getattr(instance, 'resolution_note', '') or ''
        )
        current_status = getattr(instance, 'status', 'OPEN')

        # Rule 2 — RESOLVED requires assignee and resolution_note
        if new_status == 'RESOLVED':
            if not new_assignee:
                raise serializers.ValidationError(
                    "Cannot resolve: work item must have an assignee."
                )
            if not new_resolution_note.strip():
                raise serializers.ValidationError(
                    "Cannot resolve: resolution_note must be provided."
                )

        # Rule 3 — Cannot go OPEN → CLOSED directly
        if new_status == 'CLOSED' and current_status == 'OPEN':
            raise serializers.ValidationError(
                "Cannot close a work item that has not been resolved. "
                "Transition must pass through RESOLVED first."
            )

        # Rule 6 — Enforce allowed state machine transitions
        ALLOWED_TRANSITIONS = {
            'OPEN':        {'IN_PROGRESS'},
            'IN_PROGRESS': {'OPEN', 'REVIEW'},
            'REVIEW':      {'IN_PROGRESS', 'RESOLVED'},
            'RESOLVED':    {'CLOSED', 'IN_PROGRESS'},
            'CLOSED':      set(),  # terminal
        }
        if instance and new_status != current_status:
            if new_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
                raise serializers.ValidationError(
                    f"Invalid transition: {current_status} → {new_status}."
                )

        return data
