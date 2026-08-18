import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final Map<String, dynamic>? validationErrors;

  ApiException(this.statusCode, this.message, [this.validationErrors]);

  @override
  String toString() {
    if (validationErrors != null && validationErrors!.isNotEmpty) {
      final errors = validationErrors!.entries.map((e) => '${e.key}: ${e.value}').join(', ');
      return 'API Error $statusCode: $errors';
    }
    return 'API Error $statusCode: $message';
  }
}

class ApiService {
  // Use 10.0.2.2 for Android emulator, localhost for Web/Desktop
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:8000/api';
    }
    // Android emulator alias for localhost
    return 'http://10.0.2.2:8000/api';
  }
  
  // Basic Auth matching backend seed users for testing
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic YWxpY2U6YWxpY2U=' // alice:alice
  };

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return json.decode(response.body);
    } else if (response.statusCode == 400) {
      final errorData = json.decode(response.body);
      throw ApiException(response.statusCode, 'Validation Error', errorData is Map<String, dynamic> ? errorData : null);
    } else if (response.statusCode == 401) {
      throw ApiException(response.statusCode, 'Unauthorized. Please log in.');
    } else if (response.statusCode == 403) {
      throw ApiException(response.statusCode, 'Forbidden. You do not have permission.');
    } else if (response.statusCode == 404) {
      throw ApiException(response.statusCode, 'Resource not found.');
    } else {
      String msg = 'Server Error';
      try {
        final err = json.decode(response.body);
        msg = err['error'] ?? msg;
      } catch (_) {}
      throw ApiException(response.statusCode, msg);
    }
  }

  Future<dynamic> get(String endpoint) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl$endpoint'), headers: defaultHeaders).timeout(const Duration(seconds: 10));
      return _handleResponse(response);
    } on SocketException {
      throw Exception('Network failure. Please check your connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw Exception('Failed to communicate with server: $e');
    }
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: defaultHeaders,
        body: json.encode(body),
      ).timeout(const Duration(seconds: 10));
      return _handleResponse(response);
    } on SocketException {
      throw Exception('Network failure. Please check your connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw Exception('Failed to communicate with server: $e');
    }
  }
}
