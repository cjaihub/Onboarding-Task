import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme.dart';
import '../providers/auth_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _roleController = TextEditingController();
  final _phoneController = TextEditingController();
  final _avatarUrlController = TextEditingController();
  final _bioController = TextEditingController();

  bool _isEditing = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  void _loadUserData() {
    final user = ref.read(authProvider).user;
    if (user != null) {
      _firstNameController.text = user.firstName;
      _lastNameController.text = user.lastName;
      _roleController.text = user.profile?.role ?? '';
      _phoneController.text = user.profile?.phoneNumber ?? '';
      _avatarUrlController.text = user.profile?.avatarUrl ?? '';
      _bioController.text = user.profile?.bio ?? '';
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _roleController.dispose();
    _phoneController.dispose();
    _avatarUrlController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    try {
      await ref.read(authProvider.notifier).updateProfile({
        'first_name': _firstNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'profile': {
          'role': _roleController.text.trim(),
          'phone_number': _phoneController.text.trim(),
          'avatar_url': _avatarUrlController.text.trim(),
          'bio': _bioController.text.trim(),
        }
      });
      setState(() => _isEditing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update profile: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Please log in')),
      );
    }

    final String initials = (user.firstName.isNotEmpty && user.lastName.isNotEmpty)
        ? '${user.firstName[0]}${user.lastName[0]}'.toUpperCase()
        : user.username[0].toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // slate-900
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'My Profile',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(LucideIcons.edit2, color: Colors.white),
              onPressed: () => setState(() => _isEditing = true),
            )
          else
            IconButton(
              icon: const Icon(LucideIcons.x, color: Colors.white),
              onPressed: () {
                setState(() => _isEditing = false);
                _loadUserData(); // reset
              },
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Avatar
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF1E293B), width: 4),
                      color: const Color(0xFF334155),
                      image: (_avatarUrlController.text.isNotEmpty)
                          ? DecorationImage(
                              image: NetworkImage(_avatarUrlController.text),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: _avatarUrlController.text.isEmpty
                        ? Center(
                            child: Text(
                              initials,
                              style: const TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          )
                        : null,
                  ),
                  if (_isEditing)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: UsalamaTheme.primaryRed,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.camera, color: Colors.white, size: 20),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              user.fullName,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              user.profile?.role?.isNotEmpty == true ? user.profile!.role : 'Member',
              style: const TextStyle(
                color: UsalamaTheme.primaryRed,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 32),

            // Form Fields
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withOpacity(0.7),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF334155).withOpacity(0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_isEditing) ...[
                    _buildTextField('Avatar URL', _avatarUrlController, icon: LucideIcons.image),
                    const SizedBox(height: 16),
                  ],
                  _buildTextField('First Name', _firstNameController, icon: LucideIcons.user, enabled: _isEditing),
                  const SizedBox(height: 16),
                  _buildTextField('Last Name', _lastNameController, icon: LucideIcons.user, enabled: _isEditing),
                  const SizedBox(height: 16),
                  _buildTextField('Username', TextEditingController(text: user.username), icon: LucideIcons.atSign, enabled: false),
                  const SizedBox(height: 16),
                  _buildTextField('Email', TextEditingController(text: user.email), icon: LucideIcons.mail, enabled: false),
                  const SizedBox(height: 16),
                  _buildTextField('Role', _roleController, icon: LucideIcons.briefcase, enabled: _isEditing),
                  const SizedBox(height: 16),
                  _buildTextField('Phone Number', _phoneController, icon: LucideIcons.phone, enabled: _isEditing),
                  const SizedBox(height: 16),
                  _buildTextField('Bio', _bioController, icon: LucideIcons.fileText, enabled: _isEditing, maxLines: 3),
                  
                  if (_isEditing) ...[
                    const SizedBox(height: 32),
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isSaving ? null : _saveProfile,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: UsalamaTheme.primaryRed,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isSaving
                            ? const SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text(
                                'Save Changes',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    bool enabled = true,
    int maxLines = 1,
    IconData? icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          enabled: enabled,
          maxLines: maxLines,
          style: TextStyle(
            color: enabled ? Colors.white : const Color(0xFF94A3B8),
          ),
          decoration: InputDecoration(
            prefixIcon: icon != null ? Icon(icon, color: const Color(0xFF64748B), size: 20) : null,
            filled: true,
            fillColor: enabled ? const Color(0xFF0F172A) : const Color(0xFF0F172A).withOpacity(0.5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: enabled ? const Color(0xFF334155) : Colors.transparent),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: enabled ? const Color(0xFF334155) : Colors.transparent),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.transparent),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: UsalamaTheme.primaryRed),
            ),
          ),
        ),
      ],
    );
  }
}
