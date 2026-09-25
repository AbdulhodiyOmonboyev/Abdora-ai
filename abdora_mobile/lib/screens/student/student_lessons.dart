import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/lesson_provider.dart';
import '../../widgets/glass_card.dart';

class StudentLessonsScreen extends StatelessWidget {
  const StudentLessonsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lessonProvider = Provider.of<LessonProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Barcha Darslar'),
      ),
      body: RefreshIndicator(
        onRefresh: () => lessonProvider.fetchLessons(),
        color: AppColors.primary,
        child: lessonProvider.isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : lessonProvider.lessons.isEmpty
                ? const Center(
                    child: Text(
                      'Darslar mavjud emas',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: lessonProvider.lessons.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final lesson = lessonProvider.lessons[index];
                      return GlassCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'Dars #${index + 1}',
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const Spacer(),
                                if (lesson.videoUrl != null)
                                  const Icon(Icons.video_library_rounded, color: AppColors.accentBlue, size: 18),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              lesson.title,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (lesson.content != null && lesson.content!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                lesson.content!,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
