from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from .models import Project, WorkItem, Comment, Activity
from .services import record_activity


class WorkItemModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.project = Project.objects.create(name='Test Project', description='Test')

    def test_work_item_reference_generation(self):
        item = WorkItem.objects.create(
            title="Fix bug",
            project=self.project,
            category="Bug",
            priority="HIGH",
            reported_by=self.user,
        )
        self.assertIsNotNone(item.reference_number)
        self.assertTrue(item.reference_number.startswith('INC-'))
        self.assertEqual(len(item.reference_number), 9)
        self.assertEqual(item.reference_number, f"INC-{item.id:05d}")

    def test_work_item_reference_sequential(self):
        item1 = WorkItem.objects.create(
            title="Item 1", project=self.project, category="Bug",
            priority="HIGH", reported_by=self.user,
        )
        item2 = WorkItem.objects.create(
            title="Item 2", project=self.project, category="Bug",
            priority="LOW", reported_by=self.user,
        )
        self.assertNotEqual(item1.reference_number, item2.reference_number)
        self.assertLess(item1.id, item2.id)

    def test_work_item_status_defaults_to_open(self):
        item = WorkItem.objects.create(
            title="New Feature", project=self.project,
            category="Feature", priority="LOW", reported_by=self.user,
        )
        self.assertEqual(item.status, 'OPEN')


class ActivityServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser2', password='password')
        self.project = Project.objects.create(name='Service Project')
        self.item = WorkItem.objects.create(
            title="Test Item", project=self.project,
            category="Bug", priority="MEDIUM", reported_by=self.user,
        )

    def test_record_activity_creation(self):
        record_activity(self.item, 'CREATED')
        self.assertEqual(Activity.objects.filter(work_item=self.item, activity_type='CREATED').count(), 1)

    def test_record_activity_with_fields(self):
        record_activity(self.item, 'UPDATED', field_changed='status', old_value='OPEN', new_value='IN_PROGRESS')
        act = Activity.objects.get(work_item=self.item, activity_type='UPDATED')
        self.assertEqual(act.field_changed, 'status')
        self.assertEqual(act.old_value, 'OPEN')
        self.assertEqual(act.new_value, 'IN_PROGRESS')


class WorkItemAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='apiuser', password='password')
        self.project = Project.objects.create(name='API Project')

    def _create_item(self, **kwargs):
        defaults = dict(
            title="Default Item", project=self.project,
            category="Bug", priority="HIGH", reported_by=self.user,
        )
        defaults.update(kwargs)
        return WorkItem.objects.create(**defaults)

    # --- Workflow transition tests ---

    def test_cannot_resolve_without_assignee(self):
        item = self._create_item()
        # Move through required states first
        item.status = 'IN_PROGRESS'; item.save()
        item.status = 'REVIEW'; item.save()

        resp = self.client.patch(
            f'/api/work-items/{item.pk}/',
            {'status': 'RESOLVED', 'resolution_note': 'Fixed.'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_resolve_without_resolution_note(self):
        item = self._create_item(assigned_to=self.user)
        item.status = 'IN_PROGRESS'; item.save()
        item.status = 'REVIEW'; item.save()

        resp = self.client.patch(
            f'/api/work-items/{item.pk}/',
            {'status': 'RESOLVED'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_can_resolve_with_assignee_and_note(self):
        item = self._create_item(assigned_to=self.user, resolution_note='', status='REVIEW')
        item.save()

        resp = self.client.patch(
            f'/api/work-items/{item.pk}/',
            {'status': 'RESOLVED', 'resolution_note': 'Fixed it.'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.status, 'RESOLVED')

    def test_cannot_close_from_open(self):
        item = self._create_item()
        resp = self.client.patch(
            f'/api/work-items/{item.pk}/',
            {'status': 'CLOSED'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_transition_rejected(self):
        item = self._create_item()
        resp = self.client.patch(
            f'/api/work-items/{item.pk}/',
            {'status': 'RESOLVED'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_transition_open_to_in_progress(self):
        item = self._create_item()
        resp = self.client.patch(
            f'/api/work-items/{item.pk}/',
            {'status': 'IN_PROGRESS'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # --- Activity recording tests ---

    def test_activity_recorded_on_create(self):
        resp = self.client.post('/api/work-items/', {
            'title': 'New via API', 'project': self.project.pk,
            'category': 'Bug', 'priority': 'LOW',
            'reported_by': self.user.pk,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        pk = resp.data['id']
        self.assertTrue(Activity.objects.filter(work_item_id=pk, activity_type='CREATED').exists())

    def test_activity_recorded_on_status_change(self):
        item = self._create_item()
        self.client.patch(f'/api/work-items/{item.pk}/', {'status': 'IN_PROGRESS'}, format='json')
        self.assertTrue(
            Activity.objects.filter(work_item=item, field_changed='status', new_value='IN_PROGRESS').exists()
        )

    # --- Dashboard tests ---

    def test_dashboard_returns_totals(self):
        self._create_item(status='OPEN')
        self._create_item(status='OPEN')
        self._create_item(status='IN_PROGRESS')

        resp = self.client.get('/api/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total'], 3)
        self.assertEqual(resp.data['open'], 2)
        self.assertEqual(resp.data['in_progress'], 1)

    # --- Reference number in API response ---

    def test_reference_number_present_in_response(self):
        resp = self.client.post('/api/work-items/', {
            'title': 'Ref test', 'project': self.project.pk,
            'category': 'Bug', 'priority': 'LOW',
            'reported_by': self.user.pk,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('reference_number', resp.data)
from django.core.management import call_command
from io import StringIO

class SeedCommandTests(TestCase):
    def test_seed_command_execution(self):
        # Run seed
        out = StringIO()
        call_command('seed', stdout=out)
        
        self.assertIn('Successfully seeded 31 work items', out.getvalue())
        self.assertGreaterEqual(Project.objects.count(), 1)
        self.assertGreaterEqual(User.objects.count(), 3)
        self.assertEqual(WorkItem.objects.count(), 31)
        
        # Verify required states exist
        self.assertTrue(WorkItem.objects.filter(status='OPEN').exists())
        self.assertTrue(WorkItem.objects.filter(status='IN_PROGRESS').exists())
        self.assertTrue(WorkItem.objects.filter(status='RESOLVED').exists())
        
        # Verify relationships (comments/activities)
        self.assertGreaterEqual(Activity.objects.count(), 31)
        
        # Verify idempotency
        out2 = StringIO()
        call_command('seed', stdout=out2)
        self.assertIn('Database is already seeded with at least 30 items', out2.getvalue())
        self.assertEqual(WorkItem.objects.count(), 31)

        # Verify reset
        out3 = StringIO()
        call_command('seed', reset=True, stdout=out3)
        self.assertIn('Resetting database...', out3.getvalue())
        self.assertEqual(WorkItem.objects.count(), 31)
