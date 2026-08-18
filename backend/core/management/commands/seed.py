import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Project, WorkItem, Comment, Activity, Workflow
from core.services import transition_work_item, record_activity

class Command(BaseCommand):
    help = 'Seeds the database with realistic development data.'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete all existing data before seeding')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING("Resetting database..."))
            Workflow.objects.all().delete()
            Comment.objects.all().delete()
            Activity.objects.all().delete()
            WorkItem.objects.all().delete()
            Project.objects.all().delete()
            User.objects.exclude(is_superuser=True).delete()

        # If data already seeded, exit unless reset
        if User.objects.count() >= 3 and not options['reset']:
            self.stdout.write(self.style.SUCCESS('Database is already seeded with users. Use --reset to re-seed.'))
            return

        # Users
        u1, _ = User.objects.get_or_create(username='alice', defaults={'email': 'alice@example.com'})
        u2, _ = User.objects.get_or_create(username='bob', defaults={'email': 'bob@example.com'})
        u3, _ = User.objects.get_or_create(username='charlie', defaults={'email': 'charlie@example.com'})
        users = [u1, u2, u3]

        # Projects (System required since no UI exists)
        p1, _ = Project.objects.get_or_create(name='CJ Engineering Platform', defaults={'description': 'Core internal infrastructure'})
        p2, _ = Project.objects.get_or_create(name='Global Afr Media Platform', defaults={'description': 'Media distribution'})
        p3, _ = Project.objects.get_or_create(name='IGSU Digital Platform', defaults={'description': 'Digital services platform'})
        p4, _ = Project.objects.get_or_create(name='Omni Automation Platform', defaults={'description': 'Automation workflows'})

        # Workflows
        w1, _ = Workflow.objects.get_or_create(
            name='Auto-Assign to DevOps',
            defaults={
                'description': 'Automatically assigns new infrastructure tickets to Alice.',
                'is_active': True,
                'definition': {
                    "nodes": [
                        {
                            "id": "trigger-1",
                            "type": "trigger",
                            "position": {"x": 100, "y": 100},
                            "data": {"type_id": "trigger_work_item_created", "label": "On Item Created"}
                        },
                        {
                            "id": "logic-1",
                            "type": "logic",
                            "position": {"x": 400, "y": 100},
                            "data": {"type_id": "logic_condition", "field": "category", "operator": "equals", "value": "INFRASTRUCTURE", "label": "Is Infrastructure?"}
                        },
                        {
                            "id": "action-1",
                            "type": "action",
                            "position": {"x": 700, "y": 100},
                            "data": {"type_id": "action_assign", "assignee_id": u1.id, "label": "Assign to Alice"}
                        }
                    ],
                    "edges": [
                        {"id": "e1-2", "source": "trigger-1", "target": "logic-1"},
                        {"id": "e2-3", "source": "logic-1", "sourceHandle": "true", "target": "action-1"}
                    ]
                }
            }
        )
        
        w2, _ = Workflow.objects.get_or_create(
            name='High Priority Alert',
            defaults={
                'description': 'Adds a comment when high priority item is created.',
                'is_active': True,
                'definition': {
                    "nodes": [
                        {
                            "id": "trigger-1",
                            "type": "trigger",
                            "position": {"x": 100, "y": 100},
                            "data": {"type_id": "trigger_work_item_created", "label": "On Item Created"}
                        },
                        {
                            "id": "logic-1",
                            "type": "logic",
                            "position": {"x": 400, "y": 100},
                            "data": {"type_id": "logic_condition", "field": "priority", "operator": "equals", "value": "HIGH", "label": "Is High Priority?"}
                        },
                        {
                            "id": "action-1",
                            "type": "action",
                            "position": {"x": 700, "y": 100},
                            "data": {"type_id": "action_add_comment", "message": "Automated Alert: Please review this High Priority item immediately.", "label": "Add Alert Comment"}
                        }
                    ],
                    "edges": [
                        {"id": "e1-2", "source": "trigger-1", "target": "logic-1"},
                        {"id": "e2-3", "source": "logic-1", "sourceHandle": "true", "target": "action-1"}
                    ]
                }
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded users, projects, and workflows.'))
