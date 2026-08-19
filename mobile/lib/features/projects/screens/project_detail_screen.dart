import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../repositories/project_repository.dart';
import '../../../services/api_service.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../auth/screens/user_profile_screen.dart';
import '../../workflows/screens/workflows_screen.dart';

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
      await _api.post('/projects/${widget.projectId}/comments/', {'message': msg});
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
              color: UsalamaTheme.cardBackground,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_project!.description != null && _project!.description!.isNotEmpty) ...[
                      const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white54, fontSize: 12)),
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
                            const Text('Type', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white54, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text(_project!.projectType),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Created At', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white54, fontSize: 12)),
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
                                style: const TextStyle(color: Colors.white54, fontSize: 12)),
                            if (member.profile?.role.isNotEmpty == true)
                              Text(member.profile!.role,
                                  style: const TextStyle(
                                      color: UsalamaTheme.primaryRed,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: Colors.white24, size: 18),
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
      return const Center(child: Text('No files attached.', style: TextStyle(color: Colors.white54)));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: _project!.attachments.length,
      itemBuilder: (context, index) {
        final attachment = _project!.attachments[index];
        return Card(
          color: UsalamaTheme.cardBackground,
          margin: const EdgeInsets.only(bottom: 12.0),
          child: ListTile(
            leading: const Icon(Icons.attach_file, color: UsalamaTheme.primaryRed),
            title: Text(attachment.description),
            subtitle: Text('By ${attachment.uploadedByName} • ${attachment.createdAt?.toString().split(' ')[0] ?? ''}'),
            trailing: IconButton(
              icon: const Icon(Icons.download, color: Colors.white54),
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
              ? const Center(child: Text('No messages yet. Start the conversation!', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: _project!.comments.length,
                  itemBuilder: (context, index) {
                    final msg = _project!.comments[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            backgroundColor: Colors.grey.shade800,
                            radius: 16,
                            child: Text(msg.authorName.isNotEmpty ? msg.authorName[0].toUpperCase() : '?'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(msg.authorName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    const SizedBox(width: 8),
                                    Text(msg.createdAt != null ? '${msg.createdAt!.hour}:${msg.createdAt!.minute.toString().padLeft(2, '0')}' : '', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: UsalamaTheme.cardBackground,
                                    borderRadius: const BorderRadius.only(
                                      topRight: Radius.circular(12),
                                      bottomLeft: Radius.circular(12),
                                      bottomRight: Radius.circular(12),
                                    ),
                                  ),
                                  child: Text(msg.message),
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
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          decoration: BoxDecoration(
            color: UsalamaTheme.cardBackground,
            border: Border(top: BorderSide(color: Colors.grey.shade800)),
          ),
          child: SafeArea(
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _chatController,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: InputBorder.none,
                    ),
                    maxLines: null,
                  ),
                ),
                IconButton(
                  icon: _isSendingChat 
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.send, color: UsalamaTheme.primaryRed),
                  onPressed: _isSendingChat ? null : _sendChat,
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
        title: Text(_project!.name),
        actions: [
          IconButton(icon: const Icon(Icons.edit), onPressed: () {}),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: UsalamaTheme.primaryRed,
          tabs: const [
            Tab(icon: Icon(Icons.dashboard, size: 20), text: 'Dashboard'),
            Tab(icon: Icon(Icons.account_tree, size: 20), text: 'Workflows'),
            Tab(icon: Icon(Icons.attach_file, size: 20), text: 'Files'),
            Tab(icon: Icon(Icons.chat, size: 20), text: 'Chat'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDashboardTab(),
          WorkflowsScreen(projectId: widget.projectId),
          _buildAttachmentsTab(),
          _buildChatTab(),
        ],
      ),
    );
  }
}
