import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'dart:async';
import '../../../core/theme.dart';
import '../../../models/work_item.dart';
import '../../../repositories/work_item_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import 'work_item_detail_screen.dart';

class WorkItemsScreen extends StatefulWidget {
  const WorkItemsScreen({super.key});

  @override
  _WorkItemsScreenState createState() => _WorkItemsScreenState();
}

class _WorkItemsScreenState extends State<WorkItemsScreen> {
  final WorkItemRepository _repository = WorkItemRepository();
  List<WorkItem>? _workItems;
  String? _error;
  bool _isLoading = true;

  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  Timer? _debounceTimer;
  
  String? _selectedStatus;
  String? _selectedPriority;
  bool _isKanbanView = false; 

  @override
  void initState() {
    super.initState();
    _searchFocusNode.addListener(() {
      setState(() {});
    });
    _fetchData();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchFocusNode.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final items = await _repository.getWorkItems(
        search: _searchController.text,
        status: _selectedStatus,
        priority: _selectedPriority,
      );
      if (mounted) {
        setState(() {
          _workItems = items;
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

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Filter by Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Theme.of(context).colorScheme.onSurface)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED'].map((status) {
                        final isSelected = _selectedStatus == status;
                        return ChoiceChip(
                          label: Text(status),
                          selected: isSelected,
                          selectedColor: UsalamaTheme.primaryRed.withValues(alpha: 0.15),
                          backgroundColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                          labelStyle: TextStyle(
                            color: isSelected ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide.none),
                          onSelected: (selected) {
                            setModalState(() => _selectedStatus = selected ? status : null);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    Text('Filter by Priority', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Theme.of(context).colorScheme.onSurface)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) {
                        final isSelected = _selectedPriority == priority;
                        return ChoiceChip(
                          label: Text(priority),
                          selected: isSelected,
                          selectedColor: UsalamaTheme.primaryRed.withValues(alpha: 0.15),
                          backgroundColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                          labelStyle: TextStyle(
                            color: isSelected ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide.none),
                          onSelected: (selected) {
                            setModalState(() => _selectedPriority = selected ? priority : null);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: UsalamaTheme.primaryRed,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        onPressed: () {
                          Navigator.pop(context);
                          _fetchData();
                        },
                        child: const Text('Apply Filters', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
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

  Widget _buildPremiumCard(WorkItem item) {
    return Dismissible(
      key: Key('work_item_${item.id}'),
      direction: DismissDirection.startToEnd,
      background: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.green.shade400,
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 24),
        child: const Icon(Icons.check_circle_outline, color: Colors.white, size: 32),
      ),
      confirmDismiss: (direction) async {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${item.referenceNumber} marked as resolved!'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.green.shade600,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          )
        );
        return false; // Demo functionality: don't actually dismiss yet.
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
              ).then((_) => _fetchData()); 
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
                          fontWeight: FontWeight.w600, 
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                          fontSize: 12,
                        ),
                      ),
                      Row(
                        children: [
                          _buildPremiumChip(item.status, UsalamaTheme.getStatusColor(item.status)),
                          const SizedBox(width: 6),
                          _buildPremiumChip(item.priority, UsalamaTheme.getPriorityColor(item.priority)),
                        ],
                      )
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    item.title,
                    style: TextStyle(
                      fontSize: 17, 
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.onSurface,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.category_outlined, size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                      const SizedBox(width: 4),
                      Text(
                        item.category,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 12),
                      ),
                      const Spacer(),
                      if (item.comments.isNotEmpty) ...[
                        Icon(Icons.chat_bubble_outline, size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                        const SizedBox(width: 4),
                        Text(
                          '${item.comments.length}',
                          style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 12),
                        ),
                        const SizedBox(width: 12),
                      ],
                      Icon(Icons.arrow_forward_ios, size: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
                    ],
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKanbanCard(WorkItem item) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 5,
            offset: const Offset(0, 2),
          )
        ],
        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => WorkItemDetailScreen(workItemId: item.id),
              ),
            ).then((_) => _fetchData());
          },
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(item.referenceNumber, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), fontSize: 11, fontWeight: FontWeight.w600)),
                    _buildPremiumChip(item.priority, UsalamaTheme.getPriorityColor(item.priority)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(item.title, style: TextStyle(fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurface, fontSize: 14)),
                if (item.comments.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Icon(Icons.chat_bubble_outline, size: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                      const SizedBox(width: 4),
                      Text('${item.comments.length}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 11)),
                    ],
                  )
                ]
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKanbanView() {
    final statuses = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED'];
    return PageView.builder(
      itemCount: statuses.length,
      controller: PageController(viewportFraction: 0.88),
      itemBuilder: (context, index) {
        final status = statuses[index];
        final items = _workItems!.where((w) => w.status == status).toList();

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor, // slightly offset background
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
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
                        Text(status.replaceAll('_', ' '), style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)),
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

  Widget _buildSearchBar() {
    final isFocused = _searchFocusNode.hasFocus;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 48,
        decoration: BoxDecoration(
          color: isFocused ? Theme.of(context).colorScheme.surface : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isFocused ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.08),
            width: isFocused ? 1.5 : 1.0,
          ),
          boxShadow: isFocused ? [
            BoxShadow(
              color: UsalamaTheme.primaryRed.withValues(alpha: 0.15),
              blurRadius: 12,
              offset: const Offset(0, 4),
            )
          ] : null,
        ),
        child: TextField(
          controller: _searchController,
          focusNode: _searchFocusNode,
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
          onChanged: (value) {
            if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
            _debounceTimer = Timer(const Duration(milliseconds: 500), () {
              _fetchData();
            });
            // Update suffix icon visibility
            setState(() {}); 
          },
          onSubmitted: (_) => _fetchData(),
          decoration: InputDecoration(
            hintText: 'Search work tasks...',
            hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
            prefixIcon: Icon(Icons.search, color: isFocused ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
            suffixIcon: _searchController.text.isNotEmpty ? IconButton(
              icon: Icon(Icons.clear, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
              onPressed: () {
                _searchController.clear();
                _fetchData();
                setState(() {});
              },
            ) : null,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickFilters() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
      child: Row(
        children: [
          _buildQuickFilterChip('All', null),
          const SizedBox(width: 8),
          _buildQuickFilterChip('Open', 'OPEN'),
          const SizedBox(width: 8),
          _buildQuickFilterChip('In Progress', 'IN_PROGRESS'),
          const SizedBox(width: 8),
          _buildQuickFilterChip('Review', 'REVIEW'),
          const SizedBox(width: 8),
          _buildQuickFilterChip('Resolved', 'RESOLVED'),
        ],
      ),
    );
  }

  Widget _buildQuickFilterChip(String label, String? statusValue) {
    final isSelected = _selectedStatus == statusValue;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedStatus = statusValue;
        });
        _fetchData();
      },
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          'Work Tasks',
          style: TextStyle(fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface),
        ),
        centerTitle: false,
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(_isKanbanView ? Icons.view_list_rounded : Icons.view_kanban_rounded, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () {
              setState(() {
                _isKanbanView = !_isKanbanView;
              });
            },
            tooltip: 'Toggle Kanban View',
          ),
          IconButton(
            icon: Icon(
              Icons.tune_rounded,
              color: (_selectedStatus != null || _selectedPriority != null) ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface,
            ),
            onPressed: _showFilterSheet,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(),
            _buildQuickFilters(),
            const SizedBox(height: 8),
            Expanded(
              child: _buildBody(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_error != null && _workItems == null) {
      return ErrorView(message: _error!, onRetry: _fetchData);
    }

    if (_workItems == null || (_isLoading && _workItems == null)) {
      return const LoadingView();
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      color: UsalamaTheme.primaryRed,
      backgroundColor: Theme.of(context).colorScheme.surface,
      child: _workItems!.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 100),
                Center(
                  child: Column(
                    children: [
                      Icon(Icons.inbox_rounded, size: 64, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2)),
                      const SizedBox(height: 16),
                      Text('No work tasks found.', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.54), fontSize: 16)),
                    ],
                  )
                ),
              ],
            )
          : _isKanbanView
              ? _buildKanbanView()
              : LayoutBuilder(
                  builder: (context, constraints) {
                    if (constraints.maxWidth > 600) {
                      return GridView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 8.0),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 2.5,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                        ),
                        physics: const AlwaysScrollableScrollPhysics(),
                        itemCount: _workItems!.length,
                        itemBuilder: (context, index) {
                          return _buildPremiumCard(_workItems![index]);
                        },
                      );
                    } else {
                      return ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        physics: const AlwaysScrollableScrollPhysics(),
                        itemCount: _workItems!.length,
                        itemBuilder: (context, index) {
                          return _buildPremiumCard(_workItems![index]);
                        },
                      );
                    }
                  }
                ),
    );
  }
}
