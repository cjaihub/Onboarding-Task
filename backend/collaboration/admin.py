from django.contrib import admin
from .models import VisualCapture, Annotation, Notification

@admin.register(VisualCapture)
class VisualCaptureAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project', 'work_item', 'created_by', 'capture_type', 'created_at']
    list_filter = ['project', 'capture_type']
    search_fields = ['title', 'description', 'project__title', 'work_item__title', 'created_by__username', 'created_by__first_name', 'created_by__last_name', 'page_url', 'page_title']

@admin.register(Annotation)
class AnnotationAdmin(admin.ModelAdmin):
    list_display = ['id', 'capture', 'type', 'created_by', 'created_at']
    search_fields = ['type', 'content', 'capture__title', 'created_by__username', 'created_by__first_name', 'created_by__last_name']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'actor', 'message', 'read', 'created_at']
    list_filter = ['read', 'project']
    search_fields = ['message', 'recipient__username', 'recipient__first_name', 'recipient__last_name', 'actor__username', 'actor__first_name', 'actor__last_name', 'project__title', 'work_item__title']
