import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../repositories/project_repository.dart';
import '../../../services/api_service.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../auth/screens/user_profile_screen.dart';
import '../../workflows/screens/workflows_screen.dart';
import 'project_upload_dialog.dart';

class ProjectDetailScreen extends StatefulWidget {
  final int projectId;

  const ProjectDetailScreen({Key? key, required this.projectId}) : super(key: key);

  @override
  _ProjectDetailScreenState createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> with SingleTickerProviderStateMixin {
  final ProjectRepository _repository = ProjectRepository();
  final ApiService _api = ApiService();
  
  late TabController _tabController;
  Project? _project;
  String? _error;
  bool _isLoading = true;

  final TextEditingController _chatController = TextEditingController();
  bool _isSendingChat = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _chatController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final project = await _repository.getProjectDetails(widget.projectId);
      if (mounted) {
        setState(() {
          _project = project;
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

  Future<void> _sendChat() async {
    final msg = _chatController.text.trim();
    if (msg.isEmpty) return;

    setState(() => _isSendingChat = true);
    try {
      await _api.post('/project-comments/', {'project': widget.projectId, 'message': msg});
      _chatController.clear();
      await _fetchData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send message: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSendingChat = false);
    }
  }

  Widget _buildDashboardTab() {
    return RefreshIndicator(
      onRefresh: _fetchData,
      color: UsalamaTheme.primaryRed,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Project Info', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Card(
              color: Theme.of(context).cardColor,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_project!.description != null && _project!.description!.isNotEmpty) ...[
                      Text('Description', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54), fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(_project!.description!),
                      const SizedBox(height: 16),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Type', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54), fontSize: 12)),
                            const SizedBox(height: 4),
                            Text(_project!.projectType),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Created At', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54), fontSize: 12)),
                            const SizedBox(height: 4),
                            Text(_project!.createdAt != null ? '${_project!.createdAt!.year}-${_project!.createdAt!.month}-${_project!.createdAt!.day}' : 'N/A'),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text('Tech Stack', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _project!.techTools.map((tool) => Chip(
                label: Text(tool),
                backgroundColor: UsalamaTheme.primaryRed.withOpacity(0.2),
                labelStyle: const TextStyle(color: UsalamaTheme.primaryRed, fontWeight: FontWeight.bold, fontSize: 12),
                side: BorderSide.none,
              )).toList(),
            ),
            const SizedBox(height: 24),
            Text('Team Members', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ..._project!.membersDetail.map((member) {
              final initials = member.firstName.isNotEmpty && member.lastName.isNotEmpty
                  ? '${member.firstName[0]}${member.lastName[0]}'.toUpperCase()
                  : member.username.substring(0, member.username.length >= 2 ? 2 : 1).toUpperCase();

              return InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => UserProfileScreen(member: member)),
                  );
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 4.0),
                  child: Row(
                    children: [
                      // Avatar
                      member.profile?.avatarUrl.isNotEmpty == true
                          ? CircleAvatar(
                              radius: 22,
                              backgroundImage: NetworkImage(member.profile!.avatarUrl),
                            )
                          : CircleAvatar(
                              radius: 22,
                              backgroundColor: UsalamaTheme.primaryRed.withOpacity(0.2),
                              child: Text(initials,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: UsalamaTheme.primaryRed)),
                            ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(member.fullName.isNotEmpty ? member.fullName : member.username,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                            Text('@${member.username}',
                                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54), fontSize: 12)),
                            if (member.profile?.role.isNotEmpty == true)
                              Text(member.profile!.role,
                                  style: const TextStyle(
                                      color: UsalamaTheme.primaryRed,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.24), size: 18),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentsTab() {
    if (_project!.attachments.isEmpty) {
      return Center(child: Text('No files attached.', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54))));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: _project!.attachments.length,
      itemBuilder: (context, index) {
        final attachment = _project!.attachments[index];
        return Card(
          color: Theme.of(context).cardColor,
          margin: const EdgeInsets.only(bottom: 12.0),
          child: ListTile(
            leading: const Icon(Icons.attach_file, color: UsalamaTheme.primaryRed),
            title: Text(attachment.description),
            subtitle: Text('By ${attachment.uploadedByName} • ${attachment.createdAt?.toString().split(' ')[0] ?? ''}'),
            trailing: IconButton(
              icon: Icon(Icons.download, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54)),
              onPressed: () {
                // Download file logic
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Downloading file...')));
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildChatTab() {
    return Column(
      children: [
        Expanded(
          child: _project!.comments.isEmpty
              ? Center(child: Text('No messages yet. Start the conversation!', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54))))
              : ListView.builder(
                  reverse: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                  itemCount: _project!.comments.length,
                  itemBuilder: (context, index) {
                    final msg = _project!.comments[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 20.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                )
                              ],
                            ),
                            child: CircleAvatar(
                              backgroundColor: UsalamaTheme.primaryRed.withValues(alpha: 0.15),
                              radius: 18,
                              child: Text(
                                msg.authorName.isNotEmpty ? msg.authorName[0].toUpperCase() : '?',
                                style: const TextStyle(fontWeight: FontWeight.w800, color: UsalamaTheme.primaryRed, fontSize: 14),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(msg.authorName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                                    const SizedBox(width: 8),
                                    Text(msg.createdAt != null ? '${msg.createdAt!.hour}:${msg.createdAt!.minute.toString().padLeft(2, '0')}' : '', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 11, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.04),
                                    borderRadius: const BorderRadius.only(
                                      topRight: Radius.circular(16),
                                      bottomLeft: Radius.circular(16),
                                      bottomRight: Radius.circular(16),
                                    ),
                                    border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
                                  ),
                                  child: Text(msg.message, style: const TextStyle(fontSize: 14, height: 1.4)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 12.0),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, -4),
              )
            ],
          ),
          child: SafeArea(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.attach_file_rounded),
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                  onPressed: () {
                    showDialog(context: context, builder: (_) => ProjectUploadDialog(project: _project!)).then((_) => _fetchData());
                  },
                ),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                    ),
                    child: TextField(
                      controller: _chatController,
                      minLines: 1,
                      maxLines: 4,
                      style: const TextStyle(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 14),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        filled: true,
                        fillColor: Colors.transparent,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  margin: const EdgeInsets.only(bottom: 2),
                  decoration: BoxDecoration(
                    color: UsalamaTheme.primaryRed,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: UsalamaTheme.primaryRed.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: IconButton(
                    icon: _isSendingChat 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    onPressed: _isSendingChat ? null : _sendChat,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _project == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Project Details')),
        body: SafeArea(child: ErrorView(message: _error!, onRetry: _fetchData)),
      );
    }

    if (_project == null || (_isLoading && _project == null)) {
      return Scaffold(
        appBar: AppBar(title: const Text('Project Details')),
        body: const SafeArea(child: LoadingView()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_project!.name),
            Container(
              margin: const EdgeInsets.only(top: 4.0),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: _getStatusColor(_project!.status).withOpacity(0.15),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: _getStatusColor(_project!.status).withOpacity(0.3)),
              ),
              child: Text(
                _project!.status.replaceAll('_', ' '),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: _getStatusColor(_project!.status),
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.edit), onPressed: () {}),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: UsalamaTheme.primaryRed,
          labelColor: UsalamaTheme.primaryRed,
          unselectedLabelColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.54),
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: const [
            Tab(icon: Icon(Icons.dashboard, size: 20), text: 'Dashboard'),
            Tab(icon: Icon(Icons.account_tree, size: 20), text: 'Workflows'),
            Tab(icon: Icon(Icons.chat, size: 20), text: 'Chat'),
            Tab(icon: Icon(Icons.attach_file, size: 20), text: 'Files'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDashboardTab(),
          WorkflowsScreen(projectId: widget.projectId),
          _buildChatTab(),
          _buildAttachmentsTab(),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'IN_PROGRESS':
        return Colors.orange;
      case 'ACTIVE':
        return Colors.green;
      case 'ON_HOLD':
        return Colors.amber;
      case 'COMPLETED':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
}

