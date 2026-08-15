import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Project, WorkItem, Comment, Activity
from core.services import transition_work_item, record_activity

class Command(BaseCommand):
    help = 'Seeds the database with realistic development data.'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete all existing data before seeding')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING("Resetting database..."))
            Comment.objects.all().delete()
            Activity.objects.all().delete()
            WorkItem.objects.all().delete()
            Project.objects.all().delete()
            User.objects.exclude(is_superuser=True).delete()

        # If data already seeded, exit unless reset
        if WorkItem.objects.count() >= 30:
            self.stdout.write(self.style.SUCCESS('Database is already seeded with at least 30 items. Use --reset to re-seed.'))
            return

        # Users
        u1, _ = User.objects.get_or_create(username='alice', defaults={'email': 'alice@example.com'})
        u2, _ = User.objects.get_or_create(username='bob', defaults={'email': 'bob@example.com'})
        u3, _ = User.objects.get_or_create(username='charlie', defaults={'email': 'charlie@example.com'})
        users = [u1, u2, u3]

        # Projects
        p1, _ = Project.objects.get_or_create(name='Internal Tools', defaults={'description': 'Core tooling'})
        p2, _ = Project.objects.get_or_create(name='Customer Portal', defaults={'description': 'External facing'})

        now = timezone.now()

        categories = ['Bug', 'Feature', 'Maintenance', 'Documentation']
        priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

        items_data = []

        # 1. Overdue active item (OPEN, overdue)
        items_data.append({'title': 'Fix critical login bug', 'status': 'OPEN', 'due': now - timedelta(days=2), 'priority': 'CRITICAL', 'assignee': u1})
        # 2. Overdue resolved item (RESOLVED, overdue)
        items_data.append({'title': 'Update payment gateway API', 'status': 'RESOLVED', 'due': now - timedelta(days=5), 'priority': 'HIGH', 'assignee': u2})
        # 3. Future due date (IN_PROGRESS)
        items_data.append({'title': 'Migrate database to v2', 'status': 'IN_PROGRESS', 'due': now + timedelta(days=10), 'priority': 'MEDIUM', 'assignee': u3})
        
        # 4-30 Random but realistic
        for i in range(4, 32):
            items_data.append({
                'title': f'Task {i} for development',
                'status': random.choice(['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED']),
                'due': now + timedelta(days=random.randint(-10, 20)) if random.random() > 0.3 else None,
                'priority': random.choice(priorities),
                'assignee': random.choice(users) if random.random() > 0.2 else None
            })

        for data in items_data:
            project = random.choice([p1, p2])
            reporter = random.choice(users)
            
            # Initial state must be OPEN
            item = WorkItem.objects.create(
                title=data['title'],
                description=f"Description for {data['title']}",
                project=project,
                category=random.choice(categories),
                priority=data['priority'],
                assigned_to=data['assignee'],
                reported_by=reporter,
                due_date=data['due'].date() if data['due'] else None,
            )
            record_activity(item, 'CREATED')

            # Move through states according to the Strict DAG
            target_status = data['status']
            
            if target_status != 'OPEN':
                transition_work_item(item, 'IN_PROGRESS', user=reporter)
                
            if target_status in ['REVIEW', 'RESOLVED', 'CLOSED']:
                transition_work_item(item, 'REVIEW', user=reporter)
                
            if target_status in ['RESOLVED', 'CLOSED']:
                # Ensure assignee and note exist before resolving!
                if not item.assigned_to:
                    item.assigned_to = random.choice(users)
                    item.save(update_fields=['assigned_to'])
                item.resolution_note = "Resolved the issue as per requirements."
                item.save(update_fields=['resolution_note'])
                transition_work_item(item, 'RESOLVED', user=item.assigned_to)

            if target_status == 'CLOSED':
                transition_work_item(item, 'CLOSED', user=reporter)
                
            # Add some comments
            if random.random() > 0.5:
                Comment.objects.create(work_item=item, author=random.choice(users), message="This is a test comment.")

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(items_data)} work items.'))
