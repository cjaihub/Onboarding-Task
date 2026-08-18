from django.contrib import admin
from .models import Project, WorkItem, Comment, Activity, Workflow, WorkflowExecution, WorkflowExecutionStep

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'created_at']
    search_fields = ['name', 'description']

@admin.register(WorkItem)
class WorkItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'reference_number', 'title', 'project', 'status', 'priority', 'category', 'reported_by', 'assigned_to']
    list_filter = ['status', 'priority', 'category', 'project']
    search_fields = ['reference_number', 'title', 'description', 'project__name', 'reported_by__username', 'assigned_to__username']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'work_item', 'author', 'created_at']
    search_fields = ['message', 'work_item__title', 'author__username']

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['id', 'work_item', 'actor', 'activity_type', 'field_changed', 'timestamp']
    list_filter = ['activity_type']
    search_fields = ['activity_type', 'field_changed', 'old_value', 'new_value', 'actor__username', 'work_item__title']

@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'project', 'is_active']
    list_filter = ['is_active', 'project']
    search_fields = ['name', 'description', 'project__name']

@admin.register(WorkflowExecution)
class WorkflowExecutionAdmin(admin.ModelAdmin):
    list_display = ['id', 'workflow', 'status', 'started_at', 'completed_at']
    list_filter = ['status']
    search_fields = ['status', 'workflow__name']

@admin.register(WorkflowExecutionStep)
class WorkflowExecutionStepAdmin(admin.ModelAdmin):
    list_display = ['id', 'execution', 'node_id', 'status', 'completed_at']
    list_filter = ['status']
    search_fields = ['node_id', 'status', 'error', 'logs', 'execution__workflow__name']
