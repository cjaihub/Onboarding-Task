import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme.dart';
import 'features/navigation/screens/main_layout.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';

void main() {
  runApp(const ProviderScope(child: UsalamaApp()));
}

class UsalamaApp extends ConsumerWidget {
  const UsalamaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentThemeMode = ref.watch(themeProvider);
    
    return MaterialApp(
      title: 'Usalama',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      theme: UsalamaTheme.lightTheme,
      darkTheme: UsalamaTheme.darkTheme,
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    // Note: When the app first starts, authProvider checks status and isLoading is true.
    // If you prefer a splash screen while it checks, you can do:
    if (authState.isLoading && !authState.isAuthenticated && authState.error == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    // If not authenticated, force the user to log in
    if (!authState.isAuthenticated) {
      return const LoginScreen();
    }

    // Authenticated users go to MainLayout
    return const MainLayout();
  }
}
