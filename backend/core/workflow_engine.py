from django.utils import timezone
from core.models import Workflow, WorkflowExecution, WorkflowExecutionStep, WorkItem, Comment, Project
from django.contrib.auth.models import User
from django.conf import settings
import traceback
import subprocess
import requests
import os

class NodeRegistry:
    _registry = {}

    @classmethod
    def register(cls, node_type):
        def decorator(func):
            cls._registry[node_type] = func
            return func
        return decorator

    @classmethod
    def get_handler(cls, node_type):
        return cls._registry.get(node_type)

registry = NodeRegistry()

# ─── TRIGGER NODES ─────────────────────────────────────────────────────────────
@registry.register("trigger_work_item_created")
@registry.register("trigger_work_item_updated")
@registry.register("trigger_manual")
def handle_trigger(node, data, context, step):
    step.logs = "Trigger fired successfully"
    return True, None

# ─── WORK ITEM ACTIONS ─────────────────────────────────────────────────────────
@registry.register("action_change_status")
def handle_change_status(node, data, context, step):
    work_item_id = context.get("work_item_id")
    new_status = data.get("status")
    if not work_item_id or not new_status:
        step.error = "Missing work_item_id or status."
        return False, None
        
    work_item = WorkItem.objects.get(id=work_item_id)
    from core.services import transition_work_item
    transition_work_item(work_item, new_status, user=None)
    step.logs = f"Status changed to {new_status}"
    return True, None

@registry.register("action_assign")
def handle_assign(node, data, context, step):
    work_item_id = context.get("work_item_id")
    assignee_id = data.get("assignee_id")
    if not work_item_id or not assignee_id:
        step.error = "Missing work_item_id or assignee_id."
        return False, None
        
    work_item = WorkItem.objects.get(id=work_item_id)
    user = User.objects.get(id=assignee_id)
    work_item.assigned_to = user
    work_item.save(update_fields=['assigned_to'])
    
    from core.services import record_activity
    record_activity(work_item, 'UPDATED', field_changed='assigned_to', old_value=str(work_item.assigned_to), new_value=str(user))
    step.logs = f"Assigned to {user.username}"
    return True, None

@registry.register("action_add_comment")
def handle_add_comment(node, data, context, step):
    work_item_id = context.get("work_item_id")
    message = data.get("message")
    if not work_item_id or not message:
        step.error = "Missing work_item_id or message."
        return False, None
        
    work_item = WorkItem.objects.get(id=work_item_id)
    system_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
    Comment.objects.create(work_item=work_item, author=system_user, message=message)
    step.logs = f"Comment added: {message}"
    return True, None

@registry.register("action_notify_user")
def handle_notify_user(node, data, context, step):
    work_item_id = context.get("work_item_id")
    user_id = data.get("user_id")
    message = data.get("message", "Workflow notification")
    if not work_item_id or not user_id:
        step.error = "Missing work_item_id or user_id."
        return False, None
        
    work_item = WorkItem.objects.get(id=work_item_id)
    user = User.objects.get(id=user_id)
    from collaboration.models import Notification
    Notification.objects.create(
        recipient=user,
        project=work_item.project,
        work_item=work_item,
        message=message
    )
    step.logs = f"Notified user {user.username}"
    return True, None

@registry.register("action_notify_project_members")
def handle_notify_project_members(node, data, context, step):
    work_item_id = context.get("work_item_id")
    message = data.get("message", "Workflow notification")
    if not work_item_id:
        step.error = "Missing work_item_id."
        return False, None
        
    work_item = WorkItem.objects.get(id=work_item_id)
    project = work_item.project
    from collaboration.models import Notification
    count = 0
    for member in project.members.all():
        Notification.objects.create(
            recipient=member,
            project=project,
            work_item=work_item,
            message=message
        )
        count += 1
    step.logs = f"Notified {count} project members."
    return True, None

# ─── LOGIC NODES ───────────────────────────────────────────────────────────────
@registry.register("logic_condition_priority")
@registry.register("logic_condition")
def handle_condition(node, data, context, step):
    work_item_id = context.get("work_item_id")
    # For MVP logic node, we check priority or category
    target_value = data.get("value") or data.get("priority")
    field = data.get("field", "priority")
    
    if not work_item_id or not target_value:
        step.error = "Missing work_item_id or comparison value."
        return False, None
        
    work_item = WorkItem.objects.get(id=work_item_id)
    
    actual_value = getattr(work_item, field, None)
    if str(actual_value) == str(target_value):
        step.logs = f"Condition met: {field} is {actual_value}"
        return True, "true"
    else:
        step.logs = f"Condition not met: {field} is {actual_value}"
        return True, "false"

