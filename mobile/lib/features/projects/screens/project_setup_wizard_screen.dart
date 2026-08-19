import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../repositories/project_repository.dart';
import '../../../services/api_service.dart';

class ProjectSetupWizardScreen extends StatefulWidget {
  const ProjectSetupWizardScreen({Key? key}) : super(key: key);

  @override
  _ProjectSetupWizardScreenState createState() => _ProjectSetupWizardScreenState();
}

class _ProjectSetupWizardScreenState extends State<ProjectSetupWizardScreen> {
  final ProjectRepository _repository = ProjectRepository();
  final ApiService _api = ApiService();
  
  int _currentStep = 0;
  bool _isSubmitting = false;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  
  String _projectType = 'FULLSTACK';
  List<String> _techTools = [];
  List<int> _members = [];
  bool _notificationsEnabled = true;

  List<dynamic> _availableUsers = [];
  List<dynamic> _metadataTechTools = [];
  List<dynamic> _metadataProjectTypes = [];

  @override
  void initState() {
    super.initState();
    _fetchMetadata();
  }

  Future<void> _fetchMetadata() async {
    try {
      final usersRes = await _api.get('/users/');
      final metaRes = await _api.get('/metadata/');
      setState(() {
        _availableUsers = usersRes as List<dynamic>;
        _metadataProjectTypes = metaRes['project_types'];
        _metadataTechTools = metaRes['tech_tools'];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load metadata: $e')));
    }
  }

  void _submit() async {
    setState(() => _isSubmitting = true);
    try {
      await _api.post('/projects/', {
        'name': _nameController.text,
        'description': _descController.text,
        'project_type': _projectType,
        'tech_tools': _techTools,
        'members': _members,
      });
      Navigator.pop(context, true); // true indicates success
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Project Wizard')),
      body: Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: UsalamaTheme.primaryRed,
          ),
        ),
        child: Stepper(
          currentStep: _currentStep,
          onStepContinue: () {
            if (_currentStep == 0 && _nameController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Project Name is required.')));
              return;
            }
            if (_currentStep < 3) {
              setState(() => _currentStep += 1);
            } else {
              _submit();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) {
              setState(() => _currentStep -= 1);
            } else {
              Navigator.pop(context);
            }
          },
          controlsBuilder: (context, details) {
            return Padding(
              padding: const EdgeInsets.only(top: 24.0),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : details.onStepContinue,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: UsalamaTheme.primaryRed,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _isSubmitting && _currentStep == 3
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(_currentStep == 3 ? 'Launch Project' : 'Continue'),
                    ),
                  ),
                  if (_currentStep > 0) ...[
                    const SizedBox(width: 16),
                    TextButton(
                      onPressed: _isSubmitting ? null : details.onStepCancel,
                      child: const Text('Back', style: TextStyle(color: Colors.white54)),
                    ),
                  ],
                ],
              ),
            );
          },
          steps: [
            Step(
              title: const Text('Identity'),
              isActive: _currentStep >= 0,
              content: Column(
                children: [
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Project Name',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
            Step(
              title: const Text('Tech Stack'),
              isActive: _currentStep >= 1,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_metadataProjectTypes.isNotEmpty)
                    DropdownButtonFormField<String>(
                      value: _projectType,
                      decoration: const InputDecoration(
                        labelText: 'Project Type',
                        border: OutlineInputBorder(),
                      ),
                      items: _metadataProjectTypes.map<DropdownMenuItem<String>>((pt) {
                        return DropdownMenuItem<String>(
                          value: pt['value'],
                          child: Text(pt['label']),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _projectType = val);
                      },
                    ),
                  const SizedBox(height: 16),
                  const Text('Select Tech Tools', style: TextStyle(color: Colors.white70, fontSize: 16)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8.0,
                    runSpacing: 4.0,
                    children: _metadataTechTools.map<Widget>((tool) {
                      final isSelected = _techTools.contains(tool['value']);
                      return FilterChip(
                        label: Text(tool['label']),
                        selected: isSelected,
                        selectedColor: UsalamaTheme.primaryRed.withOpacity(0.3),
                        checkmarkColor: UsalamaTheme.primaryRed,
                        onSelected: (selected) {
                          setState(() {
                            if (selected) {
                              _techTools.add(tool['value']);
                            } else {
                              _techTools.remove(tool['value']);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            Step(
              title: const Text('Team'),
              isActive: _currentStep >= 2,
              content: Column(
                children: _availableUsers.map<Widget>((user) {
                  final isSelected = _members.contains(user['id']);
                  return CheckboxListTile(
                    title: Text(user['first_name'] ?? user['username']),
                    subtitle: Text('@${user['username']}'),
                    value: isSelected,
                    activeColor: UsalamaTheme.primaryRed,
                    onChanged: (val) {
                      setState(() {
                        if (val == true) {
                          _members.add(user['id']);
                        } else {
                          _members.remove(user['id']);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
            ),
            Step(
              title: const Text('Review'),
              isActive: _currentStep >= 3,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    color: UsalamaTheme.cardBackground,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Name: ${_nameController.text}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text('Type: $_projectType'),
                          const SizedBox(height: 8),
                          Text('Tools: ${_techTools.length} selected'),
                          const SizedBox(height: 8),
                          Text('Team: ${_members.length} members'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: const Text('Enable Notifications'),
                    value: _notificationsEnabled,
                    activeColor: UsalamaTheme.primaryRed,
                    onChanged: (val) => setState(() => _notificationsEnabled = val),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
