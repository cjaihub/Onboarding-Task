from django.urls import path
from core.consumers import BoardConsumer

websocket_urlpatterns = [
    path('ws/board/', BoardConsumer.as_asgi()),
]
