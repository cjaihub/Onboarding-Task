import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../repositories/project_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import '../../notifications/screens/notifications_modal.dart';
import 'project_detail_screen.dart';

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
              Text(
                item.name,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              if (item.description != null && item.description!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  item.description!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
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
    );
  }
}
