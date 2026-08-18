from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisualCaptureViewSet, AnnotationViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'captures', VisualCaptureViewSet)
router.register(r'annotations', AnnotationViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
