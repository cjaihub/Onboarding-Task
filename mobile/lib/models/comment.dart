class Comment {
  final int id;
  final int workItem;
  final int? authorId;
  final String? authorName;
  final String message;
  final DateTime? createdAt;

  Comment({
    required this.id,
    required this.workItem,
    this.authorId,
    this.authorName,
    required this.message,
    this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'],
      workItem: json['work_item'],
      authorId: json['author'],
      authorName: json['author_name'] ?? 'Unknown',
      message: json['message'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}
