import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../repositories/dashboard_repository.dart';
import '../../../repositories/work_item_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../notifications/screens/notifications_modal.dart';
import '../../../models/dashboard_stats.dart';
import '../../../models/activity.dart';
import '../../../models/work_item.dart';
import '../../navigation/widgets/app_drawer.dart';
import '../../work_items/screens/work_item_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final DashboardRepository _dashboardRepo = DashboardRepository();
  final WorkItemRepository _workItemRepo = WorkItemRepository();
  
  DashboardStats? _stats;
  List<WorkItem>? _attentionItems;
  List<WorkItem>? _upcomingItems;
  
  String? _error;
  bool _isLoading = true;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final stats = await _dashboardRepo.getDashboardStats();
      final attention = await _workItemRepo.getWorkItems(status: 'OPEN', priority: 'CRITICAL', pageSize: 3);
      final upcoming = await _workItemRepo.getWorkItems(status: 'OPEN', pageSize: 3);

      if (mounted) {
        setState(() {
          _stats = stats;
          _attentionItems = attention;
          _upcomingItems = upcoming;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildTopMetric(String label, dynamic count, Color color) {
    return Padding(
      padding: const EdgeInsets.only(right: 16.0),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(
            '$label ($count)',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, {IconData? icon, Color? iconColor, String actionText = 'View all'}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: iconColor ?? Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Text(
              title,
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurface),
            ),
          ),
          if (actionText.isNotEmpty)
            Text(
              actionText,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: UsalamaTheme.primaryRed),
            ),
        ],
      ),
    );
  }

  Widget _buildWorkItemTile(WorkItem item, {bool isAttention = false}) {
    return InkWell(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (_) => WorkItemDetailScreen(workItemId: item.id)));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 14.0),
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.04))),
        ),
        child: Row(
          children: [
            Icon(
              isAttention ? Icons.error_outline : Icons.task_alt,
              size: 18,
              color: isAttention ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withOpacity(0.3),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${item.referenceNumber ?? "N/A"} • Due: None',
                    style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4)),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, size: 16, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.2)),
          ],
        ),
      ),
    );
  }

  Widget _buildPriorityRow(String label, int count, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7)),
              ),
            ],
          ),
          Text(
            count.toString(),
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityItem(Activity activity) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 14.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 4),
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurface.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.activityType == 'CREATED' ? 'Created' :
                  activity.activityType == 'UPDATED' ? 'Updated' : 'Commented',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface.withOpacity(0.9)),
                ),
                const SizedBox(height: 6),
                RichText(
                  text: TextSpan(
                    style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface.withOpacity(0.5)),
                    children: [
                      TextSpan(
                        text: 'Item #${activity.workItemId}',
                        style: const TextStyle(color: UsalamaTheme.primaryRed, fontWeight: FontWeight.w600),
                      ),
                      TextSpan(text: ' was ${activity.activityType.toLowerCase()} by '),
                      TextSpan(
                        text: activity.actorName ?? 'System',
                        style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.8), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${activity.timestamp.month}/${activity.timestamp.day}/${activity.timestamp.year} ${activity.timestamp.hour}:${activity.timestamp.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurface.withOpacity(0.3)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _stats == null) {
      return Scaffold(
        key: _scaffoldKey,
        drawer: const AppDrawer(),
        appBar: AppBar(title: const Text('Dashboard')),
        body: SafeArea(child: ErrorView(message: _error!, onRetry: _fetchData)),
      );
    }

    if (_stats == null || (_isLoading && _stats == null)) {
      return Scaffold(
        key: _scaffoldKey,
        drawer: const AppDrawer(),
        appBar: AppBar(title: const Text('Dashboard')),
        body: const SafeArea(child: LoadingView()),
      );
    }

    final theme = Theme.of(context);

    // Prepare priority counts
    int highCount = _stats!.byPriority['HIGH'] ?? 0;
    int mediumCount = _stats!.byPriority['MEDIUM'] ?? 0;
    int lowCount = _stats!.byPriority['LOW'] ?? 0;

    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(),
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: Icon(Icons.menu, color: theme.colorScheme.onSurface),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: UsalamaTheme.primaryRed.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.shield, color: UsalamaTheme.primaryRed, size: 18),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Usalama', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: theme.colorScheme.onSurface)),
                Text('ENGINEERING OPERATIONS', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: theme.colorScheme.onSurface.withOpacity(0.4), letterSpacing: 1.2)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.search, size: 20, color: theme.colorScheme.onSurface.withOpacity(0.5)),
            onPressed: () {},
          ),
          IconButton(
            icon: Stack(
              children: [
                Icon(Icons.notifications_none, size: 20, color: theme.colorScheme.onSurface.withOpacity(0.5)),
                Positioned(
                  right: 2,
                  top: 2,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(color: UsalamaTheme.primaryRed, shape: BoxShape.circle),
                  ),
                )
              ],
            ),
            onPressed: () => showNotificationsModal(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchData,
          color: UsalamaTheme.primaryRed,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Dashboard', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: theme.colorScheme.onSurface)),
                      const SizedBox(height: 4),
                      Text('Overview of your engineering operations', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurface.withOpacity(0.4))),
                    ],
                  ),
                ),
                
                // Top Metrics Strip
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildTopMetric('Open', _stats!.byStatus['OPEN'] ?? 0, Colors.grey.shade500),
                        _buildTopMetric('In Progress', _stats!.byStatus['IN_PROGRESS'] ?? 0, Colors.orange),
                        _buildTopMetric('Review', _stats!.byStatus['REVIEW'] ?? 0, Colors.purple),
                        _buildTopMetric('Resolved', _stats!.byStatus['RESOLVED'] ?? 0, Colors.green),
                        _buildTopMetric('Closed', _stats!.byStatus['CLOSED'] ?? 0, Colors.grey.shade800),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Attention Required
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                  ),
                  child: Column(
                    children: [
                      _buildSectionHeader('Attention Required', icon: Icons.error_outline, iconColor: UsalamaTheme.primaryRed),
                      if (_attentionItems == null || _attentionItems!.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Text('All clear!', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.3))),
                        )
                      else
                        ..._attentionItems!.map((item) => _buildWorkItemTile(item, isAttention: true)),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Priorities
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: 4),
                      _buildPriorityRow('High', highCount, Colors.orange.shade700),
                      _buildPriorityRow('Medium', mediumCount, Colors.amber),
                      _buildPriorityRow('Low', lowCount, Colors.teal),
                      const SizedBox(height: 4),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // My Upcoming
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                  ),
                  child: Column(
                    children: [
                      _buildSectionHeader('My Upcoming', icon: Icons.calendar_today_outlined, actionText: ''),
                      if (_upcomingItems == null || _upcomingItems!.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Text('No upcoming tasks.', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.3))),
                        )
                      else
                        ..._upcomingItems!.map((item) => _buildWorkItemTile(item)),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Recent Activity
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                  ),
                  child: Column(
                    children: [
                      _buildSectionHeader('Recent Activity', icon: Icons.history, actionText: ''),
                      if (_stats!.recentActivity.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Text('No recent activity.', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.3))),
                        )
                      else
                        ..._stats!.recentActivity.take(5).map((activity) {
                           return Container(
                             decoration: BoxDecoration(
                               border: Border(top: BorderSide(color: Colors.white.withOpacity(0.04))),
                             ),
                             child: _buildActivityItem(activity),
                           );
                        }),
                    ],
                  ),
                ),
                
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
