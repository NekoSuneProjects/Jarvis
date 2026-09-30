import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';

class JarvisReply {
  const JarvisReply({
    required this.content,
    this.conversationId,
    this.trace = const [],
  });

  final String content;
  final String? conversationId;
  final List<dynamic> trace;
}

class JarvisClient {
  JarvisClient({required this.baseUrl});

  final String baseUrl;
  String? conversationId;

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Future<Map<String, dynamic>> health() async {
    final response = await http.get(_uri('/health'));
    return _json(response);
  }

  Future<List<dynamic>> integrations() async {
    final response = await http.get(_uri('/api/v1/integrations'));
    return (_json(response)['integrations'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> timers() async {
    final response = await http.get(_uri('/api/v1/timers'));
    return (_json(response)['timers'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> alarms() async {
    final response = await http.get(_uri('/api/v1/alarms'));
    return (_json(response)['alarms'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> reminders() async {
    final response = await http.get(_uri('/api/v1/reminders'));
    return (_json(response)['reminders'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> notifications({bool unreadOnly = false}) async {
    final response = await http.get(
      _uri('/api/v1/notifications?unreadOnly=$unreadOnly'),
    );
    return (_json(response)['notifications'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> devices() async {
    final response = await http.get(_uri('/api/v1/devices'));
    return (_json(response)['devices'] as List<dynamic>? ?? []);
  }

  Future<JarvisReply> chat(String message) async {
    final response = await http.post(
      _uri('/api/v1/chat'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({
        'message': message,
        if (conversationId != null) 'conversationId': conversationId,
      }),
    );
    final json = _json(response);
    conversationId = json['conversationId']?.toString() ?? conversationId;
    return JarvisReply(
      content: (json['content'] ?? '').toString(),
      conversationId: conversationId,
      trace: json['trace'] as List<dynamic>? ?? const [],
    );
  }

  void newConversation() {
    conversationId = null;
  }

  Future<void> markNotificationRead(int id, bool read) async {
    final response = await http.patch(
      _uri('/api/v1/notifications/$id'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'read': read}),
    );
    _json(response);
  }

  WebSocketChannel events() {
    final httpUri = Uri.parse(baseUrl);
    final wsUri = httpUri.replace(
      scheme: httpUri.scheme == 'https' ? 'wss' : 'ws',
      path: '/api/v1/events',
    );
    return WebSocketChannel.connect(wsUri);
  }

  Map<String, dynamic> _json(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        'Jarvis HTTP ${response.statusCode}: ${response.body}',
      );
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}
