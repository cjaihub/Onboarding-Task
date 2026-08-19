import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../models/user.dart';

/// Shows a read-only profile for any team member.
/// Pass a [User] object fetched from the projects `members_detail` field.
class UserProfileScreen extends StatelessWidget {
  final User member;

  const UserProfileScreen({Key? key, required this.member}) : super(key: key);

  String get _displayName => member.fullName.isNotEmpty ? member.fullName : member.username;

  String get _initials {
    if (member.firstName.isNotEmpty && member.lastName.isNotEmpty) {
      return '${member.firstName[0]}${member.lastName[0]}'.toUpperCase();
    }
    final u = member.username;
    return u.substring(0, u.length >= 2 ? 2 : 1).toUpperCase();
  }

  Widget _infoTile(IconData icon, String label, String value, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: UsalamaTheme.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 10,
                        color: Colors.white54,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.8)),
                const SizedBox(height: 3),
                Text(value,
                    style: const TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = member.profile;

    return Scaffold(
      backgroundColor: UsalamaTheme.background,
      body: CustomScrollView(
        slivers: [
          // ── Hero App Bar ──────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 230,
            pinned: true,
            backgroundColor: UsalamaTheme.cardBackground,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      UsalamaTheme.primaryRed.withOpacity(0.55),
                      UsalamaTheme.cardBackground,
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
                              radius: 44,
                              backgroundImage: NetworkImage(profile!.avatarUrl),
                            )
                          : CircleAvatar(
                              radius: 44,
                              backgroundColor: UsalamaTheme.primaryRed.withOpacity(0.22),
                              child: Text(
                                _initials,
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: UsalamaTheme.primaryRed,
                                ),
                              ),
                            ),
                      const SizedBox(height: 12),
                      Text(_displayName,
                          style: const TextStyle(
                              fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text('@${member.username}',
                          style: const TextStyle(fontSize: 13, color: Colors.white54)),
                    ],
                  ),
                ),
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 18),
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
                          fontWeight: FontWeight.bold, color: Colors.white70)),
                  const SizedBox(height: 16),

                  if (profile?.role.isNotEmpty == true)
                    _infoTile(Icons.work_outline, 'ROLE', profile!.role,
                        UsalamaTheme.primaryRed),

                  if (member.email.isNotEmpty)
                    _infoTile(Icons.email_outlined, 'EMAIL', member.email, Colors.blue),

                  if (profile?.phoneNumber.isNotEmpty == true)
                    _infoTile(Icons.phone_outlined, 'PHONE', profile!.phoneNumber,
                        Colors.green),

                  if (profile?.bio.isNotEmpty == true) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: UsalamaTheme.cardBackground,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.06)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('BIO',
                              style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.white54,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.8)),
                          const SizedBox(height: 8),
                          Text(profile!.bio,
                              style: const TextStyle(
                                  fontSize: 14, color: Colors.white70, height: 1.5)),
                        ],
                      ),
                    ),
                  ],

                  // Fallback when profile has no extra data
                  if (profile == null ||
                      (profile.role.isEmpty &&
                          profile.bio.isEmpty &&
                          profile.phoneNumber.isEmpty &&
                          member.email.isEmpty))
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 24.0),
                        child: Text('No additional profile information available.',
                            style: const TextStyle(color: Colors.white38, fontSize: 13)),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
