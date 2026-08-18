from django.contrib.auth.models import User
from django.utils.deprecation import MiddlewareMixin

class MockAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        user_id = request.headers.get('X-User-ID')
        if user_id:
            try:
                request.user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
