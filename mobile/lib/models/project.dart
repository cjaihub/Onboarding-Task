class Project {
  final int id;
  final String name;
  final String? description;
  final DateTime? createdAt;

  Project({
    required this.id,
    required this.name,
    this.description,
    this.createdAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'],
      name: json['name'] ?? 'Unknown Project',
      description: json['description'],
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }
}
