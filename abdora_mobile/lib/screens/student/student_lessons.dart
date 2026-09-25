import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/student_provider.dart';
import '../../widgets/glass_card.dart';
import 'lesson_detail_screen.dart';

class StudentLessonsScreen extends StatelessWidget {
  const StudentLessonsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final student = Provider.of<StudentProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mening Darslarim'),
      ),
      body: RefreshIndicator(
        onRefresh: () => student.fetchLessons(),
        color: AppColors.primary,
        child: student.isLoadingLessons
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : student.lessons.isEmpty
                ? const Center(child: Text('Darslar topilmadi', style: TextStyle(color: AppColors.textMuted)))
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: student.lessons.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final lesson = student.lessons[index];

                      return GlassCard(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => LessonDetailScreen(lesson: lesson)),
                          );
                        },
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'Dars #${index + 1}',
                                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    '10 ta AI Modul',
                                    style: TextStyle(color: AppColors.primaryLight, fontSize: 11),
                                  ),
                                ),
                                const Spacer(),
                                const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textMuted, size: 14),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              lesson.title,
                              style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              lesson.content != null && lesson.content!.isNotEmpty
                                  ? lesson.content!
                                  : 'Biologiya chuqurlashtirilgan o\'quv kursi darsi',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
