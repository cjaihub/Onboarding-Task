from django.db import models
from django.contrib.auth.models import User
from core.models import Project, WorkItem

class VisualCapture(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='captures')
    work_item = models.ForeignKey(WorkItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='captures')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='captures_created')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    original_image = models.ImageField(upload_to='captures/original/')
    annotated_image = models.ImageField(upload_to='captures/annotated/', null=True, blank=True)
    page_url = models.URLField(max_length=1024, null=True, blank=True)
    page_title = models.CharField(max_length=512, null=True, blank=True)
    browser = models.CharField(max_length=100, null=True, blank=True)
    viewport_width = models.IntegerField(null=True, blank=True)
    viewport_height = models.IntegerField(null=True, blank=True)
    capture_type = models.CharField(max_length=50, choices=[
        ('VISIBLE', 'Visible'),
        ('SELECTED', 'Selected'),
        ('FULL_PAGE', 'Full Page'),
    ], default='VISIBLE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Capture {self.id}: {self.title}"

class Annotation(models.Model):
    capture = models.ForeignKey(VisualCapture, on_delete=models.CASCADE, related_name='annotations')
    type = models.CharField(max_length=50) # arrow, rect, text, etc
    coordinates = models.JSONField()
    content = models.TextField(null=True, blank=True)
    style = models.JSONField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications_caused')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notifications')
    capture = models.ForeignKey(VisualCapture, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    work_item = models.ForeignKey(WorkItem, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
