import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../services/api_service.dart';
import '../models/user.dart';

class AuthService {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> login(String username, String password) async {
    final response = await _apiService.post('/auth/login/', {
      'username': username,
      'password': password,
    });

    final accessToken = response['access'];
    final refreshToken = response['refresh'];

    if (accessToken != null) {
      await _storage.write(key: 'access_token', value: accessToken);
    }
    if (refreshToken != null) {
      await _storage.write(key: 'refresh_token', value: refreshToken);
    }
  }

  Future<void> register(Map<String, dynamic> userData) async {
    final response = await _apiService.post('/auth/register/', userData);
    
    // The backend returns tokens upon successful registration
    final token = response['access'];
    if (token != null) {
      await _storage.write(key: 'access_token', value: token);
    }
    if (response['refresh'] != null) {
      await _storage.write(key: 'refresh_token', value: response['refresh']);
    }
  }

  Future<User> getMe() async {
    final response = await _apiService.get('/auth/me/');
    return User.fromJson(response);
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken != null) {
        // Attempt to blacklist the refresh token on the server
        await _apiService.post('/auth/logout/', {'refresh': refreshToken});
      }
    } catch (e) {
      // Ignore network errors on logout, we still want to clear local tokens
    } finally {
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
    }
  }
}
