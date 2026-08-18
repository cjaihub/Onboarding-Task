import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/work_item.dart';
import '../../../repositories/work_item_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import 'work_item_detail_screen.dart';

class WorkItemsScreen extends StatefulWidget {
  const WorkItemsScreen({Key? key}) : super(key: key);

  @override
  _WorkItemsScreenState createState() => _WorkItemsScreenState();
}

class _WorkItemsScreenState extends State<WorkItemsScreen> {
  final WorkItemRepository _repository = WorkItemRepository();
  List<WorkItem>? _workItems;
  String? _error;
  bool _isLoading = true;

  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  
  String? _selectedStatus;
  String? _selectedPriority;
  bool _isKanbanView = false; // Toggle between list and kanban

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
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
      backgroundColor: UsalamaTheme.surfaceDark,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Filter by Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED'].map((status) {
                        return ChoiceChip(
                          label: Text(status),
                          selected: _selectedStatus == status,
                          selectedColor: UsalamaTheme.primaryRed.withOpacity(0.2),
                          onSelected: (selected) {
                            setModalState(() => _selectedStatus = selected ? status : null);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    const Text('Filter by Priority', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) {
                        return ChoiceChip(
                          label: Text(priority),
                          selected: _selectedPriority == priority,
                          selectedColor: UsalamaTheme.primaryRed.withOpacity(0.2),
                          onSelected: (selected) {
                            setModalState(() => _selectedPriority = selected ? priority : null);
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: UsalamaTheme.primaryRed),
                        onPressed: () {
                          Navigator.pop(context);
                          _fetchData();
                        },
                        child: const Text('Apply Filters', style: TextStyle(color: Colors.white)),
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

  Widget _buildCard(WorkItem item) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => WorkItemDetailScreen(workItemId: item.id),
            ),
          ).then((_) => _fetchData()); // Refresh when coming back
        },
        borderRadius: BorderRadius.circular(8),
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
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white54),
                  ),
                  Row(
                    children: [
                      Chip(
                        label: Text(item.status),
                        backgroundColor: UsalamaTheme.getStatusColor(item.status),
                        labelStyle: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        visualDensity: VisualDensity.compact,
                      ),
                      const SizedBox(width: 4),
                      Chip(
                        label: Text(item.priority),
                        backgroundColor: UsalamaTheme.getPriorityColor(item.priority),
                        labelStyle: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  )
                ],
              ),
              const SizedBox(height: 8),
              Text(
                item.title,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKanbanCard(WorkItem item) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
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
              Text(item.referenceNumber, style: const TextStyle(color: Colors.white54, fontSize: 12)),
              const SizedBox(height: 4),
              Text(item.title, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Chip(
                label: Text(item.priority),
                backgroundColor: UsalamaTheme.getPriorityColor(item.priority),
                labelStyle: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKanbanView() {
    final statuses = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED'];
    return PageView.builder(
      itemCount: statuses.length,
      controller: PageController(viewportFraction: 0.85),
      itemBuilder: (context, index) {
        final status = statuses[index];
        final items = _workItems!.where((w) => w.status == status).toList();

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: UsalamaTheme.surfaceDark,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(status, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: UsalamaTheme.primaryRed,
                      child: Text('${items.length}', style: const TextStyle(fontSize: 12, color: Colors.white)),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Search items...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                ),
                onSubmitted: (_) => _fetchData(),
              )
            : const Text('Work Items'),
        actions: [
          IconButton(
            icon: Icon(_isKanbanView ? Icons.view_list : Icons.view_week),
            onPressed: () {
              setState(() {
                _isKanbanView = !_isKanbanView;
              });
            },
            tooltip: 'Toggle Kanban View',
          ),
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _isSearching = false;
                  _searchController.clear();
                  _fetchData();
                } else {
                  _isSearching = true;
                }
              });
            },
          ),
          IconButton(
            icon: Icon(
              Icons.filter_list,
              color: (_selectedStatus != null || _selectedPriority != null) ? UsalamaTheme.primaryRed : Colors.white,
            ),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: SafeArea(
        child: _buildBody(),
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
      child: _workItems!.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 100),
                Center(child: Text('No work items found.', style: TextStyle(color: Colors.white54))),
              ],
            )
          : _isKanbanView
              ? _buildKanbanView()
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: _workItems!.length,
                  itemBuilder: (context, index) {
                    return _buildCard(_workItems![index]);
                  },
                ),
    );
  }
}
