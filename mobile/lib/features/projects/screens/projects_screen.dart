import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../repositories/project_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../auth/screens/user_profile_screen.dart';
import '../../notifications/screens/notifications_modal.dart';
import 'project_detail_screen.dart';
import 'dart:async';
import 'project_setup_wizard_screen.dart';
import 'project_chat_dialog.dart';
import 'project_upload_dialog.dart';
import 'project_task_dialog.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({Key? key}) : super(key: key);

  @override
  _ProjectsScreenState createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  final ProjectRepository _repository = ProjectRepository();
  List<Project>? _projects;
  String? _error;
  bool _isLoading = true;

  // Filter & Search State
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;
  String? _selectedStatus;
  String? _selectedProjectType;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      if (_projects == null) _isLoading = true;
      _error = null;
    });

    try {
      final items = await _repository.getProjects(
        search: _searchController.text.trim(),
        status: _selectedStatus,
        projectType: _selectedProjectType,
      );
      if (mounted) {
        setState(() {
          _projects = items;
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

  void _showChatDialog(Project project) {
    showDialog(context: context, builder: (_) => ProjectChatDialog(project: project)).then((_) => _fetchData());
  }

  void _showUploadDialog(Project project) {
    showDialog(context: context, builder: (_) => ProjectUploadDialog(project: project)).then((_) => _fetchData());
  }

  void _showTaskDialog(Project project, {bool isAssignOnly = false}) {
    showDialog(context: context, builder: (_) => ProjectTaskDialog(project: project, isAssignOnly: isAssignOnly)).then((_) => _fetchData());
  }

  Widget _buildCard(Project item) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 15,
            offset: const Offset(0, 6),
          )
        ],
        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ProjectDetailScreen(projectId: item.id),
              ),
            ).then((_) => _fetchData());
          },
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Name + Action Menu ──────────────────────────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: UsalamaTheme.primaryRed.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: UsalamaTheme.primaryRed.withValues(alpha: 0.2)),
                                ),
                                child: Text(
                                  item.projectType,
                                  style: const TextStyle(
                                      fontSize: 10,
                                      color: UsalamaTheme.primaryRed,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: item.status == 'ACTIVE' ? Colors.green.withValues(alpha: 0.12) : Colors.orange.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  item.status.toUpperCase(),
                                  style: TextStyle(
                                      fontSize: 10,
                                      color: item.status == 'ACTIVE' ? Colors.green : Colors.orange,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            item.name,
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Theme.of(context).colorScheme.onSurface, letterSpacing: -0.3),
                          ),
                        ],
                      ),
                    ),
                    PopupMenuButton<String>(
                      icon: Icon(Icons.more_horiz_rounded, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                      onSelected: (value) {
                        switch (value) {
                          case 'chat':
                            _showChatDialog(item);
                            break;
                          case 'upload':
                            _showUploadDialog(item);
                            break;
                          case 'create_task':
                            _showTaskDialog(item);
                            break;
                          case 'assign_task':
                            _showTaskDialog(item, isAssignOnly: true);
                            break;
                          case 'comment':
                            _showChatDialog(item); // Chat dialog also posts comments
                            break;
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(value: 'chat', child: ListTile(leading: Icon(Icons.chat_bubble_outline, color: UsalamaTheme.primaryRed), title: Text('Chat & Connect'))),
                        const PopupMenuItem(value: 'upload', child: ListTile(leading: Icon(Icons.upload_file_outlined, color: Colors.orange), title: Text('Upload File'))),
                        const PopupMenuItem(value: 'create_task', child: ListTile(leading: Icon(Icons.add_task_rounded, color: Colors.green), title: Text('Create New Task'))),
                        const PopupMenuItem(value: 'assign_task', child: ListTile(leading: Icon(Icons.person_add_alt_1_outlined, color: Colors.purple), title: Text('Assign Task'))),
                        const PopupMenuItem(value: 'comment', child: ListTile(leading: Icon(Icons.comment_outlined, color: Colors.teal), title: Text('Add Comment'))),
                      ],
                    ),
                  ],
                ),

                // ── Description ────────────────────────────────────────
                if (item.description != null && item.description!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    item.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55), fontSize: 13, height: 1.4),
                  ),
                ],

                const SizedBox(height: 12),
                
                // ── Progress Bar ─────────────────────────────────
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Progress', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7))),
                        Text('${item.progress}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: UsalamaTheme.primaryRed)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: item.progress / 100.0,
                        backgroundColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                        valueColor: const AlwaysStoppedAnimation<Color>(UsalamaTheme.primaryRed),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 12),

                // ── Footer: members + item count ───────────────────────
                Row(
                  children: [
                    // Member avatar stack
                    if (item.membersDetail.isNotEmpty)
                      SizedBox(
                        height: 32,
                        width: (item.membersDetail.length.clamp(1, 4) * 24.0) + 12,
                        child: Stack(
                          children: item.membersDetail.take(4).toList().asMap().entries.map((e) {
                            final idx = e.key;
                            final m = e.value;
                            final initials = m.firstName.isNotEmpty && m.lastName.isNotEmpty
                                ? '${m.firstName[0]}${m.lastName[0]}'.toUpperCase()
                                : m.username.substring(0, m.username.length >= 2 ? 2 : 1).toUpperCase();

                            return Positioned(
                              left: idx * 22.0,
                              child: GestureDetector(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => UserProfileScreen(member: m),
                                    ),
                                  );
                                },
                                child: Container(
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Theme.of(context).colorScheme.surface, width: 2),
                                  ),
                                  child: m.profile?.avatarUrl.isNotEmpty == true
                                      ? CircleAvatar(
                                          radius: 14,
                                          backgroundImage: NetworkImage(m.profile!.avatarUrl),
                                        )
                                      : CircleAvatar(
                                          radius: 14,
                                          backgroundColor: UsalamaTheme.primaryRed.withValues(alpha: 0.15),
                                          child: Text(initials,
                                              style: const TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w800,
                                                  color: UsalamaTheme.primaryRed)),
                                        ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      
                    if (item.membersDetail.length > 4)
                      Container(
                        margin: const EdgeInsets.only(left: 4),
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                          shape: BoxShape.circle,
                        ),
                        child: Text('+${item.membersDetail.length - 4}', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                      ),

                    const Spacer(),

                    // Tasks count
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.task_alt_rounded, size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                          const SizedBox(width: 6),
                          Text(
                            '${item.taskCount} Tasks',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _fetchData();
    });
  }

  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                top: 24,
                left: 24,
                right: 24,
              ),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Filter Projects', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: Icon(Icons.close, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5)),
                      )
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Status Filter
                  Text('Status', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6))),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [null, 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].map((status) {
                      final isSelected = _selectedStatus == status;
                      return ChoiceChip(
                        label: Text(status ?? 'All', style: TextStyle(color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500)),
                        selected: isSelected,
                        selectedColor: UsalamaTheme.primaryRed,
                        backgroundColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.05),
                        onSelected: (selected) {
                          setModalState(() {
                            _selectedStatus = selected ? status : null;
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                  
                  // Project Type Filter
                  Text('Project Type', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6))),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [null, 'FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'API', 'UIUX', 'INFRA'].map((type) {
                      final isSelected = _selectedProjectType == type;
                      return ChoiceChip(
                        label: Text(type ?? 'All', style: TextStyle(color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500)),
                        selected: isSelected,
                        selectedColor: UsalamaTheme.primaryRed,
                        backgroundColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.05),
                        onSelected: (selected) {
                          setModalState(() {
                            _selectedProjectType = selected ? type : null;
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 32),
                  
                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setModalState(() {
                              _selectedStatus = null;
                              _selectedProjectType = null;
                            });
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Reset'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _fetchData();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: UsalamaTheme.primaryRed,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Apply Filters', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSearchAndFilter() {
    final bool hasActiveFilters = _selectedStatus != null || _selectedProjectType != null;
    
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Search projects...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.05),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            decoration: BoxDecoration(
              color: hasActiveFilters ? UsalamaTheme.primaryRed.withOpacity(0.1) : Theme.of(context).colorScheme.onSurface.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: hasActiveFilters ? Border.all(color: UsalamaTheme.primaryRed.withOpacity(0.3)) : null,
            ),
            child: IconButton(
              icon: Icon(Icons.tune_rounded, color: hasActiveFilters ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withOpacity(0.7)),
              onPressed: _showFilterModal,
              tooltip: 'Filter Projects',
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _projects == null) {
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(title: const Text('Projects')),
        body: SafeArea(child: ErrorView(message: _error!, onRetry: _fetchData)),
      );
    }

    if (_projects == null || (_isLoading && _projects == null)) {
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(title: const Text('Projects')),
        body: const SafeArea(child: LoadingView()),
      );
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () => showNotificationsModal(context),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchAndFilter(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _fetchData,
                color: UsalamaTheme.primaryRed,
                child: _projects!.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          const SizedBox(height: 100),
                          Center(child: Text('No projects found.', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54)))),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        physics: const AlwaysScrollableScrollPhysics(),
                        itemCount: _projects!.length,
                        itemBuilder: (context, index) {
                          return _buildCard(_projects![index]);
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const ProjectSetupWizardScreen(),
            ),
          );
          if (result == true) {
            _fetchData();
          }
        },
        backgroundColor: UsalamaTheme.primaryRed,
        child: const Icon(Icons.add),
      ),
    );
  }
}
