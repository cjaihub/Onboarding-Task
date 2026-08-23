import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../repositories/work_item_repository.dart';

class ProjectTaskDialog extends StatefulWidget {
  final Project project;
  final bool isAssignOnly;
  const ProjectTaskDialog({Key? key, required this.project, this.isAssignOnly = false}) : super(key: key);

  @override
  _ProjectTaskDialogState createState() => _ProjectTaskDialogState();
}

class _ProjectTaskDialogState extends State<ProjectTaskDialog> {
  final WorkItemRepository _repository = WorkItemRepository();
  
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  String _category = 'FEATURE';
  String _priority = 'MEDIUM';
  int? _assignedTo;
  bool _isSubmitting = false;

  void _submitTask() async {
    final title = _titleController.text.trim();
    if (!widget.isAssignOnly && title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title is required')));
      return;
    }
    
    if (widget.isAssignOnly && _assignedTo == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a member to assign')));
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      if (widget.isAssignOnly) {
        // For 'Assign Task' action we just create a quick task and assign it
        await _repository.createWorkItem(
          projectId: widget.project.id,
          title: title.isEmpty ? 'New Task for Assignee' : title,
          description: _descController.text.trim(),
          category: _category,
          priority: _priority,
          assignedTo: _assignedTo,
        );
      } else {
        await _repository.createWorkItem(
          projectId: widget.project.id,
          title: title,
          description: _descController.text.trim(),
          category: _category,
          priority: _priority,
          assignedTo: _assignedTo,
        );
      }

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Task created successfully')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: Theme.of(context).colorScheme.surface,
      elevation: 0,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: UsalamaTheme.primaryRed.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      widget.isAssignOnly ? Icons.person_add_alt_1 : Icons.add_task_rounded,
                      color: UsalamaTheme.primaryRed,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      widget.isAssignOnly ? 'Assign Task' : 'Create New Task',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.onSurface,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Inputs
              _buildTextField('Task Title', _titleController),
              const SizedBox(height: 16),
              _buildTextField('Description (optional)', _descController, maxLines: 3),
              const SizedBox(height: 16),
              
              Text('Priority', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _priority,
                dropdownColor: Theme.of(context).colorScheme.surface,
                icon: Icon(Icons.keyboard_arrow_down_rounded, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                decoration: _inputDecoration('Priority'),
                items: const [
                  DropdownMenuItem(value: 'LOW', child: Text('Low', style: TextStyle(fontWeight: FontWeight.w600))),
                  DropdownMenuItem(value: 'MEDIUM', child: Text('Medium', style: TextStyle(fontWeight: FontWeight.w600))),
                  DropdownMenuItem(value: 'HIGH', child: Text('High', style: TextStyle(fontWeight: FontWeight.w600))),
                  DropdownMenuItem(value: 'CRITICAL', child: Text('Critical', style: TextStyle(fontWeight: FontWeight.w600))),
                ],
                onChanged: (val) => setState(() => _priority = val!),
              ),
              const SizedBox(height: 16),
              
              Text('Assign To', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
              const SizedBox(height: 8),
              DropdownButtonFormField<int>(
                value: _assignedTo,
                dropdownColor: Theme.of(context).colorScheme.surface,
                icon: Icon(Icons.keyboard_arrow_down_rounded, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                decoration: _inputDecoration('Assign To'),
                items: [
                  const DropdownMenuItem<int>(value: null, child: Text('Unassigned', style: TextStyle(fontWeight: FontWeight.w600))),
                  ...widget.project.membersDetail.map((m) => DropdownMenuItem<int>(
                        value: m.id,
                        child: Text(m.username, style: const TextStyle(fontWeight: FontWeight.w600)),
                      ))
                ],
                onChanged: (val) => setState(() => _assignedTo = val),
              ),
              const SizedBox(height: 32),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSubmitting ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        side: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                      ),
                      child: Text('Cancel', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7), fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitTask,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: UsalamaTheme.primaryRed,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: _isSubmitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(widget.isAssignOnly ? 'Assign Task' : 'Create Task', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontWeight: FontWeight.w500),
          decoration: _inputDecoration(label),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      filled: true,
      fillColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.03),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: UsalamaTheme.primaryRed, width: 2),
      ),
    );
  }
}
