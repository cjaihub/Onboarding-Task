class User {
  final int id;
  final String username;
  final String? firstName;
  final String? lastName;
  final String? email;

  User({
    required this.id,
    required this.username,
    this.firstName,
    this.lastName,
    this.email,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'] ?? '',
      firstName: json['first_name'],
      lastName: json['last_name'],
      email: json['email'],
    );
  }

  String get displayName {
    if (firstName != null && firstName!.isNotEmpty) {
      return '$firstName ${lastName ?? ''}'.trim();
    }
    return username;
  }
}
