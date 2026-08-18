import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/work_item.dart';
import '../../../repositories/work_item_repository.dart';
import '../../../services/api_service.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';

class WorkItemDetailScreen extends StatefulWidget {
  final int workItemId;

  const WorkItemDetailScreen({Key? key, required this.workItemId}) : super(key: key);

  @override
  _WorkItemDetailScreenState createState() => _WorkItemDetailScreenState();
}

class _WorkItemDetailScreenState extends State<WorkItemDetailScreen> {
  final WorkItemRepository _repository = WorkItemRepository();
  final TextEditingController _commentController = TextEditingController();
  
  WorkItem? _workItem;
  String? _error;
  bool _isLoading = true;
  bool _isPostingComment = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final item = await _repository.getWorkItemDetails(widget.workItemId);
      if (mounted) {
        setState(() {
          _workItem = item;
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

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isPostingComment = true);

    try {
      await _repository.addComment(widget.workItemId, text);
      _commentController.clear();
      FocusScope.of(context).unfocus(); // Dismiss keyboard
      await _fetchData(); // Refresh the whole item to get the latest comments
      
      // Auto-scroll to bottom after rendering
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      if (mounted) {
        String msg = e.toString();
        if (e is ApiException) msg = e.toString();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isPostingComment = false);
    }
  }

  void _showTransitionModal() {
    if (_workItem == null) return;
    
    String selectedStatus = _workItem!.status;
    String resolutionNote = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: UsalamaTheme.surfaceDark,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 16,
                right: 16,
                top: 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Update Status', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: selectedStatus,
                    items: ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED']
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (val) {
                      setModalState(() => selectedStatus = val!);
                    },
                    decoration: const InputDecoration(labelText: 'Status'),
                  ),
                  if (selectedStatus == 'RESOLVED') ...[
                    const SizedBox(height: 16),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Resolution Note', alignLabelWithHint: true),
                      onChanged: (val) => resolutionNote = val,
                      maxLines: 3,
                    ),
                  ],
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(context); // Close modal
                      setState(() => _isLoading = true); // Show loading on main screen
                      
                      try {
                        await _repository.transitionStatus(widget.workItemId, selectedStatus, resolutionNote);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status updated successfully.'), backgroundColor: Colors.green));
                        }
                        await _fetchData();
                      } catch (e) {
                        if (mounted) {
                          setState(() => _isLoading = false);
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(e.toString()),
                            backgroundColor: Colors.red,
                            duration: const Duration(seconds: 5),
                          ));
                        }
                      }
                    },
                    child: const Text('Save Changes'),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _workItem == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: SafeArea(child: ErrorView(message: _error!, onRetry: _fetchData)),
      );
    }

    if (_workItem == null || _isLoading && _workItem == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Loading')),
        body: const SafeArea(child: LoadingView()),
      );
    }

    final item = _workItem!;

    return Scaffold(
      appBar: AppBar(
        title: Text(item.referenceNumber),
        actions: [
          IconButton(
            icon: const Icon(Icons.compare_arrows),
            onPressed: _showTransitionModal,
            tooltip: 'Transition Status',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: RefreshIndicator(
                onRefresh: _fetchData,
                color: UsalamaTheme.primaryRed,
                child: SingleChildScrollView(
                  controller: _scrollController,
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header Section
                      Text(item.title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Chip(
                            label: Text(item.status),
                            backgroundColor: UsalamaTheme.getStatusColor(item.status),
                            labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 8),
                          Chip(
                            label: Text(item.priority),
                            backgroundColor: UsalamaTheme.getPriorityColor(item.priority),
                            labelStyle: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                          ),
                          const Spacer(),
                          Text(item.category, style: const TextStyle(color: Colors.white54, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (item.description != null && item.description!.isNotEmpty) ...[
                        const Text('Description', style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(item.description!, style: const TextStyle(fontSize: 16)),
                        const SizedBox(height: 24),
                      ],
                      
                      const Divider(color: Colors.white12),
                      const SizedBox(height: 16),
                      
                      const Text('Comments', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      
                      if (item.comments.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Center(child: Text('No comments yet.', style: TextStyle(color: Colors.white54))),
                        )
                      else
                        ...item.comments.map((c) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.black26,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(c.authorName ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold, color: UsalamaTheme.primaryRed)),
                                    if (c.createdAt != null)
                                      Text('${c.createdAt!.month}/${c.createdAt!.day} ${c.createdAt!.hour}:${c.createdAt!.minute.toString().padLeft(2, '0')}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(c.message),
                              ],
                            ),
                          ),
                        )),
                    ],
                  ),
                ),
              ),
            ),
            
            // Comment Input Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: const BoxDecoration(
                color: UsalamaTheme.surfaceDark,
                boxShadow: [BoxShadow(color: Colors.black26, offset: Offset(0, -2), blurRadius: 4)],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      decoration: const InputDecoration(hintText: 'Type a comment...'),
                      maxLines: null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  _isPostingComment
                    ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)))
                    : IconButton(
                        icon: const Icon(Icons.send, color: UsalamaTheme.primaryRed),
                        onPressed: _postComment,
                      )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
