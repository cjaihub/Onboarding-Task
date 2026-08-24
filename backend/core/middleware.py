from django.contrib.auth.models import User
from django.utils.deprecation import MiddlewareMixin
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from django.db import close_old_connections
from asgiref.sync import sync_to_async

class MockAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        user_id = request.headers.get('X-User-ID')
        if user_id:
            try:
                request.user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass

@sync_to_async
def get_user_from_token(token):
    from rest_framework_simplejwt.tokens import UntypedToken
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
    from django.contrib.auth.models import User
    try:
        UntypedToken(token)
        from rest_framework_simplejwt.authentication import JWTAuthentication
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        user = jwt_auth.get_user(validated_token)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()
        
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        
        token = query_params.get('token', [None])[0]
        
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            from django.contrib.auth.models import AnonymousUser
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
