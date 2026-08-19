import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../models/work_item.dart';
import '../../../models/dashboard_stats.dart';
import '../../../repositories/work_item_repository.dart';
import '../../../repositories/dashboard_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../work_items/screens/work_item_detail_screen.dart';
import '../../../services/websocket_service.dart';
import '../../../services/api_service.dart';

class BoardScreen extends ConsumerStatefulWidget {
  const BoardScreen({Key? key}) : super(key: key);

  @override
  _BoardScreenState createState() => _BoardScreenState();
}

class _BoardScreenState extends ConsumerState<BoardScreen> {
  final WorkItemRepository _workRepo = WorkItemRepository();
  final DashboardRepository _dashRepo = DashboardRepository();
  
  List<WorkItem>? _workItems;
  DashboardStats? _stats;
  String? _error;
  bool _isLoading = true;

  String _activeColumn = 'OPEN';
  final List<String> _columns = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED'];

  @override
  void initState() {
    super.initState();
    _fetchData();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final wsService = ref.read(webSocketServiceProvider);
      wsService.connect('${ApiService.wsBaseUrl}/board/');
      wsService.addListener(_onWebSocketEvent);
    });
  }

  @override
  void dispose() {
    ref.read(webSocketServiceProvider).removeListener(_onWebSocketEvent);
    super.dispose();
  }

  void _onWebSocketEvent() {
    // Refresh data on websocket event
    _fetchData(showLoading: false);
  }

  Future<void> _fetchData({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final items = await _workRepo.getWorkItems(pageSize: 200);
      final stats = await _dashRepo.getDashboardStats();
      if (mounted) {
        setState(() {
          _workItems = items;
          _stats = stats;
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

  Widget _buildStatCard(String label, int value, IconData icon, Color color) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                value.toString(),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: Colors.white54),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBoardHeader() {
    final isLive = ref.watch(webSocketServiceProvider).isConnected;
    
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Engineering Board',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isLive ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: isLive ? Colors.green.withOpacity(0.2) : Colors.orange.withOpacity(0.2)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle, size: 8, color: isLive ? Colors.greenAccent : Colors.orangeAccent),
                    const SizedBox(width: 6),
                    Text(
                      isLive ? 'Live' : 'Connecting',
                      style: TextStyle(color: isLive ? Colors.greenAccent : Colors.orangeAccent, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Real-time incident & work tracker',
            style: TextStyle(fontSize: 12, color: Colors.white54),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsHeader() {
    if (_stats == null) return const SizedBox.shrink();
    
    // Calculate custom stats to match web
    final active = _stats!.open + _stats!.inProgress;
    
    return SizedBox(
      height: 80,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _buildStatCard('Active Items', active, Icons.local_activity, Colors.redAccent),
          _buildStatCard('Critical', _stats!.critical, Icons.warning, Colors.redAccent),
          _buildStatCard('Overdue', _stats!.overdue, Icons.schedule, Colors.orangeAccent),
          _buildStatCard('In Review', _stats!.review, Icons.visibility, Colors.purpleAccent),
        ],
      ),
    );
  }

  Widget _buildColumnSwitcher() {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _columns.length,
        itemBuilder: (context, index) {
          final col = _columns[index];
          final isActive = _activeColumn == col;
          
          // Get count for column
          final count = _workItems?.where((w) => w.status == col).length ?? 0;
          
          return GestureDetector(
            onTap: () => setState(() => _activeColumn = col),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isActive ? UsalamaTheme.primaryRed : Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isActive ? UsalamaTheme.primaryRed : Colors.transparent),
              ),
              alignment: Alignment.center,
              child: Text(
                '${col.replaceAll('_', ' ')} ($count)',
                style: TextStyle(
                  color: isActive ? Colors.white : Colors.white54,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCard(WorkItem item) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      color: UsalamaTheme.surfaceDark,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.white.withOpacity(0.05)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => WorkItemDetailScreen(workItemId: item.id),
            ),
          ).then((_) => _fetchData(showLoading: false));
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    item.referenceNumber,
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white.withOpacity(0.4), fontSize: 12),
                  ),
                  Chip(
                    label: Text(item.priority),
                    backgroundColor: UsalamaTheme.getPriorityColor(item.priority),
                    labelStyle: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold),
                    visualDensity: VisualDensity.compact,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  )
                ],
              ),
              const SizedBox(height: 8),
              Text(
                item.title,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.message, size: 14, color: Colors.white.withOpacity(0.4)),
                  const SizedBox(width: 4),
                  Text('${item.comments.length}', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => _fetchData(showLoading: false),
          color: UsalamaTheme.primaryRed,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildBoardHeader(),
              const SizedBox(height: 16),
              _buildStatsHeader(),
              const SizedBox(height: 24),
              _buildColumnSwitcher(),
              const SizedBox(height: 16),
              
              // Board Content
              Expanded(
                child: _isLoading && _workItems == null
                    ? const LoadingView()
                    : _error != null
                        ? ErrorView(message: _error!, onRetry: () => _fetchData())
                        : ListView.builder(
                            physics: const AlwaysScrollableScrollPhysics(),
                            itemCount: _workItems!.where((w) => w.status == _activeColumn).length,
                            itemBuilder: (context, index) {
                              final items = _workItems!.where((w) => w.status == _activeColumn).toList();
                              return _buildCard(items[index]);
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
