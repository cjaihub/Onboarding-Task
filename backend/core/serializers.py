from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, WorkItem, Comment, Activity, Workflow, WorkflowExecution, WorkflowExecutionStep, UserProfile, ProjectAttachment, ProjectComment
from .services import record_activity, transition_work_item

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio', 'role', 'avatar_url', 'phone_number']

class ProjectAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.username')
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectAttachment
        fields = ['id', 'project', 'uploaded_by', 'uploaded_by_name', 'file', 'file_url', 'description', 'created_at']
        read_only_fields = ['uploaded_by', 'created_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class ProjectCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = ProjectComment
        fields = ['id', 'project', 'author', 'author_name', 'author_avatar', 'message', 'created_at']
        read_only_fields = ['author', 'created_at']

    def get_author_avatar(self, obj):
        try:
            return obj.author.profile.avatar_url
        except:
            return None

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']

class ProjectSerializer(serializers.ModelSerializer):
    members_detail = UserSerializer(source='members', many=True, read_only=True)
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)
    comments = ProjectCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'project_type', 'status', 'tech_tools', 'created_at', 'members', 'members_detail', 'attachments', 'comments']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ['created_at', 'author']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['author'] = request.user
        elif 'author' not in validated_data:
            from django.contrib.auth.models import User
            validated_data['author'] = User.objects.first()
        
        comment = super().create(validated_data)
        record_activity(comment.work_item, 'COMMENTED', new_value=comment.message, user=comment.author)
        return comment

class ActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source='actor.username')

    class Meta:
        model = Activity
        fields = '__all__'

class WorkItemSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkItem
        fields = '__all__'
        read_only_fields = ['reference_number', 'created_at', 'updated_at']

    def validate(self, data):
        # We handle status transition validation in the service.
        # But if the payload forces RESOLVED without assignment or note (e.g. at creation), check here.
        instance = self.instance
        new_status = data.get('status', instance.status if instance else 'OPEN')
        
        if new_status == 'RESOLVED':
            assignee = data.get('assigned_to', instance.assigned_to if instance else None)
            note = data.get('resolution_note', instance.resolution_note if instance else None)
            if not assignee:
                raise serializers.ValidationError({"assigned_to": "Assignee is required to resolve a work item."})
            if not note:
                raise serializers.ValidationError({"resolution_note": "Resolution note is required to resolve a work item."})
                
        # Project membership validation
        assignee = data.get('assigned_to', instance.assigned_to if instance else None)
        project = data.get('project', instance.project if instance else None)
        
        if assignee and project:
            # If project has members defined, enforce membership
            if project.members.exists() and not project.members.filter(id=assignee.id).exists():
                raise serializers.ValidationError({"assigned_to": "User must be a member of the project to be assigned a task."})

                
        return data

    def create(self, validated_data):
        item = super().create(validated_data)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        record_activity(item, 'CREATED', user=user)
        return item

    def update(self, instance, validated_data):
        status_change = 'status' in validated_data and validated_data['status'] != instance.status
        new_status = validated_data.pop('status', instance.status)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Update other fields first
        for attr, value in validated_data.items():
            old_val = getattr(instance, attr)
            setattr(instance, attr, value)
            if old_val != value and attr not in ['updated_at']:
                record_activity(instance, 'UPDATED', field_changed=attr, old_value=str(old_val), new_value=str(value), user=user)
        
        instance.save()

        # Handle status transition through service
        if status_change:
            try:
                user = self.context['request'].user if 'request' in self.context else None
                transition_work_item(instance, new_status, user)
            except ValueError as e:
                raise serializers.ValidationError({"status": str(e)})

        return instance

class WorkflowExecutionStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowExecutionStep
        fields = '__all__'

class WorkflowExecutionSerializer(serializers.ModelSerializer):
    steps = WorkflowExecutionStepSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowExecution
        fields = '__all__'

class WorkflowSerializer(serializers.ModelSerializer):
    executions = WorkflowExecutionSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = '__all__'
