import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Provides a global instance of WebSocketService
final webSocketServiceProvider = Provider<WebSocketService>((ref) {
  final service = WebSocketService();
  ref.onDispose(() => service.disconnect());
  return service;
});

class WebSocketService extends ChangeNotifier {
  WebSocketChannel? _channel;
  bool _isConnected = false;
  
  bool get isConnected => _isConnected;

  void connect(String url) {
    if (_isConnected) return;
    
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _isConnected = true;
      notifyListeners();

      _channel!.stream.listen(
        (message) {
          final data = jsonDecode(message);
          if (data['type'] != null) {
            // Broadcast the event to any listeners if necessary
            // Or we can just let UI listeners refresh based on generic change
            notifyListeners();
          }
        },
        onDone: () {
          _isConnected = false;
          notifyListeners();
        },
        onError: (error) {
          _isConnected = false;
          notifyListeners();
        },
      );
    } catch (e) {
      _isConnected = false;
      notifyListeners();
    }
  }

  void disconnect() {
    _channel?.sink.close();
    _isConnected = false;
    notifyListeners();
  }
}
