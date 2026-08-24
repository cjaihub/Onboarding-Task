from .models import Activity

VALID_TRANSITIONS = {
    'OPEN': ['IN_PROGRESS'],
    'IN_PROGRESS': ['OPEN', 'REVIEW'],
    'REVIEW': ['IN_PROGRESS', 'RESOLVED'],
    'RESOLVED': ['IN_PROGRESS', 'CLOSED'],
    'CLOSED': ['OPEN']
}

def record_activity(work_item=None, activity_type='', field_changed=None, old_value=None, new_value=None, user=None, project=None):
    """
    Create an Activity record for a work item event.
    Called by views on create, update, and comment addition.
    Activity is written only by the backend (Rule 5, Rule 10).
    """
    return Activity.objects.create(
        work_item=work_item,
        project=project,
        actor=user,
        activity_type=activity_type,
        field_changed=field_changed,
        old_value=old_value,
        new_value=new_value,
    )

def transition_work_item(work_item, new_status, user=None):
    old_status = work_item.status
    if old_status == new_status:
        return work_item
        
    allowed_next_states = VALID_TRANSITIONS.get(old_status, [])
    if new_status not in allowed_next_states:
        raise ValueError(f"Cannot transition from {old_status} to {new_status}.")

    if new_status == 'RESOLVED':
        if not work_item.assigned_to:
            raise ValueError("Assignee is required to resolve a work item.")
        if not work_item.resolution_note:
            raise ValueError("Resolution note is required to resolve a work item.")

    work_item.status = new_status
    work_item.save(update_fields=['status', 'updated_at'])

    record_activity(
        work_item=work_item,
        activity_type='UPDATED',
        field_changed='status',
        old_value=old_status,
        new_value=new_status
    )
    return work_item
