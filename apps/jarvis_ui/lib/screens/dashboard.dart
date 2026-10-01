import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';

import '../api/jarvis_client.dart';
import '../widgets/jarvis_orb.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.client});

  final JarvisClient client;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final input = TextEditingController();
  final messages = <({bool user, String text})>[];

  Map<String, dynamic>? health;
  List<dynamic> integrations = [];
  List<dynamic> timers = [];
  List<dynamic> alarms = [];
  List<dynamic> reminders = [];
  List<dynamic> notifications = [];
  List<dynamic> devices = [];
  List<dynamic> memories = [];
  List<dynamic> permissions = [];

  JarvisState state = JarvisState.idle;
  StreamSubscription<dynamic>? eventSubscription;
  String? error;

  @override
  void initState() {
    super.initState();
    _refresh();
    _connectEvents();
  }

  Future<void> _refresh() async {
    try {
      final results = await Future.wait([
        widget.client.health(),
        widget.client.integrations(),
        widget.client.timers(),
        widget.client.alarms(),
        widget.client.reminders(),
        widget.client.notifications(),
        widget.client.devices(),
        widget.client.memories(),
        widget.client.permissions(),
      ]);
      if (!mounted) return;
      setState(() {
        health = results[0] as Map<String, dynamic>;
        integrations = results[1] as List<dynamic>;
        timers = results[2] as List<dynamic>;
        alarms = results[3] as List<dynamic>;
        reminders = results[4] as List<dynamic>;
        notifications = results[5] as List<dynamic>;
        devices = results[6] as List<dynamic>;
        memories = results[7] as List<dynamic>;
        permissions = results[8] as List<dynamic>;
        error = null;
      });
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    }
  }

  void _connectEvents() {
    try {
      final channel = widget.client.events();
      eventSubscription = channel.stream.listen(
        (raw) {
          final event = jsonDecode(raw.toString()) as Map<String, dynamic>;
          final type = event['type']?.toString() ?? '';
          if (type == 'tool.failed') {
            final payload = event['payload'];
            if (payload is Map<String, dynamic>) {
              final message = payload['error']?.toString() ?? '';
              const prefix = 'Permission requires approval: ';
              if (message.startsWith(prefix)) {
                final capability = message.substring(prefix.length).trim();
                if (capability.isNotEmpty) {
                  Future.microtask(() => _confirmPermission(capability));
                }
              }
            }
          }
          if (type.startsWith('timer.') ||
              type.startsWith('alarm.') ||
              type.startsWith('reminder.') ||
              type.startsWith('notification.') ||
              type.startsWith('device.') ||
              type.startsWith('routine.')) {
            _refresh();
          }
          if (!mounted) return;
          setState(() {
            if (type == 'voice.listening') state = JarvisState.listening;
            if (type == 'voice.thinking') state = JarvisState.thinking;
            if (type == 'voice.speaking') state = JarvisState.speaking;
            if (type == 'voice.idle') state = JarvisState.idle;
          });
        },
        onError: (Object e) {
          if (mounted) setState(() => error = 'Event stream: $e');
        },
      );
    } catch (e) {
      error = e.toString();
    }
  }

  Future<void> _send() async {
    final text = input.text.trim();
    if (text.isEmpty) return;

    input.clear();
    setState(() {
      messages.add((user: true, text: text));
      state = JarvisState.thinking;
    });

    try {
      final response = await widget.client.chat(text);
      if (!mounted) return;
      setState(() {
        messages.add((user: false, text: response.content));
        state = JarvisState.idle;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        messages.add((user: false, text: 'Error: $e'));
        state = JarvisState.error;
      });
    }
  }

  @override
  void dispose() {
    eventSubscription?.cancel();
    input.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth > 900;
            if (wide) {
              return Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    _topBar(),
                    const SizedBox(height: 16),
                    Expanded(
                      child: Row(
                        children: [
                          SizedBox(width: 320, child: _statusPanel()),
                          const SizedBox(width: 16),
                          Expanded(child: _assistantPanel()),
                          const SizedBox(width: 16),
                          SizedBox(width: 330, child: _activityPanel()),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }

            return ListView(
              padding: const EdgeInsets.all(18),
              children: [
                _topBar(),
                const SizedBox(height: 16),
                SizedBox(height: 620, child: _assistantPanel()),
                const SizedBox(height: 16),
                SizedBox(height: 360, child: _statusPanel()),
                const SizedBox(height: 16),
                SizedBox(height: 400, child: _activityPanel()),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _topBar() {
    final online = health?['ok'] == true;
    return Row(
      children: [
        const Expanded(
          child: Text(
            'NEKOSUNE JARVIS',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              letterSpacing: 2.6,
              fontSize: 18,
            ),
          ),
        ),
        Icon(
          Icons.circle,
          size: 10,
          color: online ? const Color(0xFF57FF9A) : Colors.redAccent,
        ),
        const SizedBox(width: 8),
        Text(online ? 'CORE ONLINE' : 'CORE OFFLINE'),
        IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh)),
      ],
    );
  }

  Widget _assistantPanel() {
    return _panel(
      child: Column(
        children: [
          JarvisOrb(state: state),
          Text(
            state.name.toUpperCase(),
            style: const TextStyle(
              letterSpacing: 2,
              color: Color(0xFF57FF9A),
            ),
          ),
          const SizedBox(height: 12),
          if (error != null)
            Text(
              error!,
              style: const TextStyle(color: Colors.redAccent),
              textAlign: TextAlign.center,
            ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final message = messages[index];
                return Align(
                  alignment: message.user
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 600),
                    margin: const EdgeInsets.symmetric(vertical: 5),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: message.user
                          ? const Color(0xFF17442C)
                          : const Color(0xFF111A17),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF57FF9A).withValues(alpha: .18),
                      ),
                    ),
                    child: Text(message.text),
                  ),
                );
              },
            ),
          ),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: input,
                  onSubmitted: (_) => _send(),
                  decoration: const InputDecoration(
                    hintText: 'Ask Jarvis...',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _send,
                icon: const Icon(Icons.arrow_upward),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _reconnectIntegration(String id) async {
    try {
      await widget.client.reconnectIntegration(id);
      await _refresh();
    } catch (e) {
      if (mounted) setState(() => error = 'Reconnect failed: $e');
    }
  }

  Future<void> _forgetMemory(int id) async {
    try {
      await widget.client.forgetMemory(id);
      await _refresh();
    } catch (e) {
      if (mounted) setState(() => error = 'Forget memory failed: $e');
    }
  }

  Future<void> _confirmPermission(String capability) async {
    if (!mounted) return;
    final decision = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Jarvis permission request'),
        content: Text('Allow capability "$capability" for future tool calls?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, 'deny'),
            child: const Text('Deny'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, 'ask'),
            child: const Text('Keep asking'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, 'allow'),
            child: const Text('Allow'),
          ),
        ],
      ),
    );
    if (decision != null) {
      await _setPermission(capability, decision);
    }
  }

  Future<void> _setPermission(String capability, String decision) async {
    try {
      await widget.client.setPermission(capability, decision);
      await _refresh();
    } catch (e) {
      if (mounted) setState(() => error = 'Permission update failed: $e');
    }
  }

  Future<void> _markNotification(int id, bool read) async {
    try {
      await widget.client.markNotificationRead(id, read);
      await _refresh();
    } catch (e) {
      if (mounted) setState(() => error = 'Notification update failed: $e');
    }
  }

  Widget _statusPanel() {
    return _panel(
      title: 'INTEGRATIONS',
      child: ListView(
        children: [
          for (final item in integrations)
            ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              title: Text(item['name']?.toString() ?? item['id'].toString()),
              subtitle: Text(item['state']?.toString() ?? 'unknown'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.circle,
                    size: 10,
                    color: item['state'] == 'connected'
                        ? const Color(0xFF57FF9A)
                        : Colors.orangeAccent,
                  ),
                  IconButton(
                    tooltip: 'Reconnect',
                    onPressed: () => _reconnectIntegration(item['id'].toString()),
                    icon: const Icon(Icons.sync, size: 18),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _activityPanel() {
    Widget section(String title, List<dynamic> values) => Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(letterSpacing: 1.5)),
              const SizedBox(height: 6),
              if (values.isEmpty)
                const Text('None', style: TextStyle(color: Colors.white38)),
              for (final value in values.take(5))
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Text(
                    value['name']?.toString() ??
                        value['text']?.toString() ??
                        value.toString(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
          ),
        );

    Widget notificationSection() => Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('NOTIFICATIONS', style: TextStyle(letterSpacing: 1.5)),
              const SizedBox(height: 6),
              for (final value in notifications.take(5))
                ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(value['title']?.toString() ?? 'Notification'),
                  subtitle: Text(value['body']?.toString() ?? ''),
                  trailing: TextButton(
                    onPressed: () => _markNotification(
                      (value['id'] as num).toInt(),
                      value['is_read'] != 1,
                    ),
                    child: Text(value['is_read'] == 1 ? 'UNREAD' : 'READ'),
                  ),
                ),
            ],
          ),
        );

    Widget memorySection() => Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('MEMORY REVIEW', style: TextStyle(letterSpacing: 1.5)),
              const SizedBox(height: 6),
              for (final value in memories.take(5))
                ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(value['key']?.toString() ?? 'Memory'),
                  subtitle: Text(value['value']?.toString() ?? ''),
                  trailing: IconButton(
                    tooltip: 'Forget',
                    onPressed: () => _forgetMemory((value['id'] as num).toInt()),
                    icon: const Icon(Icons.delete_outline, size: 18),
                  ),
                ),
            ],
          ),
        );

    Widget permissionSection() => Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('TOOL PERMISSIONS', style: TextStyle(letterSpacing: 1.5)),
              const SizedBox(height: 6),
              for (final value in permissions.take(8))
                Row(
                  children: [
                    Expanded(child: Text(value['capability']?.toString() ?? '')),
                    DropdownButton<String>(
                      value: value['decision']?.toString() ?? 'ask',
                      items: const [
                        DropdownMenuItem(value: 'allow', child: Text('Allow')),
                        DropdownMenuItem(value: 'ask', child: Text('Ask')),
                        DropdownMenuItem(value: 'deny', child: Text('Deny')),
                      ],
                      onChanged: (decision) {
                        if (decision != null) {
                          _setPermission(value['capability'].toString(), decision);
                        }
                      },
                    ),
                  ],
                ),
            ],
          ),
        );

    return _panel(
      title: 'ASSISTANT',
      child: ListView(
        children: [
          section('TIMERS', timers),
          section('ALARMS', alarms),
          section('REMINDERS', reminders),
          section('DEVICES', devices),
          notificationSection(),
          memorySection(),
          permissionSection(),
        ],
      ),
    );
  }

  Widget _panel({String? title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xCC07100D),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFF57FF9A).withValues(alpha: .16),
        ),
        boxShadow: const [
          BoxShadow(color: Colors.black38, blurRadius: 24),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null) ...[
            Text(
              title,
              style: const TextStyle(
                letterSpacing: 2,
                fontWeight: FontWeight.bold,
                color: Color(0xFF57FF9A),
              ),
            ),
            const SizedBox(height: 12),
          ],
          Expanded(child: child),
        ],
      ),
    );
  }
}
