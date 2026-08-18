import 'package:flutter/material.dart';
import '../../../models/project.dart';
import '../../../repositories/project_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';

class ProjectDetailScreen extends StatefulWidget {
  final int projectId;

  const ProjectDetailScreen({Key? key, required this.projectId}) : super(key: key);

  @override
  _ProjectDetailScreenState createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  final ProjectRepository _repository = ProjectRepository();
  Project? _project;
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
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _project!.name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                if (_project!.description != null && _project!.description!.isNotEmpty) ...[
                  const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white54)),
                  const SizedBox(height: 8),
                  Text(_project!.description!),
                ],
                // Placeholder for associated Work Items or other details
              ],
            ),
          ),
        ),
      ),
    );
  }
}
