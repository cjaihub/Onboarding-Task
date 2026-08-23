import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../models/work_item.dart';
import '../../../repositories/project_repository.dart';
import '../../../repositories/work_item_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../../widgets/project_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/screens/user_profile_screen.dart';
import '../../notifications/screens/notifications_modal.dart';
import 'project_detail_screen.dart';

class ProjectDashboardScreen extends ConsumerStatefulWidget {
  const ProjectDashboardScreen({Key? key}) : super(key: key);

  @override
  _ProjectDashboardScreenState createState() => _ProjectDashboardScreenState();
}

class _ProjectDashboardScreenState extends ConsumerState<ProjectDashboardScreen> {
  final ProjectRepository _projectRepository = ProjectRepository();
  final WorkItemRepository _workItemRepository = WorkItemRepository();

  List<Project>? _projects;
  List<WorkItem>? _workItems;
  String? _error;
  bool _isLoading = true;

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
      final projectsFuture = _projectRepository.getProjects();
      final workItemsFuture = _workItemRepository.getWorkItems();

      final results = await Future.wait([projectsFuture, workItemsFuture]);
      
      if (mounted) {
        setState(() {
          _projects = results[0] as List<Project>;
          _workItems = results[1] as List<WorkItem>;
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

  @override
  Widget build(BuildContext context) {
    if (_error != null && _projects == null) {
      return Scaffold(
        backgroundColor: Theme.of(context).colorScheme.surface,
        appBar: _buildAppBar(),
        body: SafeArea(child: ErrorView(message: _error!, onRetry: _fetchData)),
      );
    }

    if (_isLoading && _projects == null) {
      return Scaffold(
        backgroundColor: Theme.of(context).colorScheme.surface,
        appBar: _buildAppBar(),
        body: const SafeArea(child: LoadingView()),
      );
    }

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: _buildAppBar(),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchData,
          color: UsalamaTheme.primaryRed,
          backgroundColor: Theme.of(context).colorScheme.surface,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Admin Board',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: Theme.of(context).colorScheme.onSurface,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Overview of all workflows, boards, and nested tasks. Strict hierarchy enforced.',
                        style: TextStyle(
                          fontSize: 14,
                          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
              if (_projects != null && _projects!.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(40.0),
                    child: Center(
                      child: Text(
                        'No projects found.',
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54)),
                      ),
                    ),
                  ),
                )
              else if (_projects != null)
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final project = _projects![index];
                      final projectTasks = _workItems?.where((w) => w.project == project.id).toList() ?? [];
                      
                      return ProjectCard(
                        project: project,
                        workItemCount: projectTasks.length,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ProjectDetailScreen(projectId: project.id),
                            ),
                          ).then((_) => _fetchData());
                        },
                      );
                    },
                    childCount: _projects!.length,
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final currentTheme = ref.watch(themeProvider);
    final isDark = currentTheme == ThemeMode.dark;

    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [UsalamaTheme.primaryRed, Colors.redAccent],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text('W', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          const SizedBox(width: 12),
          Text('Usalama', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface)),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode, color: Theme.of(context).colorScheme.onSurface),
          onPressed: () {
            ref.read(themeProvider.notifier).state = isDark ? ThemeMode.light : ThemeMode.dark;
          },
        ),
        IconButton(
          icon: Icon(Icons.notifications_outlined, color: Theme.of(context).colorScheme.onSurface),
          onPressed: () => showNotificationsModal(context),
        ),
        if (user != null)
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => UserProfileScreen(member: user),
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.only(right: 16.0, left: 8.0),
              child: user.profile?.avatarUrl.isNotEmpty == true
                  ? CircleAvatar(
                      radius: 16,
                      backgroundImage: NetworkImage(user.profile!.avatarUrl),
                    )
                  : CircleAvatar(
                      radius: 16,
                      backgroundColor: UsalamaTheme.primaryRed.withOpacity(0.22),
                      child: Text(
                        (user.firstName.isNotEmpty && user.lastName.isNotEmpty)
                            ? '${user.firstName[0]}${user.lastName[0]}'.toUpperCase()
                            : user.username.substring(0, user.username.length >= 2 ? 2 : 1).toUpperCase(),
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: UsalamaTheme.primaryRed),
                      ),
                    ),
            ),
          )
        else
          const SizedBox(width: 16),
      ],
    );
  }
}
