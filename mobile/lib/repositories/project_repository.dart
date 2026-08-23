import '../models/project.dart';
import '../services/api_service.dart';

class ProjectRepository {
  final ApiService _apiService = ApiService();

  Future<List<Project>> getProjects({String? search, String? status, String? projectType}) async {
    String endpoint = '/projects/';
    final Map<String, String> queryParams = {};

    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (projectType != null && projectType.isNotEmpty) queryParams['project_type'] = projectType;

    if (queryParams.isNotEmpty) {
      final queryString = queryParams.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
      endpoint += '?$queryString';
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

  Future<void> addProjectComment(int projectId, String message) async {
    await _apiService.post('/project-comments/', {
      'project': projectId,
      'message': message,
    });
  }

  Future<void> uploadAttachment(int projectId, String description, {String? filePath, List<int>? fileBytes, String? fileName}) async {
    await _apiService.uploadFile(
      '/project-attachments/',
      {
        'project': projectId.toString(),
        'description': description,
      },
      filePath: filePath,
      fileBytes: fileBytes,
      fileName: fileName,
    );
  }
}
