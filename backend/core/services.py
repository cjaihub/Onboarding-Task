from .models import Activity


def record_activity(work_item, activity_type, field_changed=None, old_value=None, new_value=None):
    """
    Create an Activity record for a work item event.
    Called by views on create, update, and comment addition.
    Activity is written only by the backend (Rule 5, Rule 10).
    """
    Activity.objects.create(
        work_item=work_item,
        activity_type=activity_type,
        field_changed=field_changed,
        old_value=old_value,
        new_value=new_value,
    )
