import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/workflow.dart';
import '../../../repositories/workflow_repository.dart';
import '../../../widgets/loading_view.dart';
import '../../../widgets/error_view.dart';

class WorkflowsScreen extends StatefulWidget {
  final int? projectId;
  
  const WorkflowsScreen({Key? key, this.projectId}) : super(key: key);

  @override
  _WorkflowsScreenState createState() => _WorkflowsScreenState();
}

class _WorkflowsScreenState extends State<WorkflowsScreen> {
  final WorkflowRepository _repository = WorkflowRepository();
  List<Workflow>? _workflows;
  String? _error;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchWorkflows();
  }

  Future<void> _fetchWorkflows() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final workflows = await _repository.getWorkflows(projectId: widget.projectId);
      if (mounted) {
        setState(() {
          _workflows = workflows;
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
    if (_isLoading) {
      return const LoadingView();
    }
    
    if (_error != null) {
      return ErrorView(message: _error!, onRetry: _fetchWorkflows);
    }
    
    if (_workflows == null || _workflows!.isEmpty) {
      return const Center(
        child: Text('No workflows found.', style: TextStyle(color: Colors.white54)),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchWorkflows,
      color: UsalamaTheme.primaryRed,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _workflows!.length,
        itemBuilder: (context, index) {
          final wf = _workflows![index];
          return Card(
            color: UsalamaTheme.surfaceDark,
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.white.withOpacity(0.05)),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              title: Text(
                wf.name,
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Text(
                  wf.description,
                  style: const TextStyle(color: Colors.white70),
                ),
              ),
              trailing: Chip(
                label: Text(wf.isActive ? 'Active' : 'Inactive'),
                backgroundColor: wf.isActive ? Colors.green.withOpacity(0.2) : Colors.grey.withOpacity(0.2),
                labelStyle: TextStyle(
                  color: wf.isActive ? Colors.greenAccent : Colors.grey,
                  fontSize: 12,
                  fontWeight: FontWeight.bold
                ),
                side: BorderSide(color: wf.isActive ? Colors.green.withOpacity(0.5) : Colors.transparent),
              ),
            ),
          );
        },
      ),
    );
  }
}
