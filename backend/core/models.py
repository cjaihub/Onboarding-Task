from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class WorkItem(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('REVIEW', 'Review'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    reference_number = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='work_items')
    category = models.CharField(max_length=100)
    priority = models.CharField(max_length=50)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='OPEN', db_index=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_work_items')
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reported_work_items')
    due_date = models.DateField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.reference_number or 'Unassigned'} - {self.title}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.reference_number:
            self.reference_number = f"INC-{self.pk:05d}"
            # Use update_fields to avoid infinite recursion and only update reference_number
            super().save(update_fields=['reference_number'])


class Comment(models.Model):
    work_item = models.ForeignKey(WorkItem, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author} on {self.work_item}"

class Activity(models.Model):
    work_item = models.ForeignKey(WorkItem, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=100)
    field_changed = models.CharField(max_length=100, null=True, blank=True)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"Activity: {self.activity_type} on {self.work_item}"
