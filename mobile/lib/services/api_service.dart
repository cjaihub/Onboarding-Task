import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

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
  static void Function()? onUnauthenticated;
  
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }
    // Android emulator alias for localhost
    return 'http://10.0.2.2:8000/api';
  }

  static String get wsBaseUrl {
    if (kIsWeb) {
      return 'ws://localhost:8000/ws';
    }
    return 'ws://10.0.2.2:8000/ws';
  }
  
  static final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    final headers = {
      'Content-Type': 'application/json',
      'Connection': 'close', // Prevents connection reset by peer with dev server
    };
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

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

  Future<dynamic> _requestWithRetry(Future<http.Response> Function() requestFn) async {
    int maxRetries = 3;
    for (int attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        http.Response response = await requestFn();
        
        if (response.statusCode == 401) {
          // Attempt token refresh
          final refreshToken = await _storage.read(key: 'refresh_token');
          if (refreshToken != null) {
            final refreshResponse = await http.post(
              Uri.parse('$baseUrl/auth/refresh/'),
              headers: {'Content-Type': 'application/json'},
              body: json.encode({'refresh': refreshToken}),
            );
            
            if (refreshResponse.statusCode == 200) {
              final data = json.decode(refreshResponse.body);
              await _storage.write(key: 'access_token', value: data['access']);
              if (data.containsKey('refresh')) {
                await _storage.write(key: 'refresh_token', value: data['refresh']);
              }
              // Retry the original request
              response = await requestFn();
            } else {
              await _storage.delete(key: 'access_token');
              await _storage.delete(key: 'refresh_token');
              onUnauthenticated?.call();
              throw ApiException(401, 'Session expired. Please log in again.');
            }
          } else {
            await _storage.delete(key: 'access_token');
            await _storage.delete(key: 'refresh_token');
            onUnauthenticated?.call();
            throw ApiException(401, 'Session expired. Please log in again.');
          }
        }
        
        return _handleResponse(response);
      } on SocketException {
        if (attempt == maxRetries) throw Exception('Network failure. Please check your connection to the server.');
        await Future.delayed(Duration(milliseconds: 500 * attempt));
      } on TimeoutException {
        if (attempt == maxRetries) throw Exception('Request timed out. The server is taking too long to respond.');
        await Future.delayed(Duration(milliseconds: 500 * attempt));
      } on http.ClientException catch (e) {
        if (attempt == maxRetries) throw Exception('Client error: ${e.message}. Are you sure the backend is running?');
        await Future.delayed(Duration(milliseconds: 500 * attempt));
      } on FormatException catch (e) {
        throw Exception('Invalid data received from server. Expected JSON but got something else.');
      } catch (e, stack) {
        if (e is ApiException) rethrow;
        debugPrint('API Service Error: $e\n$stack');
        throw Exception('Failed to communicate with server: $e');
      }
    }
    throw Exception('Failed to communicate with server after multiple attempts.');
  }

  Future<dynamic> get(String endpoint) async {
    return _requestWithRetry(() async {
      final headers = await _getHeaders();
      return await http.get(Uri.parse('$baseUrl$endpoint'), headers: headers).timeout(const Duration(seconds: 10));
    });
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    return _requestWithRetry(() async {
      final headers = await _getHeaders();
      return await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: json.encode(body),
      ).timeout(const Duration(seconds: 10));
    });
  }

  Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    return _requestWithRetry(() async {
      final headers = await _getHeaders();
      return await http.patch(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: json.encode(body),
      ).timeout(const Duration(seconds: 10));
    });
  }

  Future<dynamic> uploadFile(String endpoint, Map<String, String> fields, {String? filePath, List<int>? fileBytes, String? fileName, String fileField = 'file'}) async {
    return _requestWithRetry(() async {
      final headers = await _getHeaders();
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl$endpoint'));
      
      request.headers.addAll(headers);
      request.fields.addAll(fields);
      
      if (filePath != null) {
        request.files.add(await http.MultipartFile.fromPath(fileField, filePath));
      } else if (fileBytes != null && fileName != null) {
        request.files.add(http.MultipartFile.fromBytes(fileField, fileBytes, filename: fileName));
      }

      final streamedResponse = await request.send().timeout(const Duration(seconds: 30));
      return await http.Response.fromStream(streamedResponse);
    });
  }
}
