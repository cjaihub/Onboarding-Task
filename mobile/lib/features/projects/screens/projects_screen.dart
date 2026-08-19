import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../repositories/project_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../auth/screens/user_profile_screen.dart';
import '../../notifications/screens/notifications_modal.dart';
import 'project_detail_screen.dart';
import 'project_setup_wizard_screen.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      if (_projects == null) _isLoading = true;
      _error = null;
    });

    try {
      final items = await _repository.getProjects();
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

  Widget _buildCard(Project item) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ProjectDetailScreen(projectId: item.id),
            ),
          ).then((_) => _fetchData());
        },
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Name + Type Badge ──────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: Text(
                      item.name,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: UsalamaTheme.primaryRed.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: UsalamaTheme.primaryRed.withOpacity(0.25)),
                    ),
                    child: Text(
                      item.projectType,
                      style: const TextStyle(
                          fontSize: 10,
                          color: UsalamaTheme.primaryRed,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5),
                    ),
                  ),
                ],
              ),

              // ── Description ────────────────────────────────────────
              if (item.description != null && item.description!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  item.description!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white60, fontSize: 13),
                ),
              ],

              const SizedBox(height: 14),
              const Divider(height: 1, color: Colors.white12),
              const SizedBox(height: 12),

              // ── Footer: members + item count ───────────────────────
              Row(
                children: [
                  // Member avatar stack
                  if (item.membersDetail.isNotEmpty)
                    SizedBox(
                      height: 28,
                      width: (item.membersDetail.length.clamp(1, 4) * 22.0) + 10,
                      child: Stack(
                        children: item.membersDetail.take(4).toList().asMap().entries.map((e) {
                          final idx = e.key;
                          final m = e.value;
                          final initials = m.firstName.isNotEmpty && m.lastName.isNotEmpty
                              ? '${m.firstName[0]}${m.lastName[0]}'.toUpperCase()
                              : m.username.substring(0, m.username.length >= 2 ? 2 : 1).toUpperCase();

                          return Positioned(
                            left: idx * 20.0,
                            child: GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => UserProfileScreen(member: m),
                                  ),
                                );
                              },
                              child: m.profile?.avatarUrl.isNotEmpty == true
                                  ? CircleAvatar(
                                      radius: 13,
                                      backgroundImage: NetworkImage(m.profile!.avatarUrl),
                                    )
                                  : CircleAvatar(
                                      radius: 13,
                                      backgroundColor: UsalamaTheme.primaryRed.withOpacity(0.22),
                                      child: Text(initials,
                                          style: const TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: UsalamaTheme.primaryRed)),
                                    ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                  const Spacer(),

                  // Item count
                  Row(
                    children: [
                      const Icon(Icons.task_outlined, size: 13, color: Colors.white38),
                      const SizedBox(width: 4),
                      Text(
                        '${item.members.length} member${item.members.length != 1 ? 's' : ''}',
                        style: const TextStyle(color: Colors.white38, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _projects == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Projects')),
        body: SafeArea(child: ErrorView(message: _error!, onRetry: _fetchData)),
      );
    }

    if (_projects == null || (_isLoading && _projects == null)) {
      return Scaffold(
        appBar: AppBar(title: const Text('Projects')),
        body: const SafeArea(child: LoadingView()),
      );
    }

    return Scaffold(
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
        child: RefreshIndicator(
          onRefresh: _fetchData,
          color: UsalamaTheme.primaryRed,
          child: _projects!.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SizedBox(height: 100),
                    Center(child: Text('No projects found.', style: TextStyle(color: Colors.white54))),
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
