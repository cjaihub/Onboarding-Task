import 'package:flutter/material.dart';
import '../../../core/theme.dart';
import '../../../models/notification.dart';
import '../../../repositories/notification_repository.dart';
import '../../../widgets/error_view.dart';
import '../../../widgets/loading_view.dart';
import 'package:intl/intl.dart';

void showNotificationsModal(BuildContext context) {
  showModalBottomSheet(
    context: context,
    backgroundColor: UsalamaTheme.surfaceDark,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
    builder: (context) {
      return const NotificationsModal();
    },
  );
}

class NotificationsModal extends StatefulWidget {
  const NotificationsModal({Key? key}) : super(key: key);

  @override
  _NotificationsModalState createState() => _NotificationsModalState();
}

class _NotificationsModalState extends State<NotificationsModal> {
  final NotificationRepository _repository = NotificationRepository();
  List<AppNotification>? _notifications;
  String? _error;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      if (_notifications == null) _isLoading = true;
      _error = null;
    });

    try {
      final items = await _repository.getNotifications();
      if (mounted) {
        setState(() {
          _notifications = items;
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

  Future<void> _markAllRead() async {
    try {
      await _repository.markAllAsRead();
      _fetchData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      heightFactor: 0.8,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Notifications', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: _markAllRead,
                  child: const Text('Mark all as read', style: TextStyle(color: UsalamaTheme.primaryRed)),
                )
              ],
            ),
          ),
          const Divider(color: Colors.white24, height: 1),
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_error != null && _notifications == null) {
      return ErrorView(message: _error!, onRetry: _fetchData);
    }

    if (_notifications == null || (_isLoading && _notifications == null)) {
      return const LoadingView();
    }

    if (_notifications!.isEmpty) {
      return const Center(child: Text('No notifications.', style: TextStyle(color: Colors.white54)));
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      itemCount: _notifications!.length,
      separatorBuilder: (context, index) => const Divider(color: Colors.white24),
      itemBuilder: (context, index) {
        final item = _notifications![index];
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: item.read ? UsalamaTheme.surfaceDark : UsalamaTheme.primaryRed.withOpacity(0.2),
            child: Icon(
              item.read ? Icons.notifications_none : Icons.notifications_active,
              color: item.read ? Colors.white54 : UsalamaTheme.primaryRed,
            ),
          ),
          title: Text(
            item.message,
            style: TextStyle(fontWeight: item.read ? FontWeight.normal : FontWeight.bold),
          ),
          subtitle: Text(
            DateFormat('MM/dd/yyyy hh:mm a').format(item.createdAt),
            style: const TextStyle(fontSize: 12, color: Colors.white54),
          ),
        );
      },
    );
  }
}
