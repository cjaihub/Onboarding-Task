class Activity {
  final int id;
  final int workItemId;
  final String activityType;
  final String? fieldChanged;
  final String? oldValue;
  final String? newValue;
  final DateTime timestamp;

  Activity({
    required this.id,
    required this.workItemId,
    required this.activityType,
    this.fieldChanged,
    this.oldValue,
    this.newValue,
    required this.timestamp,
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      id: json['id'],
      workItemId: json['work_item'],
      activityType: json['activity_type'] ?? 'Unknown',
      fieldChanged: json['field_changed'],
      oldValue: json['old_value'],
      newValue: json['new_value'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}
