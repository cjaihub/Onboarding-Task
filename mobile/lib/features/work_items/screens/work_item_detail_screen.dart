import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../core/utils/auth_interceptor.dart';
import '../../../models/work_item.dart';
import '../../../models/comment.dart';
import '../../../repositories/work_item_repository.dart';
import '../../../services/api_service.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';

class WorkItemDetailScreen extends ConsumerStatefulWidget {
  final int workItemId;

  const WorkItemDetailScreen({Key? key, required this.workItemId}) : super(key: key);

  @override
  ConsumerState<WorkItemDetailScreen> createState() => _WorkItemDetailScreenState();
}

class _WorkItemDetailScreenState extends ConsumerState<WorkItemDetailScreen> {
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
        _scrollToBottom();
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

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isPostingComment = true);

    try {
      await _repository.addComment(widget.workItemId, text);
      _commentController.clear();
      // Keep keyboard open like WhatsApp for rapid chatting
      await _fetchData(); 
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

  void _showAttachmentMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.insert_photo, color: Colors.blue),
              title: const Text('Photo & Video Library'),
              onTap: () {
                Navigator.pop(context);
                requireAuth(context, ref, () {
                  // Photo action
                });
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.green),
              title: const Text('Camera / Visual Feedback'),
              onTap: () {
                Navigator.pop(context);
                requireAuth(context, ref, () {
                  // Camera action
                });
              },
            ),
            ListTile(
              leading: const Icon(Icons.insert_drive_file, color: Colors.orange),
              title: const Text('Document'),
              onTap: () {
                Navigator.pop(context);
                requireAuth(context, ref, () {
                  // Document action
                });
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showTransitionModal() {
    if (_workItem == null) return;
    
    String selectedStatus = _workItem!.status;
    String resolutionNote = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
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
                      Navigator.pop(context);
                      setState(() => _isLoading = true);
                      
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

  Widget _buildCommentBubble(Comment c) {
    // Determine if it's the current user (mock check)
    final isMe = c.authorName?.toLowerCase().contains('cj') ?? false;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe 
              ? theme.primaryColor 
              : (isDark ? Colors.grey[800] : Colors.grey[200]),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 2,
              offset: const Offset(0, 1),
            )
          ]
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMe)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  c.authorName ?? 'Unknown', 
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    fontSize: 12,
                    color: isDark ? theme.primaryColorLight : theme.primaryColor
                  )
                ),
              ),
            Text(
              c.message,
              style: TextStyle(
                color: isMe ? Colors.white : theme.colorScheme.onSurface,
                fontSize: 15,
              ),
            ),
            if (c.createdAt != null)
              Align(
                alignment: Alignment.bottomRight,
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    '${c.createdAt!.hour}:${c.createdAt!.minute.toString().padLeft(2, '0')}', 
                    style: TextStyle(
                      color: isMe ? Colors.white70 : (isDark ? Colors.grey[400] : Colors.grey[600]), 
                      fontSize: 10
                    )
                  ),
                ),
              ),
          ],
        ),
      ),
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.referenceNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(item.title, style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface.withOpacity(0.7)), overflow: TextOverflow.ellipsis),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.compare_arrows),
            onPressed: () {
              requireAuth(context, ref, () {
                _showTransitionModal();
              });
            },
            tooltip: 'Transition Status',
          ),
        ],
      ),
      // Use Scaffold backgroundColor for the chat background (often slightly off-white or dark)
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: RefreshIndicator(
                onRefresh: _fetchData,
                color: UsalamaTheme.primaryRed,
                child: ListView.builder(
                  controller: _scrollController,
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16.0),
                  itemCount: 2 + item.comments.length, // Details + Divider + Comments
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      // Work Item Details Header
                      return Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: theme.cardTheme.color,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: theme.cardTheme.elevation != null ? [
                            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))
                          ] : null,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.title, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                Chip(
                                  label: Text(item.status),
                                  backgroundColor: UsalamaTheme.getStatusColor(item.status),
                                  labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                Chip(
                                  label: Text(item.priority),
                                  backgroundColor: UsalamaTheme.getPriorityColor(item.priority),
                                  labelStyle: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                if (item.tags != null)
                                  ...item.tags!.map((t) => Chip(
                                    label: Text(t),
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  )),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (item.description != null && item.description!.isNotEmpty) ...[
                              Text('Description', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.5), fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text(item.description!, style: const TextStyle(fontSize: 15)),
                            ],
                          ],
                        ),
                      );
                    } else if (index == 1) {
                      // Divider before comments
                      if (item.comments.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 32),
                            child: Text('No comments yet. Start the discussion!', style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.5))),
                          )
                        );
                      }
                      return const SizedBox(height: 8); // Just a little spacing
                    } else {
                      // Comments
                      final commentIndex = index - 2;
                      return _buildCommentBubble(item.comments[commentIndex]);
                    }
                  },
                ),
              ),
            ),
            
            // WhatsApp Style Comment Input Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: theme.appBarTheme.backgroundColor,
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(isDark ? 0.3 : 0.05), offset: const Offset(0, -1), blurRadius: 3)
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  IconButton(
                    icon: Icon(Icons.add, color: theme.primaryColor, size: 28),
                    onPressed: _showAttachmentMenu,
                    constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                    padding: EdgeInsets.zero,
                  ),
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 2),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.grey[850] : Colors.grey[200],
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _commentController,
                        textCapitalization: TextCapitalization.sentences,
                        minLines: 1,
                        maxLines: 5,
                        decoration: InputDecoration(
                          hintText: 'Message',
                          hintStyle: TextStyle(color: isDark ? Colors.grey[500] : Colors.grey[600]),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          fillColor: Colors.transparent,
                        ),
                        onChanged: (text) => setState(() {}), // To trigger send button icon update
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    margin: const EdgeInsets.only(bottom: 2),
                    decoration: BoxDecoration(
                      color: theme.primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child: _isPostingComment
                      ? const Padding(
                          padding: EdgeInsets.all(12), 
                          child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        )
                      : IconButton(
                          icon: Icon(
                            _commentController.text.trim().isEmpty ? Icons.mic : Icons.send, 
                            color: Colors.white, 
                            size: 20
                          ),
                          onPressed: _commentController.text.trim().isEmpty 
                            ? null 
                            : () {
                                requireAuth(context, ref, () {
                                  _postComment();
                                });
                              },
                        ),
                  ),
                  const SizedBox(width: 4),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
