import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../models/work_item.dart';
import '../../../repositories/project_repository.dart';
import '../../../repositories/work_item_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../../widgets/project_card.dart';
import '../../notifications/screens/notifications_modal.dart';
import 'project_detail_screen.dart';

class ProjectDashboardScreen extends StatefulWidget {
  const ProjectDashboardScreen({Key? key}) : super(key: key);

  @override
  _ProjectDashboardScreenState createState() => _ProjectDashboardScreenState();
}

class _ProjectDashboardScreenState extends State<ProjectDashboardScreen> {
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
        backgroundColor: const Color(0xFF0F1115),
        appBar: _buildAppBar(),
        body: SafeArea(child: ErrorView(message: _error!, onRetry: _fetchData)),
      );
    }

    if (_isLoading && _projects == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0F1115),
        appBar: _buildAppBar(),
        body: const SafeArea(child: LoadingView()),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F1115), // Dark surface base
      appBar: _buildAppBar(),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchData,
          color: UsalamaTheme.primaryRed,
          backgroundColor: const Color(0xFF161B24),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Project Master Panel',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Overview of all workflows, boards, and nested tasks. Strict hierarchy enforced.',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.5),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
              if (_projects != null && _projects!.isEmpty)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(40.0),
                    child: Center(
                      child: Text(
                        'No projects found.',
                        style: TextStyle(color: Colors.white54),
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
          const Text('Usalama', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined, color: Colors.white),
          onPressed: () => showNotificationsModal(context),
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}
