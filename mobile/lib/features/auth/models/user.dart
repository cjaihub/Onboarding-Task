class UserProfile {
  final String bio;
  final String role;
  final String avatarUrl;
  final String phoneNumber;

  UserProfile({
    this.bio = '',
    this.role = '',
    this.avatarUrl = '',
    this.phoneNumber = '',
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      bio: json['bio'] as String? ?? '',
      role: json['role'] as String? ?? '',
      avatarUrl: json['avatar_url'] as String? ?? '',
      phoneNumber: json['phone_number'] as String? ?? '',
    );
  }
}

class User {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final bool isStaff;
  final UserProfile? profile;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.isStaff,
    this.profile,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      username: json['username'] as String,
      email: json['email'] as String? ?? '',
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      isStaff: json['is_staff'] as bool? ?? false,
      profile: json['profile'] != null
          ? UserProfile.fromJson(json['profile'] as Map<String, dynamic>)
          : null,
    );
  }

  String get fullName {
    if (firstName.isEmpty && lastName.isEmpty) {
      return username;
    }
    return '$firstName $lastName'.trim();
  }
}
