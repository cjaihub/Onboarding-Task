import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme.dart';
import '../models/user.dart';
import '../../../main.dart';
import '../providers/auth_provider.dart';

class UserProfileScreen extends ConsumerStatefulWidget {
  final User member;

  const UserProfileScreen({Key? key, required this.member}) : super(key: key);

  @override
  ConsumerState<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends ConsumerState<UserProfileScreen> {
  bool get _isCurrentUser {
    final currentUser = ref.watch(authProvider).user;
    return currentUser?.id == widget.member.id;
  }

  User get _displayUser {
    if (_isCurrentUser) {
      return ref.watch(authProvider).user ?? widget.member;
    }
    return widget.member;
  }

  String get _displayName => _displayUser.fullName.isNotEmpty ? _displayUser.fullName : _displayUser.username;

  String get _initials {
    if (_displayUser.firstName.isNotEmpty && _displayUser.lastName.isNotEmpty) {
      return '${_displayUser.firstName[0]}${_displayUser.lastName[0]}'.toUpperCase();
    }
    final u = _displayUser.username;
    return u.substring(0, u.length >= 2 ? 2 : 1).toUpperCase();
  }

  void _showEditProfileModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return _EditProfileForm(user: _displayUser);
      },
    );
  }

  Widget _infoTile(BuildContext context, IconData icon, String label, String value, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 10,
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                        fontWeight: 
                        FontWeight.w700,
                        letterSpacing: 0.8)),
                const SizedBox(height: 4),
                Text(value,
                    style: TextStyle(
                        fontSize: 15,
                        color: Theme.of(context).colorScheme.onSurface,
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = _displayUser.profile;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          // ── Hero App Bar ──────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            backgroundColor: Theme.of(context).colorScheme.surface,
            actions: [
              if (_isCurrentUser)
                IconButton(
                  icon: Icon(Icons.edit, color: Theme.of(context).colorScheme.onSurface),
                  onPressed: _showEditProfileModal,
                ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      UsalamaTheme.primaryRed.withValues(alpha: 0.15),
                      Theme.of(context).colorScheme.surface,
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 32),
                      // Avatar
                      profile?.avatarUrl.isNotEmpty == true
                          ? CircleAvatar(
                              radius: 46,
                              backgroundImage: NetworkImage(profile!.avatarUrl),
                            )
                          : CircleAvatar(
                              radius: 46,
                              backgroundColor: UsalamaTheme.primaryRed.withValues(alpha: 0.2),
                              child: Text(
                                _initials,
                                style: const TextStyle(
                                  fontSize: 30,
                                  fontWeight: FontWeight.w900,
                                  color: UsalamaTheme.primaryRed,
                                ),
                              ),
                            ),
                      const SizedBox(height: 16),
                      Text(_displayName,
                          style: TextStyle(
                              fontSize: 22, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)),
                      const SizedBox(height: 4),
                      Text('@${_displayUser.username}',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
                    ],
                  ),
                ),
              ),
            ),
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new, size: 18, color: Theme.of(context).colorScheme.onSurface),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),

          // ── Profile Details ───────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Profile Details',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7))),
                  const SizedBox(height: 16),

                  if (profile?.role.isNotEmpty == true)
                    _infoTile(context, Icons.work_outline, 'ROLE', profile!.role, UsalamaTheme.primaryRed),

                  if (_displayUser.email.isNotEmpty)
                    _infoTile(context, Icons.email_outlined, 'EMAIL', _displayUser.email, UsalamaTheme.primaryRed),

                  if (profile?.phoneNumber.isNotEmpty == true)
                    _infoTile(context, Icons.phone_outlined, 'PHONE', profile!.phoneNumber, Colors.green),

                  if (profile?.bio.isNotEmpty == true) ...[
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('BIO',
                              style: TextStyle(
                                  fontSize: 10,
                                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.8)),
                          const SizedBox(height: 10),
                          Text(profile!.bio,
                              style: TextStyle(
                                  fontSize: 15, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8), height: 1.5)),
                        ],
                      ),
                    ),
                  ],

                  // Fallback when profile has no extra data
                  if (profile == null ||
                      (profile.role.isEmpty &&
                          profile.bio.isEmpty &&
                          profile.phoneNumber.isEmpty &&
                          _displayUser.email.isEmpty))
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 32.0),
                        child: Text('No additional profile information available.',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 14)),
                      ),
                    ),

                  if (_isCurrentUser) ...[
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).colorScheme.error.withValues(alpha: 0.1),
                          foregroundColor: Theme.of(context).colorScheme.error,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        onPressed: () async {
                          await ref.read(authProvider.notifier).logout();
                          if (context.mounted) {
                            Navigator.of(context).pushAndRemoveUntil(
                              MaterialPageRoute(builder: (_) => const AuthWrapper()),
                              (route) => false,
                            );
                          }
                        },
                        icon: const Icon(Icons.logout),
                        label: const Text('Log Out', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EditProfileForm extends ConsumerStatefulWidget {
  final User user;
  const _EditProfileForm({required this.user});

  @override
  ConsumerState<_EditProfileForm> createState() => _EditProfileFormState();
}

class _EditProfileFormState extends ConsumerState<_EditProfileForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstNameCtrl;
  late TextEditingController _lastNameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _roleCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _bioCtrl;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _firstNameCtrl = TextEditingController(text: widget.user.firstName);
    _lastNameCtrl = TextEditingController(text: widget.user.lastName);
    _emailCtrl = TextEditingController(text: widget.user.email);
    _roleCtrl = TextEditingController(text: widget.user.profile?.role ?? '');
    _phoneCtrl = TextEditingController(text: widget.user.profile?.phoneNumber ?? '');
    _bioCtrl = TextEditingController(text: widget.user.profile?.bio ?? '');
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _roleCtrl.dispose();
    _phoneCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    
    final data = {
      'first_name': _firstNameCtrl.text.trim(),
      'last_name': _lastNameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'profile': {
        'role': _roleCtrl.text.trim(),
        'phone_number': _phoneCtrl.text.trim(),
        'bio': _bioCtrl.text.trim(),
      }
    };

    try {
      await ref.read(authProvider.notifier).updateProfile(data);
      if (mounted) {
        Navigator.pop(context); // Close modal
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update profile: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 24,
        right: 24,
        top: 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Edit Profile', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(child: _buildTextField('First Name', _firstNameCtrl)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildTextField('Last Name', _lastNameCtrl)),
                ],
              ),
              const SizedBox(height: 16),
              _buildTextField('Email', _emailCtrl, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              _buildTextField('Role', _roleCtrl),
              const SizedBox(height: 16),
              _buildTextField('Phone Number', _phoneCtrl, keyboardType: TextInputType.phone),
              const SizedBox(height: 16),
              _buildTextField('Bio', _bioCtrl, maxLines: 3),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: UsalamaTheme.primaryRed,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _isSaving ? null : _save,
                  child: _isSaving 
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Save Changes', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {int maxLines = 1, TextInputType? keyboardType}) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
        filled: true,
        fillColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.03),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: UsalamaTheme.primaryRed),
        ),
      ),
    );
  }
}
