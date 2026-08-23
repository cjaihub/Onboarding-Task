import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../models/project.dart';

class ProjectCard extends StatelessWidget {
  final Project project;
  final int workItemCount;
  final VoidCallback onTap;

  const ProjectCard({
    Key? key,
    required this.project,
    required this.workItemCount,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shadowColor: Colors.black45,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05)),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Theme.of(context).colorScheme.surface, // Uses app theme surface color
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: UsalamaTheme.primaryRed.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.folder_special,
                      color: UsalamaTheme.primaryRed,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          project.name,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                project.projectType,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: _getStatusColor(project.status).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: _getStatusColor(project.status).withOpacity(0.3)),
                              ),
                              child: Text(
                                project.status.replaceAll('_', ' '),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: _getStatusColor(project.status),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '$workItemCount tasks',
                              style: TextStyle(
                                fontSize: 12,
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.54),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
                ],
              ),
              if (project.description != null && project.description!.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  project.description!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7), height: 1.4),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  _buildMemberAvatars(project.members ?? []),
                  const Spacer(),
                  Text(
                    'Created ${project.createdAt != null ? project.createdAt.toString().split(' ')[0] : 'N/A'}',
                    style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.38)),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMemberAvatars(List<int> members) {
    if (members.isEmpty) {
      return const Text('No members', style: TextStyle(fontSize: 12, color: Colors.grey));
    }
    return SizedBox(
      height: 32,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (int i = 0; i < members.length && i < 4; i++)
            Align(
              widthFactor: 0.7,
              child: CircleAvatar(
                radius: 16,
                backgroundColor: Colors.grey.shade800,
                child: Text(
                  'U${members[i]}',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
          if (members.length > 4)
            Align(
              widthFactor: 0.7,
              child: CircleAvatar(
                radius: 16,
                backgroundColor: UsalamaTheme.primaryRed,
                child: Text(
                  '+${members.length - 4}',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'IN_PROGRESS':
        return Colors.orange;
      case 'ACTIVE':
        return Colors.green;
      case 'ON_HOLD':
        return Colors.amber;
      case 'COMPLETED':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
}

