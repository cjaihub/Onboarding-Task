from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    role = models.CharField(max_length=100, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

class Project(models.Model):
    PROJECT_TYPES = [
        ('BACKEND', 'Backend'),
        ('FRONTEND', 'Frontend'),
        ('FULLSTACK', 'Full Stack'),
        ('MOBILE', 'Mobile'),
        ('API', 'API / Integration'),
        ('UIUX', 'UI/UX Design'),
        ('INFRA', 'Infrastructure / DevOps'),
    ]

    PROJECT_STATUS_CHOICES = [
        ('PLANNING', 'Planning'),
        ('ACTIVE', 'Active'),
        ('ON_HOLD', 'On Hold'),
        ('COMPLETED', 'Completed'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project_type = models.CharField(max_length=50, choices=PROJECT_TYPES, default='FULLSTACK')
    status = models.CharField(max_length=20, choices=PROJECT_STATUS_CHOICES, default='PLANNING')
    tech_tools = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(User, related_name='projects', blank=True)

    def __str__(self):
        return self.name

class ProjectAttachment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='project_attachments')
    file = models.FileField(upload_to='project_attachments/')
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file.name} - {self.project.name}"

class ProjectComment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_comments')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author.username} on {self.project.name}"

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
    tags = models.JSONField(default=list, blank=True)
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
    attachment = models.FileField(upload_to='attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author} on {self.work_item}"

class Activity(models.Model):
    work_item = models.ForeignKey(WorkItem, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities_caused')
    activity_type = models.CharField(max_length=100)
    field_changed = models.CharField(max_length=100, null=True, blank=True)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"Activity: {self.activity_type} on {self.work_item}"


class Workflow(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='workflows')
    is_active = models.BooleanField(default=False)
    definition = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class WorkflowExecution(models.Model):
    STATUS_CHOICES = [
        ('QUEUED', 'Queued'),
        ('RUNNING', 'Running'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='executions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='QUEUED')
    trigger_data = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.workflow.name} - {self.status}"

class WorkflowExecutionStep(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]
    execution = models.ForeignKey(WorkflowExecution, on_delete=models.CASCADE, related_name='steps')
    node_id = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    logs = models.TextField(blank=True)
    error = models.TextField(blank=True)

    def __str__(self):
        return f"Node {self.node_id} ({self.status})"
