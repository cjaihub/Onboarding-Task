import '../models/work_item.dart';
import '../models/comment.dart';
import '../services/api_service.dart';

class WorkItemRepository {
  final ApiService _apiService = ApiService();

  Future<List<WorkItem>> getWorkItems({String? search, String? status, String? priority, int? pageSize}) async {
    String endpoint = '/work-items/?';
    if (search != null && search.isNotEmpty) endpoint += 'search=$search&';
    if (status != null && status.isNotEmpty) endpoint += 'status=$status&';
    if (priority != null && priority.isNotEmpty) endpoint += 'priority=$priority&';
    if (pageSize != null) endpoint += 'page_size=$pageSize&';

    final response = await _apiService.get(endpoint);
    if (response is Map<String, dynamic> && response.containsKey('results')) {
      final List<dynamic> results = response['results'];
      return results.map((json) => WorkItem.fromJson(json)).toList();
    } else if (response is List) {
      return response.map((json) => WorkItem.fromJson(json)).toList();
    }
    return [];
  }

  Future<WorkItem> getWorkItemDetails(int id) async {
    final response = await _apiService.get('/work-items/$id/');
    return WorkItem.fromJson(response);
  }

  Future<void> transitionStatus(int id, String newStatus, String? resolutionNote) async {
    final Map<String, dynamic> body = {'status': newStatus};
    if (resolutionNote != null && resolutionNote.isNotEmpty) {
      body['resolution_note'] = resolutionNote;
    }
    await _apiService.post('/work-items/$id/transition/', body);
  }

  Future<Comment> addComment(int workItemId, String message) async {
    final response = await _apiService.post('/work-items/$workItemId/comments/', {
      'message': message,
    });
    return Comment.fromJson(response);
  }
}
