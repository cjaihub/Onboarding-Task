import json
from channels.generic.websocket import AsyncWebsocketConsumer

class BoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We use a single group for the whole board in this MVP
        self.group_name = 'board_updates'

        # Join the board group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave the board group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from room group
    async def board_update(self, event):
        message = event['message']
        update_type = event.get('update_type', 'update')

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': update_type,
            'message': message
        }))
