import 'comment.dart';

class WorkItem {
  final int id;
  final String referenceNumber;
  final String title;
  final String? description;
  final int project;
  final String category;
  final String priority;
  final String status;
  final int? assignedTo;
  final int? reportedBy;
  final DateTime? dueDate;
  final String? resolutionNote;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final List<Comment> comments;

  WorkItem({
    required this.id,
    required this.referenceNumber,
    required this.title,
    this.description,
    required this.project,
    required this.category,
    required this.priority,
    required this.status,
    this.assignedTo,
    this.reportedBy,
    this.dueDate,
    this.resolutionNote,
    this.createdAt,
    this.updatedAt,
    this.comments = const [],
  });

  factory WorkItem.fromJson(Map<String, dynamic> json) {
    List<Comment> parsedComments = [];
    if (json['comments'] != null) {
      parsedComments = (json['comments'] as List).map((c) => Comment.fromJson(c)).toList();
    }

    return WorkItem(
      id: json['id'],
      referenceNumber: json['reference_number'] ?? '',
      title: json['title'] ?? 'No Title',
      description: json['description'],
      project: json['project'],
      category: json['category'] ?? 'OTHER',
      priority: json['priority'] ?? 'MEDIUM',
      status: json['status'] ?? 'OPEN',
      assignedTo: json['assigned_to'],
      reportedBy: json['reported_by'],
      dueDate: json['due_date'] != null ? DateTime.tryParse(json['due_date']) : null,
      resolutionNote: json['resolution_note'],
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) : null,
      comments: parsedComments,
    );
  }
}
