class Workflow {
  final int id;
  final String name;
  final String description;
  final bool isActive;
  final int? projectId;
  final DateTime createdAt;
  final DateTime updatedAt;

  Workflow({
    required this.id,
    required this.name,
    required this.description,
    required this.isActive,
    this.projectId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Workflow.fromJson(Map<String, dynamic> json) {
    return Workflow(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      isActive: json['is_active'] ?? false,
      projectId: json['project'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}
