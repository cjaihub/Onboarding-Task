import '../models/notification.dart';
import '../services/api_service.dart';

class NotificationRepository {
  final ApiService _apiService = ApiService();

  Future<List<AppNotification>> getNotifications() async {
    final response = await _apiService.get('/collaboration/notifications/');
    if (response is Map<String, dynamic> && response.containsKey('results')) {
      final List<dynamic> results = response['results'];
      return results.map((json) => AppNotification.fromJson(json)).toList();
    } else if (response is List) {
      return response.map((json) => AppNotification.fromJson(json)).toList();
    }
    return [];
  }

  Future<void> markAllAsRead() async {
    await _apiService.post('/collaboration/notifications/mark_all_read/', {});
  }
}
