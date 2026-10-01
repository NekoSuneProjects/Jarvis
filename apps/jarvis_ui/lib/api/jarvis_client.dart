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
  JarvisClient({
    required this.baseUrl,
    this.apiToken = '',
  });

  final String baseUrl;
  final String apiToken;
  String? conversationId;

  Map<String, String> get _headers => {
        if (apiToken.isNotEmpty) 'authorization': 'Bearer $apiToken',
      };

  Map<String, String> get _jsonHeaders => {
        'content-type': 'application/json',
        ..._headers,
      };

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Future<Map<String, dynamic>> health() async {
    final response = await http.get(_uri('/health'), headers: _headers);
    return _json(response);
  }

  Future<Map<String,dynamic>> settings() async {
    final response=await http.get(_uri('/api/v1/settings'),headers:_headers);
    return _json(response);
  }

  Future<Map<String,dynamic>> updateSettings(Map<String,dynamic> values) async {
    final response=await http.patch(
      _uri('/api/v1/settings'),
      headers:_jsonHeaders,
      body:jsonEncode(values),
    );
    return _json(response);
  }

  Future<Map<String,dynamic>> piperPreview({String? voice,String? text}) async {
    final response=await http.post(
      _uri('/api/v1/voice/piper/preview'),
      headers:_jsonHeaders,
      body:jsonEncode({
        if(voice!=null)'voice':voice,
        if(text!=null)'text':text,
      }),
    );
    return _json(response);
  }

  Future<List<dynamic>> integrations() async {
    final response = await http.get(_uri('/api/v1/integrations'), headers: _headers);
    return (_json(response)['integrations'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> timers() async {
    final response = await http.get(_uri('/api/v1/timers'), headers: _headers);
    return (_json(response)['timers'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> alarms() async {
    final response = await http.get(_uri('/api/v1/alarms'), headers: _headers);
    return (_json(response)['alarms'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> reminders() async {
    final response = await http.get(_uri('/api/v1/reminders'), headers: _headers);
    return (_json(response)['reminders'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> notifications({bool unreadOnly = false}) async {
    final response = await http.get(
      _uri('/api/v1/notifications?unreadOnly=$unreadOnly'),
      headers: _headers,
    );
    return (_json(response)['notifications'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> devices() async {
    final response = await http.get(_uri('/api/v1/devices'), headers: _headers);
    return (_json(response)['devices'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> memories() async {
    final response=await http.get(_uri('/api/v1/memories'),headers:_headers);
    return (_json(response)['memories'] as List<dynamic>? ?? []);
  }

  Future<void> forgetMemory(int id) async {
    final response=await http.delete(_uri('/api/v1/memories/$id'),headers:_headers);
    _json(response);
  }

  Future<List<dynamic>> permissions() async {
    final response=await http.get(_uri('/api/v1/permissions'),headers:_headers);
    return (_json(response)['permissions'] as List<dynamic>? ?? []);
  }

  Future<void> setPermission(String capability,String decision) async {
    final response=await http.patch(
      _uri('/api/v1/permissions/${Uri.encodeComponent(capability)}'),
      headers:_jsonHeaders,
      body:jsonEncode({'decision':decision}),
    );
    _json(response);
  }

  Future<void> reconnectIntegration(String id) async {
    final response=await http.post(
      _uri('/api/v1/integrations/${Uri.encodeComponent(id)}/reconnect'),
      headers:_jsonHeaders,
    );
    _json(response);
  }

  Future<JarvisReply> chat(String message) async {
    final response = await http.post(
      _uri('/api/v1/chat'),
      headers: _jsonHeaders,
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
      headers: _jsonHeaders,
      body: jsonEncode({'read': read}),
    );
    _json(response);
  }

  WebSocketChannel events() {
    final httpUri = Uri.parse(baseUrl);
    final wsUri = httpUri.replace(
      scheme: httpUri.scheme == 'https' ? 'wss' : 'ws',
      path: '/api/v1/events',
      queryParameters: apiToken.isEmpty ? null : {'token': apiToken},
    );
    return WebSocketChannel.connect(wsUri);
  }

  Map<String, dynamic> _json(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      try {
        final decoded=jsonDecode(response.body);
        if(decoded is Map<String,dynamic>){
          final error=decoded['error']?.toString() ?? 'Request failed';
          final details=decoded['details'];
          throw Exception(details==null ? error : '$error: $details');
        }
      } catch (e) {
        if(e is Exception) rethrow;
      }
      throw Exception('Jarvis HTTP ${response.statusCode}: ${response.body}');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}
