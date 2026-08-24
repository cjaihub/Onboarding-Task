import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/theme.dart';
import '../../../services/api_service.dart';

class ProjectSetupWizardScreen extends StatefulWidget {
  const ProjectSetupWizardScreen({Key? key}) : super(key: key);

  @override
  _ProjectSetupWizardScreenState createState() => _ProjectSetupWizardScreenState();
}

class _ProjectSetupWizardScreenState extends State<ProjectSetupWizardScreen> {
  final ApiService _api = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _draftKey = 'project_wizard_draft';

  final PageController _pageController = PageController();
  int _currentStep = 0;
  bool _isSubmitting = false;
  bool _isLoadingMetadata = true;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  String _projectType = 'FULLSTACK';
  List<String> _techTools = [];
  List<int> _members = [];
  bool _notificationsEnabled = true;

  List<dynamic> _availableUsers = [];
  List<dynamic> _metadataTechTools = [];
  List<dynamic> _metadataProjectTypes = [];

  final List<String> _stepTitles = ['Identity', 'Tech Stack', 'Team', 'Review'];

  @override
  void initState() {
    super.initState();
    _nameController.addListener(_saveDraft);
    _descController.addListener(_saveDraft);
    _initialize();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _initialize() async {
    await Future.wait([
      _fetchMetadata(),
      _loadDraft(),
    ]);
    if (mounted) {
      setState(() => _isLoadingMetadata = false);
    }
  }

  Future<void> _fetchMetadata() async {
    try {
      final usersRes = await _api.get('/users/');
      final metaRes = await _api.get('/metadata/');
      if (mounted) {
        setState(() {
          _availableUsers = usersRes as List<dynamic>;
          _metadataProjectTypes = metaRes['project_types'];
          _metadataTechTools = metaRes['tech_tools'];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load metadata: $e')));
      }
    }
  }

  Future<void> _loadDraft() async {
    try {
      final draftStr = await _storage.read(key: _draftKey);
      if (draftStr != null) {
        final draft = jsonDecode(draftStr);
        if (mounted) {
          setState(() {
            _nameController.text = draft['name'] ?? '';
            _descController.text = draft['description'] ?? '';
            _projectType = draft['project_type'] ?? 'FULLSTACK';
            _techTools = List<String>.from(draft['tech_tools'] ?? []);
            _members = List<int>.from(draft['members'] ?? []);
            _notificationsEnabled = draft['notifications_enabled'] ?? true;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Draft restored successfully.'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: UsalamaTheme.surfaceRaised,
            ),
          );
        }
      }
    } catch (e) {
      // Ignore draft loading errors
    }
  }

  void _saveDraft() {
    final draft = {
      'name': _nameController.text,
      'description': _descController.text,
      'project_type': _projectType,
      'tech_tools': _techTools,
      'members': _members,
      'notifications_enabled': _notificationsEnabled,
    };
    _storage.write(key: _draftKey, value: jsonEncode(draft));
  }

  void _nextStep() {
    if (_currentStep == 0 && _nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Project Name is required.')));
      return;
    }
    if (_currentStep < 3) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _submit();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      Navigator.pop(context);
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
      await _storage.delete(key: _draftKey); // Clear draft on success
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        setState(() => _isSubmitting = false);
      }
    }
  }

  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 20.0),
      child: Row(
        children: List.generate(_stepTitles.length, (index) {
          final isActive = index <= _currentStep;
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        height: 4,
                        decoration: BoxDecoration(
                          color: isActive ? UsalamaTheme.primaryRed : Colors.white24,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _stepTitles[index],
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                          color: isActive ? Colors.white : Colors.white54,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                if (index < _stepTitles.length - 1)
                  const SizedBox(width: 8),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStepIdentity() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Project Identity', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Define the core identity and purpose of this project.', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 32),
          TextFormField(
            controller: _nameController,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            decoration: InputDecoration(
              labelText: 'Project Name',
              hintText: 'e.g. NextGen API Platform',
              filled: true,
              fillColor: UsalamaTheme.surfaceRaised,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: UsalamaTheme.primaryRed, width: 2)),
              floatingLabelBehavior: FloatingLabelBehavior.always,
            ),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _descController,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'Description',
              hintText: 'Briefly describe what this project aims to achieve...',
              filled: true,
              fillColor: UsalamaTheme.surfaceRaised,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: UsalamaTheme.primaryRed, width: 2)),
              floatingLabelBehavior: FloatingLabelBehavior.always,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepTechStack() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tech Stack', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Select the type and technologies that will be used.', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 32),
          if (_metadataProjectTypes.isNotEmpty)
            DropdownButtonFormField<String>(
              value: _projectType,
              dropdownColor: UsalamaTheme.surfaceCard,
              decoration: InputDecoration(
                labelText: 'Project Type',
                filled: true,
                fillColor: UsalamaTheme.surfaceRaised,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              items: _metadataProjectTypes.map<DropdownMenuItem<String>>((pt) {
                return DropdownMenuItem<String>(
                  value: pt['value'],
                  child: Text(pt['label'], style: const TextStyle(fontWeight: FontWeight.bold)),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() => _projectType = val);
                  _saveDraft();
                }
              },
            ),
          const SizedBox(height: 32),
          const Text('Frameworks & Tools', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12.0,
            runSpacing: 12.0,
            children: _metadataTechTools.map<Widget>((tool) {
              final isSelected = _techTools.contains(tool['value']);
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                child: FilterChip(
                  label: Text(tool['label'], style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                  selected: isSelected,
                  backgroundColor: UsalamaTheme.surfaceRaised,
                  selectedColor: UsalamaTheme.primaryRed.withOpacity(0.2),
                  checkmarkColor: UsalamaTheme.primaryRed,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(
                      color: isSelected ? UsalamaTheme.primaryRed : Colors.transparent,
                    ),
                  ),
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _techTools.add(tool['value']);
                      } else {
                        _techTools.remove(tool['value']);
                      }
                    });
                    _saveDraft();
                  },
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildStepTeam() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Team Assembly', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Select members to add to this project.', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 24),
          ..._availableUsers.map<Widget>((user) {
            final isSelected = _members.contains(user['id']);
            return Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isSelected ? UsalamaTheme.primaryRed.withOpacity(0.1) : UsalamaTheme.surfaceRaised,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? UsalamaTheme.primaryRed : Colors.transparent,
                  ),
                ),
                child: CheckboxListTile(
                  title: Text(user['first_name'] ?? user['username'], style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('@${user['username']}', style: const TextStyle(color: Colors.white54)),
                  value: isSelected,
                  activeColor: UsalamaTheme.primaryRed,
                  checkColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  onChanged: (val) {
                    setState(() {
                      if (val == true) {
                        _members.add(user['id']);
                      } else {
                        _members.remove(user['id']);
                      }
                    });
                    _saveDraft();
                  },
                ),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildStepReview() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Review & Launch', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Verify all project details before creating.', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: UsalamaTheme.surfaceRaised,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildReviewRow('Project Name', _nameController.text),
                const Divider(color: Colors.white12, height: 24),
                _buildReviewRow('Type', _projectType),
                const Divider(color: Colors.white12, height: 24),
                _buildReviewRow('Tech Stack', '${_techTools.length} tools selected'),
                const Divider(color: Colors.white12, height: 24),
                _buildReviewRow('Team', '${_members.length} members assigned'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              color: UsalamaTheme.surfaceRaised,
              borderRadius: BorderRadius.circular(12),
            ),
            child: SwitchListTile(
              title: const Text('Enable Notifications', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Alert team members immediately'),
              value: _notificationsEnabled,
              activeColor: UsalamaTheme.primaryRed,
              onChanged: (val) {
                setState(() => _notificationsEnabled = val);
                _saveDraft();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 14)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: UsalamaTheme.backgroundDark,
      appBar: AppBar(
        title: const Text('New Project', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: _isLoadingMetadata
          ? const Center(child: CircularProgressIndicator(color: UsalamaTheme.primaryRed))
          : Column(
              children: [
                _buildStepIndicator(),
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    onPageChanged: (index) => setState(() => _currentStep = index),
                    children: [
                      _buildStepIdentity(),
                      _buildStepTechStack(),
                      _buildStepTeam(),
                      _buildStepReview(),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(24.0),
                  decoration: const BoxDecoration(
                    color: UsalamaTheme.surfaceCard,
                    border: Border(top: BorderSide(color: Colors.white12)),
                  ),
                  child: Row(
                    children: [
                      if (_currentStep > 0)
                        Padding(
                          padding: const EdgeInsets.only(right: 16.0),
                          child: TextButton(
                            onPressed: _isSubmitting ? null : _prevStep,
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Back', style: TextStyle(color: Colors.white54, fontSize: 16)),
                          ),
                        ),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _nextStep,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: UsalamaTheme.primaryRed,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _isSubmitting && _currentStep == 3
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : Text(
                                  _currentStep == 3 ? 'Launch Project' : 'Continue',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
