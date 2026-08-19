import '../models/workflow.dart';
import '../services/api_service.dart';

class WorkflowRepository {
  final ApiService _apiService = ApiService();

  Future<List<Workflow>> getWorkflows({int? projectId}) async {
    String endpoint = '/workflows/';
    if (projectId != null) {
      endpoint += '?project=$projectId';
    }
    
    final response = await _apiService.get(endpoint);
    final List<dynamic> results = response is Map ? response['results'] ?? response : response;
    
    return results.map((json) => Workflow.fromJson(json)).toList();
  }
}
