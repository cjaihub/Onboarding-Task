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
  const BoardScreen({super.key});

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

  final List<String> _columns = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED'];
  final PageController _pageController = PageController(viewportFraction: 0.88);
  int _currentPage = 0;

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
    _pageController.dispose();
    ref.read(webSocketServiceProvider).removeListener(_onWebSocketEvent);
    super.dispose();
  }

  void _onWebSocketEvent() {
    _fetchData(showLoading: false);
  }

  Future<void> _fetchData({bool showLoading = true}) async {
    if (showLoading && _workItems == null) {
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
    } catch (e, stackTrace) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
      debugPrint('Fetch Data Error: $e\n$stackTrace');
    }
  }

  Future<void> _onCardDropped(WorkItem item, String newStatus) async {
    if (item.status == newStatus) return;
    try {
      await _workRepo.transitionStatus(item.id, newStatus, newStatus == 'RESOLVED' ? 'Resolved via drag and drop on board' : null);
      _fetchData(showLoading: false);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to move task: $e', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red));
      }
    }
  }

  Widget _buildStatCard(String label, int value, IconData icon, Color color) {
    return Container(
      width: 135,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.04)),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value.toString(),
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface),
                ),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                ),
              ],
            ),
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
              Text(
                'Engineering Board',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Theme.of(context).colorScheme.onSurface, letterSpacing: -0.5),
              ),
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isLive ? Colors.green.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isLive ? Colors.green.withValues(alpha: 0.2) : Colors.orange.withValues(alpha: 0.2)),
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
          Text(
            'Real-time incident & work tracker',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.54)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsHeader() {
    if (_stats == null) return const SizedBox.shrink();
    
    final active = _stats!.open + _stats!.inProgress;
    
    return SizedBox(
      height: 70,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        physics: const BouncingScrollPhysics(),
        children: [
          _buildStatCard('Active Items', active, Icons.local_activity_rounded, Colors.redAccent),
          _buildStatCard('Critical', _stats!.critical, Icons.warning_rounded, Colors.redAccent),
          _buildStatCard('Overdue', _stats!.overdue, Icons.schedule_rounded, Colors.orangeAccent),
          _buildStatCard('In Review', _stats!.review, Icons.visibility_rounded, Colors.purpleAccent),
        ],
      ),
    );
  }

  Widget _buildPremiumChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildKanbanCard(WorkItem item) {
    final cardContent = Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
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
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), 
                        fontSize: 12, 
                        fontWeight: FontWeight.w600
                      )
                    ),
                    _buildPremiumChip(item.priority, UsalamaTheme.getPriorityColor(item.priority)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  item.title, 
                  style: TextStyle(fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurface, fontSize: 15, height: 1.3)
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(Icons.category_outlined, size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                    const SizedBox(width: 4),
                    Text(
                      item.category,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                    const Spacer(),
                    if (item.comments.isNotEmpty) ...[
                      Icon(Icons.chat_bubble_outline_rounded, size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                      const SizedBox(width: 4),
                      Text('${item.comments.length}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 12, fontWeight: FontWeight.w600)),
                    ]
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );

    return LongPressDraggable<WorkItem>(
      data: item,
      feedback: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        child: Opacity(opacity: 0.9, child: cardContent),
      ),
      childWhenDragging: Opacity(opacity: 0.3, child: cardContent),
      child: cardContent,
    );
  }

  Widget _buildKanbanColumn(String status, List<WorkItem> items, bool isWide) {
    return DragTarget<WorkItem>(
      onWillAccept: (data) => data != null && data.status != status,
      onAccept: (data) => _onCardDropped(data, status),
      builder: (context, candidateData, rejectedData) {
        final isHovering = candidateData.isNotEmpty;
        return Container(
          width: isWide ? 320 : double.infinity,
          margin: EdgeInsets.only(
            right: isWide ? 16 : 8, 
            left: isWide ? 0 : 8,
            bottom: 16,
          ),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isHovering 
                ? UsalamaTheme.primaryRed.withValues(alpha: 0.08) 
                : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.02),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isHovering 
                  ? UsalamaTheme.primaryRed.withValues(alpha: 0.4) 
                  : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
              width: isHovering ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: UsalamaTheme.getStatusColor(status),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          status.replaceAll('_', ' '), 
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text('${items.length}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                    )
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  itemCount: items.length,
                  itemBuilder: (context, idx) {
                    return _buildKanbanCard(items[idx]);
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildKanbanBoard() {
    if (_workItems == null) return const SizedBox.shrink();

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 600;

        if (isWide) {
          // Desktop/Tablet horizontal scrolling kanban board
          return SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: _columns.map((status) {
                final items = _workItems!.where((w) => w.status == status).toList();
                return _buildKanbanColumn(status, items, true);
              }).toList(),
            ),
          );
        } else {
          // Mobile paging kanban board
          return Column(
            children: [
              // Mini column jump bar
              SizedBox(
                height: 36,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _columns.length,
                  itemBuilder: (context, index) {
                    final col = _columns[index];
                    final isActive = _currentPage == index;
                    final count = _workItems!.where((w) => w.status == col).length;
                    
                    return GestureDetector(
                      onTap: () {
                        _pageController.animateToPage(index, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: isActive ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${col.replaceAll('_', ' ')} ($count)',
                          style: TextStyle(
                            color: isActive ? Colors.white : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              // Paging columns
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() => _currentPage = index);
                  },
                  itemCount: _columns.length,
                  itemBuilder: (context, index) {
                    final status = _columns[index];
                    final items = _workItems!.where((w) => w.status == status).toList();
                    return _buildKanbanColumn(status, items, false);
                  },
                ),
              ),
            ],
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: _isLoading && _workItems == null
            ? const LoadingView()
            : _error != null
                ? ErrorView(message: _error!, onRetry: () => _fetchData())
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildBoardHeader(),
                      const SizedBox(height: 12),
                      _buildStatsHeader(),
                      const SizedBox(height: 20),
                      Expanded(child: _buildKanbanBoard()),
                    ],
                  ),
      ),
    );
  }
}
