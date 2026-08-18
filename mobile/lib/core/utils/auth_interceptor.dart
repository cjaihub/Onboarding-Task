import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../theme.dart';

/// Checks if the user is authenticated. 
/// If so, executes [onAuthenticated].
/// If not, shows a dialog prompting them to log in.
void requireAuth(BuildContext context, WidgetRef ref, VoidCallback onAuthenticated) {
  final authState = ref.read(authProvider);

  if (authState.isAuthenticated) {
    onAuthenticated();
  } else {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: UsalamaTheme.surfaceDark,
          title: const Text('Action Required', style: TextStyle(color: Colors.white)),
          content: const Text(
            'You must be logged in to perform this action. Please log in or create an account to continue.',
            style: TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: UsalamaTheme.primaryRed),
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              child: const Text('Log In', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }
}
