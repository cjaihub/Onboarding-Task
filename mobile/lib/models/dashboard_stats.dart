import 'activity.dart';

class DashboardStats {
  final int total;
  final int open;
  final int inProgress;
  final int review;
  final int resolved;
  final int closed;
  final int critical;
  final int overdue;
  final Map<String, int> byStatus;
  final Map<String, int> byPriority;
  final List<Activity> recentActivity;

  DashboardStats({
    required this.total,
    required this.open,
    required this.inProgress,
    required this.review,
    required this.resolved,
    required this.closed,
    required this.critical,
    required this.overdue,
    required this.byStatus,
    required this.byPriority,
    required this.recentActivity,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      total: json['total'] ?? 0,
      open: json['open'] ?? 0,
      inProgress: json['in_progress'] ?? 0,
      review: json['review'] ?? 0,
      resolved: json['resolved'] ?? 0,
      closed: json['closed'] ?? 0,
      critical: json['critical'] ?? 0,
      overdue: json['overdue'] ?? 0,
      byStatus: Map<String, int>.from(json['by_status'] ?? {}),
      byPriority: Map<String, int>.from(json['by_priority'] ?? {}),
      recentActivity: (json['recent_activity'] as List<dynamic>?)
              ?.map((e) => Activity.fromJson(e))
              .toList() ??
          [],
    );
  }
}
