import 'package:flutter_test/flutter_test.dart';
import 'package:nekosune_jarvis_ui/api/jarvis_client.dart';

void main() {
  test('JarvisClient keeps configured endpoint and token', () {
    final client = JarvisClient(
      baseUrl: 'http://127.0.0.1:3000',
      apiToken: 'test-token',
    );

    expect(client.baseUrl, 'http://127.0.0.1:3000');
    expect(client.apiToken, 'test-token');
  });
}
