import '../services/api_service.dart';
import '../models/dashboard_stats.dart';

class DashboardRepository {
  final ApiService _apiService = ApiService();

  Future<DashboardStats> getDashboardStats() async {
    final response = await _apiService.get('/dashboard/');
    return DashboardStats.fromJson(response as Map<String, dynamic>);
  }
}
