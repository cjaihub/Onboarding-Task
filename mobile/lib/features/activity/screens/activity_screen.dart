import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/activity.dart';
import '../../../repositories/activity_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import 'package:intl/intl.dart';

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({Key? key}) : super(key: key);

  @override
  _ActivityScreenState createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  final ActivityRepository _repository = ActivityRepository();
  List<Activity>? _activities;
  String? _error;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      if (_activities == null) _isLoading = true;
      _error = null;
    });

    try {
      final items = await _repository.getActivities();
      if (mounted) {
        setState(() {
          _activities = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildActivityItem(Activity item) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: Theme.of(context).colorScheme.surface,
        child: const Icon(Icons.history, color: UsalamaTheme.primaryRed),
      ),
      title: Text(item.activityType),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (item.fieldChanged != null)
            Text('Changed ${item.fieldChanged}: ${item.oldValue} -> ${item.newValue}'),
          Text(
            DateFormat('MM/dd/yyyy hh:mm a').format(item.timestamp),
            style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54)),
          ),
        ],
      ),
      isThreeLine: item.fieldChanged != null,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null && _activities == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Activity Feed')),
        body: SafeArea(child: ErrorView(message: _error!, onRetry: _fetchData)),
      );
    }

    if (_activities == null || (_isLoading && _activities == null)) {
      return Scaffold(
        appBar: AppBar(title: const Text('Activity Feed')),
        body: const SafeArea(child: LoadingView()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity Feed'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchData,
          color: UsalamaTheme.primaryRed,
          child: _activities!.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    const SizedBox(height: 100),
                    Center(child: Text('No recent activity.', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.54)))),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: _activities!.length,
                  separatorBuilder: (context, index) => Divider(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.24)),
                  itemBuilder: (context, index) {
                    return _buildActivityItem(_activities![index]);
                  },
                ),
        ),
      ),
    );
  }
}
