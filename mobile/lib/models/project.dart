import '../features/auth/models/user.dart';

class ProjectAttachment {
  final int id;
  final int project;
  final int? uploadedBy;
  final String? uploadedByName;
  final String fileUrl;
  final String description;
  final DateTime? createdAt;

  ProjectAttachment({
    required this.id,
    required this.project,
    this.uploadedBy,
    this.uploadedByName,
    required this.fileUrl,
    required this.description,
    this.createdAt,
  });

  factory ProjectAttachment.fromJson(Map<String, dynamic> json) {
    return ProjectAttachment(
      id: json['id'],
      project: json['project'],
      uploadedBy: json['uploaded_by'],
      uploadedByName: json['uploaded_by_name'],
      fileUrl: json['file_url'] ?? '',
      description: json['description'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}

class ProjectComment {
  final int id;
  final int project;
  final int author;
  final String authorName;
  final String? authorAvatar;
  final String message;
  final DateTime? createdAt;

  ProjectComment({
    required this.id,
    required this.project,
    required this.author,
    required this.authorName,
    this.authorAvatar,
    required this.message,
    this.createdAt,
  });

  factory ProjectComment.fromJson(Map<String, dynamic> json) {
    return ProjectComment(
      id: json['id'],
      project: json['project'],
      author: json['author'],
      authorName: json['author_name'] ?? 'Unknown',
      authorAvatar: json['author_avatar'],
      message: json['message'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}

class Project {
  final int id;
  final String name;
  final String? description;
  final String projectType;
  final List<String> techTools;
  final DateTime? createdAt;
  final List<int> members;
  final List<User> membersDetail;
  final List<ProjectAttachment> attachments;
  final List<ProjectComment> comments;

  Project({
    required this.id,
    required this.name,
    this.description,
    required this.projectType,
    required this.techTools,
    this.createdAt,
    required this.members,
    required this.membersDetail,
    required this.attachments,
    required this.comments,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'],
      name: json['name'] ?? 'Unknown Project',
      description: json['description'],
      projectType: json['project_type'] ?? 'FULLSTACK',
      techTools: (json['tech_tools'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
      members: (json['members'] as List<dynamic>?)?.map((e) => e as int).toList() ?? [],
      membersDetail: (json['members_detail'] as List<dynamic>?)?.map((e) => User.fromJson(e)).toList() ?? [],
      attachments: (json['attachments'] as List<dynamic>?)?.map((e) => ProjectAttachment.fromJson(e)).toList() ?? [],
      comments: (json['comments'] as List<dynamic>?)?.map((e) => ProjectComment.fromJson(e)).toList() ?? [],
    );
  }
}
