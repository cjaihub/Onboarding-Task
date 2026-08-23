import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../board/screens/board_screen.dart';
import '../../projects/screens/project_dashboard_screen.dart';
import '../../work_items/screens/work_items_screen.dart';
import '../../projects/screens/projects_screen.dart';
import '../../activity/screens/activity_screen.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({Key? key}) : super(key: key);

  @override
  _MainLayoutState createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const ProjectDashboardScreen(),
    const ProjectsScreen(),
    const BoardScreen(),
    const WorkItemsScreen(),
    const ActivityScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        backgroundColor: Theme.of(context).colorScheme.surface,
        selectedItemColor: UsalamaTheme.primaryRed,
        unselectedItemColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.54),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.admin_panel_settings),
            label: 'Admin Board',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.folder),
            label: 'Projects',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.developer_board),
            label: 'Board',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt),
            label: 'Work Tasks',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'Activity',
          ),
        ],
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
