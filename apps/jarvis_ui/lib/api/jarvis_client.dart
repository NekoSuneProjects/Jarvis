import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';

class JarvisClient {
  JarvisClient({required this.baseUrl});

  final String baseUrl;

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

  Future<String> chat(String message) async {
    final response = await http.post(
      _uri('/api/v1/chat'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'message': message}),
    );
    return (_json(response)['content'] ?? '').toString();
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
      throw Exception('Jarvis HTTP ${response.statusCode}: ${response.body}');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}
