import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/glass_card.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({super.key});

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  final List<Map<String, dynamic>> _mockStudents = [
    {'name': 'Aliyev Valijon', 'present': true},
    {'name': 'Karimova Shahzoda', 'present': true},
    {'name': 'Omonboyev Jasur', 'present': false},
    {'name': 'Rustamov Sardor', 'present': true},
    {'name': 'Saidova Madina', 'present': true},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Davomat Belgilash'),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.surface,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Bugun, 25-Sentyabr',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Text(
                  '${_mockStudents.where((s) => s['present']).length} / ${_mockStudents.length} qatnashmoqda',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _mockStudents.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final student = _mockStudents[index];
                final isPresent = student['present'] as bool;

                return GlassCard(
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: AppColors.surface,
                        child: Text(
                          student['name'][0],
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          student['name'],
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                      ),
                      Switch(
                        value: isPresent,
                        activeColor: AppColors.primary,
                        onChanged: (val) {
                          setState(() {
                            student['present'] = val;
                          });
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
