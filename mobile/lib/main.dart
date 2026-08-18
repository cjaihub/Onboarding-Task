import 'package:flutter/material.dart';
import 'core/theme.dart';
import 'features/navigation/screens/main_layout.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: UsalamaApp()));
}

class UsalamaApp extends StatelessWidget {
  const UsalamaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Usalama',
      debugShowCheckedModeBanner: false,
      theme: UsalamaTheme.darkTheme,
      home: const MainLayout(),
    );
  }
}
