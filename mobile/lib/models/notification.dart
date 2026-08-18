class AppNotification {
  final int id;
  final String message;
  final bool read;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.message,
    required this.read,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'],
      message: json['message'] ?? 'Notification',
      read: json['read'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
