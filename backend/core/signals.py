from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import WorkItem, Comment, Activity
from .workflow_engine import trigger_workflow_event

def broadcast_board_update(update_type, message):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'board_updates',
            {
                'type': 'board_update',
                'update_type': update_type,
                'message': message
            }
        )

@receiver(post_save, sender=WorkItem)
def work_item_saved(sender, instance, created, **kwargs):
    if created:
        trigger_workflow_event("trigger_work_item_created", {"work_item_id": instance.id})
    broadcast_board_update('work_item_updated', {'id': instance.id, 'action': 'created' if created else 'updated'})

@receiver(post_delete, sender=WorkItem)
def work_item_deleted(sender, instance, **kwargs):
    broadcast_board_update('work_item_deleted', {'id': instance.id})

@receiver(post_save, sender=Comment)
def comment_saved(sender, instance, created, **kwargs):
    broadcast_board_update('comment_updated', {'id': instance.id, 'work_item_id': instance.work_item_id})

@receiver(post_save, sender=Activity)
def activity_saved(sender, instance, created, **kwargs):
    broadcast_board_update('activity_updated', {'id': instance.id, 'work_item_id': instance.work_item_id})
