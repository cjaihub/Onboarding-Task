import '../models/activity.dart';
import '../services/api_service.dart';

class ActivityRepository {
  final ApiService _apiService = ApiService();

  Future<List<Activity>> getActivities() async {
    final response = await _apiService.get('/activities/');
    if (response is Map<String, dynamic> && response.containsKey('results')) {
      final List<dynamic> results = response['results'];
      return results.map((json) => Activity.fromJson(json)).toList();
    } else if (response is List) {
      return response.map((json) => Activity.fromJson(json)).toList();
    }
    return [];
  }
}
