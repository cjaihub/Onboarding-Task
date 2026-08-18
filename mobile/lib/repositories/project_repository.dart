import '../models/project.dart';
import '../services/api_service.dart';

class ProjectRepository {
  final ApiService _apiService = ApiService();

  Future<List<Project>> getProjects({String? search}) async {
    String endpoint = '/projects/';
    if (search != null && search.isNotEmpty) {
      endpoint += '?search=$search';
    }
    final response = await _apiService.get(endpoint);
    if (response is Map<String, dynamic> && response.containsKey('results')) {
      final List<dynamic> results = response['results'];
      return results.map((json) => Project.fromJson(json)).toList();
    } else if (response is List) {
      return response.map((json) => Project.fromJson(json)).toList();
    }
    return [];
  }

  Future<Project> getProjectDetails(int id) async {
    final response = await _apiService.get('/projects/$id/');
    return Project.fromJson(response);
  }
}
