from django.test import TestCase
from django.contrib.auth.models import User
from core.models import Project, WorkItem, Workflow, WorkflowExecution
from core.workflow_engine import execute_workflow

class WorkflowEngineTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pw')
        self.project = Project.objects.create(name='Test Project', key='TEST')
        
        # Create a workflow definition
        self.workflow = Workflow.objects.create(
            name='Auto-Assign to Tester',
            is_active=True,
            definition={
                "nodes": [
                    {
                        "id": "trigger-1",
                        "type": "trigger",
                        "data": {"type_id": "trigger_work_item_created", "label": "On Item Created"}
                    },
                    {
                        "id": "action-1",
                        "type": "action",
                        "data": {"type_id": "action_assign", "assignee_id": self.user.id, "label": "Assign to tester"}
                    }
                ],
                "edges": [
                    {"id": "e1-2", "source": "trigger-1", "target": "action-1"}
                ]
            }
        )

    def test_workflow_engine_assigns_user(self):
        # Create item, the signal should trigger the workflow
        work_item = WorkItem.objects.create(
            title='Fix bug',
            description='Bug details',
            project=self.project,
            created_by=self.user,
            status='OPEN',
            priority='HIGH'
        )

        # Refresh from db to check if it was assigned
        work_item.refresh_from_db()
        
        self.assertEqual(work_item.assigned_to, self.user)
        
        # Check that execution was logged
        execution = WorkflowExecution.objects.filter(workflow=self.workflow, status='SUCCESS').first()
        self.assertIsNotNone(execution)
        self.assertEqual(execution.steps.count(), 2)  # trigger-1 and action-1
