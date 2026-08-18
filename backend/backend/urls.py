from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from core.auth_views import (
    CustomTokenObtainPairView,
    RegisterView,
    MeView,
    ChangePasswordView,
    LogoutView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth endpoints ────────────────────────────────────────────────────────
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),

    # ── Core & Collaboration ──────────────────────────────────────────────────
    path('api/', include('core.urls')),
    path('api/collaboration/', include('collaboration.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
