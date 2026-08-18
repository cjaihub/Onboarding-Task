from rest_framework import serializers
from .models import VisualCapture, Annotation, Notification
from django.contrib.auth.models import User

class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = '__all__'
        read_only_fields = ['created_by']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        elif 'created_by' not in validated_data:
            validated_data['created_by'] = User.objects.first()
        return super().create(validated_data)

class VisualCaptureSerializer(serializers.ModelSerializer):
    annotations = AnnotationSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = VisualCapture
        fields = '__all__'
        read_only_fields = ['created_by']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        elif 'created_by' not in validated_data:
            validated_data['created_by'] = User.objects.first()
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source='actor.username')

    class Meta:
        model = Notification
        fields = '__all__'
