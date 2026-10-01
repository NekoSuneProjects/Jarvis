import 'package:flutter/material.dart';

import 'api/jarvis_client.dart';
import 'screens/setup_wizard.dart';

void main() {
  runApp(const JarvisApp());
}

class JarvisApp extends StatelessWidget {
  const JarvisApp({super.key});

  @override
  Widget build(BuildContext context) {
    const baseUrl = String.fromEnvironment(
      'JARVIS_BASE_URL',
      defaultValue: 'http://127.0.0.1:3000',
    );
    const apiToken = String.fromEnvironment(
      'JARVIS_API_TOKEN',
      defaultValue: '',
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'NekoSune Jarvis',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF020705),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF57FF9A),
          brightness: Brightness.dark,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF0B1511),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      home: SetupGate(
        client: JarvisClient(
          baseUrl: baseUrl,
          apiToken: apiToken,
        ),
      ),
    );
  }
}
