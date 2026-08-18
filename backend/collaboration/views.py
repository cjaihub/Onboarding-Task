from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import VisualCapture, Annotation, Notification
from .serializers import VisualCaptureSerializer, AnnotationSerializer, NotificationSerializer
from django_filters.rest_framework import DjangoFilterBackend
import base64
from django.core.files.base import ContentFile
import uuid

class VisualCaptureViewSet(viewsets.ModelViewSet):
    queryset = VisualCapture.objects.all().order_by('-created_at')
    serializer_class = VisualCaptureSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'work_item', 'created_by']

    def create(self, request, *args, **kwargs):
        # We might receive a base64 string from the extension instead of a direct file upload
        data = request.data.copy()
        
        if 'image_base64' in data:
            format, imgstr = data['image_base64'].split(';base64,') 
            ext = format.split('/')[-1] 
            filename = f"capture_{uuid.uuid4()}.{ext}"
            data['original_image'] = ContentFile(base64.b64decode(imgstr), name=filename)
            del data['image_base64']

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class AnnotationViewSet(viewsets.ModelViewSet):
    queryset = Annotation.objects.all().order_by('created_at')
    serializer_class = AnnotationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['capture', 'created_by']

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['recipient', 'project', 'read']

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        user = request.user
        if not user.is_authenticated:
            # Fallback for dev middleware
            from django.contrib.auth.models import User
            user = User.objects.first()
            
        Notification.objects.filter(recipient=user, read=False).update(read=True)
        return Response({'status': 'ok'})
