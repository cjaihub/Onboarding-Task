from rest_framework import serializers
from .models import Project, WorkItem, Comment, Activity
from .services import record_activity, transition_work_item

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['author'] = request.user
        
        comment = super().create(validated_data)
        record_activity(comment.work_item, 'COMMENTED', new_value=comment.message)
        return comment

class ActivitySerializer(serializers.ModelSerializer):
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
                
        return data

    def create(self, validated_data):
        item = super().create(validated_data)
        record_activity(item, 'CREATED')
        return item

    def update(self, instance, validated_data):
        status_change = 'status' in validated_data and validated_data['status'] != instance.status
        new_status = validated_data.pop('status', instance.status)

        # Update other fields first
        for attr, value in validated_data.items():
            old_val = getattr(instance, attr)
            setattr(instance, attr, value)
            if old_val != value and attr not in ['updated_at']:
                record_activity(instance, 'UPDATED', field_changed=attr, old_value=str(old_val), new_value=str(value))
        
        instance.save()

        # Handle status transition through service
        if status_change:
            try:
                user = self.context['request'].user if 'request' in self.context else None
                transition_work_item(instance, new_status, user)
            except ValueError as e:
                raise serializers.ValidationError({"status": str(e)})

        return instance
