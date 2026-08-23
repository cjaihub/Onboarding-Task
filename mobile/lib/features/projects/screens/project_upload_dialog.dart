import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/theme.dart';
import '../../../models/project.dart';
import '../../../repositories/project_repository.dart';

class ProjectUploadDialog extends StatefulWidget {
  final Project project;
  const ProjectUploadDialog({Key? key, required this.project}) : super(key: key);

  @override
  _ProjectUploadDialogState createState() => _ProjectUploadDialogState();
}

class _ProjectUploadDialogState extends State<ProjectUploadDialog> {
  final ProjectRepository _repository = ProjectRepository();
  final TextEditingController _descController = TextEditingController();
  bool _isSubmitting = false;
  FilePickerResult? _pickedFile;

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles();
    if (result != null) {
      setState(() {
        _pickedFile = result;
        if (_descController.text.isEmpty) {
          _descController.text = result.files.single.name;
        }
      });
    }
  }

  void _uploadFile() async {
    final desc = _descController.text.trim();
    if (desc.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a description.')));
      return;
    }

    if (_pickedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a file to upload.')));
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final file = _pickedFile!.files.single;
      List<int>? fileBytes = file.bytes;
      
      // On some platforms (like Android/iOS), bytes might be null and path is available
      if (fileBytes == null && file.path != null) {
        fileBytes = await File(file.path!).readAsBytes();
      }

      await _repository.uploadAttachment(
        widget.project.id,
        desc,
        fileBytes: fileBytes,
        fileName: file.name,
      );

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File uploaded successfully')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Upload File'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Upload a document to ${widget.project.name}.', style: const TextStyle(fontSize: 14)),
          const SizedBox(height: 16),
          InkWell(
            onTap: _pickFile,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.2)),
                borderRadius: BorderRadius.circular(8),
                color: Theme.of(context).colorScheme.surface,
              ),
              child: Column(
                children: [
                  Icon(
                    _pickedFile != null ? Icons.insert_drive_file : Icons.cloud_upload_outlined,
                    size: 32,
                    color: _pickedFile != null ? UsalamaTheme.primaryRed : Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _pickedFile != null ? _pickedFile!.files.single.name : 'Tap to select a file',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: _pickedFile != null ? FontWeight.bold : FontWeight.normal,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _descController,
            decoration: const InputDecoration(
              hintText: 'File Description...',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _isSubmitting ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _uploadFile,
          style: ElevatedButton.styleFrom(backgroundColor: UsalamaTheme.primaryRed),
          child: _isSubmitting
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Upload', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
