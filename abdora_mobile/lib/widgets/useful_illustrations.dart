import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

/// Skrinshotdagi kabi 3D uslubdagi chiroyli vektorli ta'limiy illyustratsiyalar.
/// Har qanday o'lchamda xatosiz, sifatli va tez render bo'ladi.

class ClassroomIllustration extends StatelessWidget {
  final double size;
  const ClassroomIllustration({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Doska (Blackboard)
          Positioned(
            top: size * 0.08,
            right: size * 0.05,
            child: Container(
              width: size * 0.58,
              height: size * 0.42,
              decoration: BoxDecoration(
                color: const Color(0xFF1B4332), // Yashil doska
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFFD4A373), width: 2), // Yog'och ramka
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 4,
                    offset: const Offset(1, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: const Text(
                      'A B',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    '1+2=',
                    style: TextStyle(
                      color: Color(0xFFE2E8F0),
                      fontSize: 7,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Doska tagligi (Chalk tray)
          Positioned(
            top: size * 0.49,
            right: size * 0.08,
            child: Container(
              width: size * 0.52,
              height: 2,
              color: const Color(0xFFBC6C25),
            ),
          ),
          // O'qituvchi stoli (Teacher's desk - 3D isometric look)
          Positioned(
            bottom: size * 0.16,
            left: size * 0.06,
            child: Container(
              width: size * 0.38,
              height: size * 0.28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE0A96D), Color(0xFF99582A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(3),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 5,
                    offset: const Offset(2, 3),
                  ),
                ],
              ),
              child: Align(
                alignment: Alignment.topRight,
                child: Container(
                  margin: const EdgeInsets.all(2),
                  width: 10,
                  height: 6,
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6),
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ),
            ),
          ),
          // Parta va stullar (Student desks & chairs)
          Positioned(
            bottom: size * 0.04,
            right: size * 0.06,
            child: Row(
              children: [
                _buildDeskMini(size),
                const SizedBox(width: 4),
                _buildDeskMini(size),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeskMini(double s) {
    return Container(
      width: s * 0.22,
      height: s * 0.22,
      decoration: BoxDecoration(
        color: const Color(0xFFD4A373),
        borderRadius: BorderRadius.circular(2),
        border: Border.all(color: const Color(0xFF99582A), width: 1),
      ),
      child: Column(
        children: [
          Container(
            height: 3,
            color: const Color(0xFFBC6C25),
          ),
          const Spacer(),
          Container(
            width: s * 0.14,
            height: 3,
            color: const Color(0xFF4A4E69),
          ),
        ],
      ),
    );
  }
}

class ExamIllustration extends StatelessWidget {
  final double size;
  const ExamIllustration({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Orqa kitoblar to'plami (Stacked books)
          Positioned(
            bottom: size * 0.08,
            right: size * 0.06,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  width: size * 0.36,
                  height: 7,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 1),
                Container(
                  width: size * 0.42,
                  height: 8,
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 1),
                Container(
                  width: size * 0.46,
                  height: 9,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD97706),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ],
            ),
          ),
          // Planshet / Qog'oz (Clipboard & paper)
          Positioned(
            left: size * 0.08,
            top: size * 0.06,
            child: Container(
              width: size * 0.54,
              height: size * 0.72,
              decoration: BoxDecoration(
                color: const Color(0xFFD4A373),
                borderRadius: BorderRadius.circular(6),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.4),
                    blurRadius: 6,
                    offset: const Offset(2, 3),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Qisqich (Metal Clip)
                  Align(
                    alignment: Alignment.topCenter,
                    child: Container(
                      width: size * 0.22,
                      height: 7,
                      decoration: BoxDecoration(
                        color: const Color(0xFF94A3B8),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  // Oq qog'oz varag'i (White Exam Paper)
                  Positioned.fill(
                    top: 9,
                    left: 4,
                    right: 4,
                    bottom: 4,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(3),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Lampochka / Fikr belgisi
                          Center(
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(
                                color: Color(0xFFFEF08A),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.lightbulb_rounded, size: 10, color: Color(0xFFCA8A04)),
                            ),
                          ),
                          const SizedBox(height: 4),
                          // Savol chiziqlari
                          _buildExamLine(0.75, true),
                          const SizedBox(height: 3),
                          _buildExamLine(0.6, false),
                          const SizedBox(height: 3),
                          _buildExamLine(0.8, true),
                          const SizedBox(height: 3),
                          _buildExamLine(0.5, false),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Kattalashtiruvchi oyna (Magnifying Glass)
          Positioned(
            bottom: size * 0.08,
            left: size * 0.32,
            child: Container(
              width: size * 0.34,
              height: size * 0.34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF94A3B8), width: 3),
                color: const Color(0xFF38BDF8).withOpacity(0.35),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 4,
                    offset: const Offset(1, 2),
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: size * 0.12,
                  height: size * 0.12,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),
          // Magnifying glass dastasi (Handle)
          Positioned(
            bottom: size * 0.02,
            left: size * 0.58,
            child: Transform.rotate(
              angle: 0.78,
              child: Container(
                width: 5,
                height: size * 0.22,
                decoration: BoxDecoration(
                  color: const Color(0xFF475569),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExamLine(double widthFactor, bool checked) {
    return Row(
      children: [
        Container(
          width: 5,
          height: 5,
          decoration: BoxDecoration(
            color: checked ? const Color(0xFF10B981) : const Color(0xFFCBD5E1),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 3),
        Expanded(
          flex: (widthFactor * 10).toInt(),
          child: Container(
            height: 2.5,
            color: const Color(0xFFE2E8F0),
          ),
        ),
      ],
    );
  }
}

class LibraryIllustration extends StatelessWidget {
  final double size;
  const LibraryIllustration({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Yashil maydoncha (Green Lawn)
          Positioned(
            bottom: size * 0.06,
            child: Container(
              width: size * 0.88,
              height: 10,
              decoration: BoxDecoration(
                color: const Color(0xFF15803D),
                borderRadius: BorderRadius.circular(5),
              ),
            ),
          ),
          // Kutubxona binosi (Classical Library Building)
          Positioned(
            bottom: size * 0.12,
            child: Container(
              width: size * 0.74,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9), // Oq marmar
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 6,
                    offset: const Offset(1, 3),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Uchburchak fronton (Pediment Roof)
                  ClipPath(
                    clipper: _TriangleClipper(),
                    child: Container(
                      height: size * 0.22,
                      width: size * 0.74,
                      color: const Color(0xFFCBD5E1),
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                            decoration: BoxDecoration(
                              color: const Color(0xFF334155),
                              borderRadius: BorderRadius.circular(2),
                            ),
                            child: const Text(
                              'LIBRARY',
                              style: TextStyle(
                                color: Color(0xFFF8FAFC),
                                fontSize: 6,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Container(height: 2, color: const Color(0xFF94A3B8)),
                  // Ustunlar (Classical Columns)
                  Container(
                    height: size * 0.32,
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    color: const Color(0xFFE2E8F0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildColumn(),
                        _buildColumn(),
                        // Kirish eshigi (Entrance Archway)
                        Container(
                          width: size * 0.18,
                          height: size * 0.26,
                          decoration: const BoxDecoration(
                            color: Color(0xFF1E293B),
                            borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
                          ),
                        ),
                        _buildColumn(),
                        _buildColumn(),
                      ],
                    ),
                  ),
                  // Zinalar (Steps)
                  Container(height: 3, color: const Color(0xFFCBD5E1)),
                  Container(height: 3, color: const Color(0xFF94A3B8)),
                ],
              ),
            ),
          ),
          // Yonboshdagi daraxtlar (Bushes / Trees)
          Positioned(
            bottom: size * 0.12,
            left: size * 0.03,
            child: Container(
              width: 12,
              height: 14,
              decoration: const BoxDecoration(
                color: Color(0xFF22C55E),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: size * 0.12,
            right: size * 0.03,
            child: Container(
              width: 12,
              height: 14,
              decoration: const BoxDecoration(
                color: Color(0xFF22C55E),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildColumn() {
    return Container(
      width: 5,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(1),
        border: Border.all(color: const Color(0xFFCBD5E1), width: 0.5),
      ),
    );
  }
}

class _TriangleClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    path.moveTo(0, size.height);
    path.lineTo(size.width / 2, 0);
    path.lineTo(size.width, size.height);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

class VocabularyIllustration extends StatelessWidget {
  final double size;
  const VocabularyIllustration({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Lug'at kitobi (Open Vocabulary Book)
          Positioned(
            top: size * 0.08,
            child: Container(
              width: size * 0.72,
              height: size * 0.56,
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB), // Sariq / krem rangli varaqlar
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 5,
                    offset: const Offset(2, 3),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Markaziy chiziq (Book spine)
                  Center(
                    child: Container(width: 1.5, color: const Color(0xFFFCD34D)),
                  ),
                  // Chap bet (Left page)
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'A',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        Container(width: 14, height: 2, color: const Color(0xFFCBD5E1)),
                        const SizedBox(height: 2),
                        Container(width: 18, height: 2, color: const Color(0xFFE2E8F0)),
                      ],
                    ),
                  ),
                  // O'ng bet (Right page with VOCABULARY banner)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: const Text(
                        'VOCABULARY',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 5,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Yog'och kubiklar (Letter blocks A & B)
          Positioned(
            bottom: size * 0.08,
            left: size * 0.1,
            child: _buildLetterBlock('A', const Color(0xFFFDE68A), const Color(0xFFD97706)),
          ),
          // Qalam (Sharp Pencil)
          Positioned(
            bottom: size * 0.12,
            right: size * 0.1,
            child: Transform.rotate(
              angle: -0.6,
              child: Container(
                width: size * 0.44,
                height: 7,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEF4444), Color(0xFFF59E0B), Color(0xFFE2E8F0)],
                    stops: [0.6, 0.85, 1.0],
                  ),
                  borderRadius: BorderRadius.circular(2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 3,
                      offset: const Offset(1, 2),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLetterBlock(String letter, Color bg, Color textColor) {
    return Container(
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(3),
        border: Border.all(color: textColor.withOpacity(0.6), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 2,
            offset: const Offset(1, 1),
          ),
        ],
      ),
      child: Center(
        child: Text(
          letter,
          style: TextStyle(
            color: textColor,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

class AdditionalLessonIllustration extends StatelessWidget {
  final double size;
  const AdditionalLessonIllustration({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Planshet va topshiriqlar qog'ozi (Study schedule clipboard)
          Positioned(
            left: size * 0.12,
            top: size * 0.08,
            child: Container(
              width: size * 0.52,
              height: size * 0.7,
              decoration: BoxDecoration(
                color: const Color(0xFFD4A373),
                borderRadius: BorderRadius.circular(6),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 6,
                    offset: const Offset(2, 3),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Metall qisqich
                  Align(
                    alignment: Alignment.topCenter,
                    child: Container(
                      width: 18,
                      height: 6,
                      decoration: BoxDecoration(
                        color: const Color(0xFF94A3B8),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    top: 8,
                    left: 4,
                    right: 4,
                    bottom: 4,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      padding: const EdgeInsets.all(4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Center(
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(
                                color: Color(0xFFFEF3C7),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.psychology_rounded, size: 11, color: Color(0xFFD97706)),
                            ),
                          ),
                          const SizedBox(height: 4),
                          _buildCheckItem(true),
                          const SizedBox(height: 3),
                          _buildCheckItem(true),
                          const SizedBox(height: 3),
                          _buildCheckItem(false),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Orqa tomondagi kitoblar
          Positioned(
            bottom: size * 0.1,
            right: size * 0.08,
            child: Column(
              children: [
                Container(
                  width: size * 0.32,
                  height: 8,
                  decoration: BoxDecoration(
                    color: const Color(0xFF6366F1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 1.5),
                Container(
                  width: size * 0.36,
                  height: 9,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0EA5E9),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckItem(bool checked) {
    return Row(
      children: [
        Icon(
          checked ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
          size: 8,
          color: checked ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
        ),
        const SizedBox(width: 3),
        Expanded(
          child: Container(
            height: 2,
            color: const Color(0xFFE2E8F0),
          ),
        ),
      ],
    );
  }
}

class ReferralIllustration extends StatelessWidget {
  final double size;
  const ReferralIllustration({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Do'stlar o'rtasidagi yulduz / oltin mukofot (Golden Reward Star)
          Positioned(
            top: size * 0.08,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.2),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF59E0B).withOpacity(0.4),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: const Icon(
                Icons.star_rounded,
                color: Color(0xFFFBBF24),
                size: 20,
              ),
            ),
          ),
          // Chapdagi talaba (Left Student Avatar)
          Positioned(
            bottom: size * 0.06,
            left: size * 0.12,
            child: _buildStudentSilhouette(
              headColor: const Color(0xFFFBBF24),
              bodyColor: const Color(0xFF3B82F6),
              isLeft: true,
            ),
          ),
          // O'ngdagi talaba (Right Student Avatar)
          Positioned(
            bottom: size * 0.06,
            right: size * 0.12,
            child: _buildStudentSilhouette(
              headColor: const Color(0xFFD97706),
              bodyColor: const Color(0xFFF97316),
              isLeft: false,
            ),
          ),
          // Qo'l berish / High-five aloqa chizig'i
          Positioned(
            bottom: size * 0.28,
            child: Container(
              width: 14,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFFEF08A),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentSilhouette({
    required Color headColor,
    required Color bodyColor,
    required bool isLeft,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Bosh (Head)
        Container(
          width: 18,
          height: 18,
          decoration: BoxDecoration(
            color: headColor,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.25),
                blurRadius: 3,
                offset: const Offset(1, 2),
              ),
            ],
          ),
        ),
        const SizedBox(height: 2),
        // Tana / Futbolka (Body)
        Container(
          width: 24,
          height: 22,
          decoration: BoxDecoration(
            color: bodyColor,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(8),
              topRight: const Radius.circular(8),
              bottomLeft: Radius.circular(isLeft ? 4 : 8),
              bottomRight: Radius.circular(isLeft ? 8 : 4),
            ),
          ),
        ),
      ],
    );
  }
}

/// Mahsulotlar uchun 3D uslubdagi vektor grafikalar:
class EarphonesIllustration extends StatelessWidget {
  final double size;
  const EarphonesIllustration({super.key, this.size = 56});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Headband Arc
          Positioned(
            top: size * 0.1,
            child: Container(
              width: size * 0.72,
              height: size * 0.44,
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: const Color(0xFF94A3B8), width: size * 0.09),
                  left: BorderSide(color: const Color(0xFF64748B), width: size * 0.08),
                  right: BorderSide(color: const Color(0xFF64748B), width: size * 0.08),
                ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(size * 0.36)),
              ),
            ),
          ),
          // Chap quloqchin (Left Earcup)
          Positioned(
            left: size * 0.1,
            bottom: size * 0.14,
            child: Container(
              width: size * 0.24,
              height: size * 0.42,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFE2E8F0), Color(0xFF64748B)],
                ),
                borderRadius: BorderRadius.circular(size * 0.12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 4,
                    offset: const Offset(1, 2),
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: size * 0.14,
                  height: size * 0.28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF334155),
                    borderRadius: BorderRadius.circular(size * 0.07),
                  ),
                ),
              ),
            ),
          ),
          // O'ng quloqchin (Right Earcup)
          Positioned(
            right: size * 0.1,
            bottom: size * 0.14,
            child: Container(
              width: size * 0.24,
              height: size * 0.42,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFE2E8F0), Color(0xFF64748B)],
                ),
                borderRadius: BorderRadius.circular(size * 0.12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 4,
                    offset: const Offset(1, 2),
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: size * 0.14,
                  height: size * 0.28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF334155),
                    borderRadius: BorderRadius.circular(size * 0.07),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BookProductIllustration extends StatelessWidget {
  final double size;
  const BookProductIllustration({super.key, this.size = 56});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Kitobning orqa sahifalari
          Positioned(
            bottom: size * 0.12,
            right: size * 0.15,
            child: Container(
              width: size * 0.52,
              height: size * 0.68,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          // Kitob qobig'i (Book Front Cover)
          Positioned(
            bottom: size * 0.14,
            left: size * 0.18,
            child: Container(
              width: size * 0.54,
              height: size * 0.68,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF0D9488), Color(0xFF115E59)],
                ),
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 5,
                    offset: const Offset(2, 3),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 14,
                    height: 2,
                    color: const Color(0xFFFBBF24),
                  ),
                  const Spacer(),
                  Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.auto_stories, color: Colors.white, size: 10),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    width: 22,
                    height: 2.5,
                    color: Colors.white,
                  ),
                ],
              ),
            ),
          ),
          // Xatcho'p (Bookmark Ribbon)
          Positioned(
            top: size * 0.12,
            right: size * 0.28,
            child: Container(
              width: 5,
              height: 14,
              decoration: const BoxDecoration(
                color: Color(0xFFEF4444),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(2)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class HoodieProductIllustration extends StatelessWidget {
  final double size;
  const HoodieProductIllustration({super.key, this.size = 56});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Kapushon (Hood)
          Positioned(
            top: size * 0.08,
            child: Container(
              width: size * 0.38,
              height: size * 0.32,
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.vertical(top: Radius.circular(size * 0.19)),
                border: Border.all(color: const Color(0xFF334155), width: 1.5),
              ),
            ),
          ),
          // Tana (Body)
          Positioned(
            bottom: size * 0.12,
            child: Container(
              width: size * 0.62,
              height: size * 0.56,
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF334155), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 4,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Abdora AI logotipi ko'krakda
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.primary, width: 1),
                    ),
                    child: const Text(
                      'ABDORA',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 6.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Cho'ntak (Pocket)
                  Container(
                    width: size * 0.34,
                    height: size * 0.16,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class GadgetProductIllustration extends StatelessWidget {
  final double size;
  const GadgetProductIllustration({super.key, this.size = 56});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Powerbank korpusi
          Container(
            width: size * 0.52,
            height: size * 0.72,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF334155), Color(0xFF1E293B)],
              ),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF475569), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 4,
                  offset: const Offset(1, 3),
                ),
              ],
            ),
            padding: const EdgeInsets.all(5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Portlar (USB ports)
                Container(
                  width: 14,
                  height: 3,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
                const Spacer(),
                // LED indikatorlar
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    4,
                    (i) => Container(
                      margin: const EdgeInsets.symmetric(horizontal: 1.5),
                      width: 3.5,
                      height: 3.5,
                      decoration: BoxDecoration(
                        color: i < 3 ? const Color(0xFF10B981) : const Color(0xFF64748B),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  '20000',
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 7,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Reyting va Peshqadamlar illustratsiyasi
class LeaderboardIllustration extends StatelessWidget {
  final double size;
  const LeaderboardIllustration({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Nur / Doira orqa fon
          Container(
            width: size * 0.88,
            height: size * 0.88,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFF59E0B).withOpacity(0.12),
            ),
          ),
          // 2-o'rin (Chap podium)
          Positioned(
            left: size * 0.08,
            bottom: size * 0.12,
            child: Container(
              width: size * 0.25,
              height: size * 0.36,
              decoration: BoxDecoration(
                color: const Color(0xFF94A3B8),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                border: Border.all(color: const Color(0xFF64748B), width: 1),
              ),
              child: const Center(
                child: Text(
                  '2',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ),
          ),
          // 1-o'rin (O'rta baland podium)
          Positioned(
            left: size * 0.36,
            bottom: size * 0.12,
            child: Container(
              width: size * 0.28,
              height: size * 0.52,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                boxShadow: [
                  BoxShadow(color: const Color(0xFFF59E0B).withOpacity(0.3), blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: const Center(
                child: Text(
                  '1',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ),
            ),
          ),
          // 3-o'rin (O'ng podium)
          Positioned(
            right: size * 0.08,
            bottom: size * 0.12,
            child: Container(
              width: size * 0.25,
              height: size * 0.28,
              decoration: BoxDecoration(
                color: const Color(0xFFB45309),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                border: Border.all(color: const Color(0xFF92400E), width: 1),
              ),
              child: const Center(
                child: Text(
                  '3',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ),
          ),
          // Toj / Mukofot belgisi
          Positioned(
            top: size * 0.06,
            child: const Icon(
              Icons.workspace_premium_rounded,
              color: Color(0xFFF59E0B),
              size: 24,
            ),
          ),
        ],
      ),
    );
  }
}