# ─── INTEGRATION NODES ─────────────────────────────────────────────────────────
@registry.register("action_cli_command")
def handle_cli_command(node, data, context, step):
    command = data.get("command")
    if not command:
        step.error = "Missing command."
        return False, None
        
    project_root = getattr(settings, 'BASE_DIR', os.getcwd())
    try:
        result = subprocess.run(
            command, shell=True, cwd=project_root, capture_output=True, text=True, timeout=120
        )
        step.logs = f"EXIT CODE: {result.returncode}\n\nSTDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}"
        if result.returncode != 0:
            step.error = f"Command failed with exit code {result.returncode}"
            return False, None
        return True, None
    except subprocess.TimeoutExpired:
        step.error = "Command timed out after 120s."
        return False, None
    except Exception as e:
        step.error = f"Execution error: {str(e)}"
        return False, None

@registry.register("action_api")
def handle_api_request(node, data, context, step):
    url = data.get("url")
    method = data.get("method", "GET").upper()
    payload = data.get("body", None)
    
    if not url:
        step.error = "Missing URL."
        return False, None
        
    try:
        if method == "POST":
            response = requests.post(url, json=payload, timeout=30)
        elif method == "PUT":
            response = requests.put(url, json=payload, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, timeout=30)
        else:
            response = requests.get(url, timeout=30)
            
        step.logs = f"STATUS: {response.status_code}\n\nRESPONSE:\n{response.text[:2000]}"
        if not response.ok:
            step.error = f"API returned error {response.status_code}"
            return False, None
        return True, None
    except requests.RequestException as e:
        step.error = f"Request failed: {str(e)}"
        return False, None

# ─── EXECUTION ENGINE ──────────────────────────────────────────────────────────

def trigger_workflow_event(event_type, context):
    workflows = Workflow.objects.filter(is_active=True)
    for workflow in workflows:
        definition = workflow.definition
        if not isinstance(definition, dict):
            continue
        nodes = definition.get("nodes", [])
        
        # Check both generic type and data.type_id
        trigger_nodes = [n for n in nodes if n.get("data", {}).get("type_id") == event_type or n.get("type") == event_type]
        if not trigger_nodes:
            continue
            
        for trigger_node in trigger_nodes:
            execution = WorkflowExecution.objects.create(
                workflow=workflow,
                status="RUNNING",
                trigger_data=context
            )
            execute_workflow_run(execution, trigger_node["id"], nodes, definition.get("edges", []))

def execute_node(node, context, step):
    node_type = node.get("type")
    data = node.get("data", {})
    semantic_type = data.get("type_id") or node_type
    
    handler = NodeRegistry.get_handler(semantic_type)
    if not handler:
        step.error = f"Unknown node type: {semantic_type}"
        return False
        
    try:
        success, next_handle = handler(node, data, context, step)
        if success and next_handle:
            step.logs = f"handle:{next_handle}\n\n{step.logs or ''}"
        return success
    except Exception as e:
        step.error = traceback.format_exc()
        return False

def execute_workflow_run(execution, start_node_id, nodes, edges):
    try:
        current_node_id = start_node_id
        visited = set()
        
        while current_node_id:
            if current_node_id in visited:
                raise Exception("Infinite loop detected in workflow.")
            visited.add(current_node_id)
            
            node = next((n for n in nodes if n["id"] == current_node_id), None)
            if not node:
                break
                
            step = WorkflowExecutionStep.objects.create(
                execution=execution,
                node_id=current_node_id,
                status="RUNNING"
            )
            
            success = execute_node(node, execution.trigger_data, step)
            
            if not success:
                step.status = "FAILED"
                step.completed_at = timezone.now()
                step.save()
                execution.status = "FAILED"
                execution.completed_at = timezone.now()
                execution.save()
                return
                
            step.status = "SUCCESS"
            step.completed_at = timezone.now()
            step.save()
            
            output_handle = None
            if step.logs and step.logs.startswith("handle:"):
                output_handle = step.logs.split("\n\n")[0].split(":")[1]
            
            next_edge = None
            for edge in edges:
                if edge.get("source") == current_node_id:
                    if output_handle:
                        if edge.get("sourceHandle") == output_handle:
                            next_edge = edge
                            break
                    else:
                        next_edge = edge
                        break
                        
            if next_edge:
                current_node_id = next_edge.get("target")
            else:
                current_node_id = None
                
        execution.status = "SUCCESS"
        execution.completed_at = timezone.now()
        execution.save()
        
    except Exception as e:
        execution.status = "FAILED"
        execution.completed_at = timezone.now()
        execution.save()
        WorkflowExecutionStep.objects.create(
            execution=execution,
            node_id=current_node_id if current_node_id else "unknown",
            status="FAILED",
            error=traceback.format_exc(),
            completed_at=timezone.now()
        )
