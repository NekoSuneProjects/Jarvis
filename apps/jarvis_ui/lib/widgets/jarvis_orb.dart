import 'dart:math' as math;

import 'package:flutter/material.dart';

enum JarvisState { idle, listening, thinking, speaking, error }

class JarvisOrb extends StatefulWidget {
  const JarvisOrb({
    super.key,
    required this.state,
    this.size = 210,
  });

  final JarvisState state;
  final double size;

  @override
  State<JarvisOrb> createState() => _JarvisOrbState();
}

class _JarvisOrbState extends State<JarvisOrb>
    with SingleTickerProviderStateMixin {
  late final AnimationController controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 7),
  )..repeat();

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Color get accent {
    switch (widget.state) {
      case JarvisState.error:
        return Colors.redAccent;
      case JarvisState.listening:
        return Colors.lightGreenAccent;
      case JarvisState.thinking:
        return Colors.cyanAccent;
      case JarvisState.speaking:
        return Colors.purpleAccent;
      case JarvisState.idle:
        return const Color(0xFF57FF9A);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final rotation = controller.value * math.pi * 2;
        return SizedBox.square(
          dimension: widget.size,
          child: CustomPaint(
            painter: _OrbPainter(
              accent: accent,
              rotation: rotation,
              pulse: 0.5 + math.sin(rotation * 2) * 0.15,
            ),
            child: Center(
              child: Container(
                width: widget.size * 0.34,
                height: widget.size * 0.34,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: accent.withValues(alpha: .16),
                  border: Border.all(color: accent.withValues(alpha: .9)),
                  boxShadow: [
                    BoxShadow(
                      color: accent.withValues(alpha: .35),
                      blurRadius: 35,
                      spreadRadius: 8,
                    ),
                  ],
                ),
                child: Icon(
                  Icons.auto_awesome,
                  color: accent,
                  size: widget.size * .15,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _OrbPainter extends CustomPainter {
  _OrbPainter({
    required this.accent,
    required this.rotation,
    required this.pulse,
  });

  final Color accent;
  final double rotation;
  final double pulse;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.shortestSide / 2;

    for (var i = 0; i < 3; i++) {
      final rect = Rect.fromCircle(
        center: center,
        radius: radius * (.55 + i * .13),
      );
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2 + i
        ..color = accent.withValues(alpha: .18 + pulse * .18);

      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.rotate(rotation * (i.isEven ? 1 : -1) * (.4 + i * .2));
      canvas.translate(-center.dx, -center.dy);
      canvas.drawArc(
        rect,
        i * .8,
        math.pi * (1.1 + i * .2),
        false,
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _OrbPainter oldDelegate) =>
      oldDelegate.rotation != rotation ||
      oldDelegate.accent != accent ||
      oldDelegate.pulse != pulse;
}
