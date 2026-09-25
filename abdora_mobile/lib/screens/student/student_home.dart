import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/glass_card.dart';
import 'lesson_detail_screen.dart';

class StudentHomeScreen extends StatefulWidget {
  const StudentHomeScreen({super.key});

  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<StudentProvider>(context, listen: false).fetchLessons();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final student = Provider.of<StudentProvider>(context);
    final isTablet = context.isTablet;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Abdora Student'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.coinGold.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.coinGold.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.monetization_on_rounded, color: AppColors.coinGold, size: 16),
                const SizedBox(width: 4),
                Text(
                  '${user?.coins ?? 0}',
                  style: const TextStyle(color: AppColors.coinGold, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => student.fetchLessons(),
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.symmetric(
            horizontal: isTablet ? 36 : 16,
            vertical: 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Xush kelibsiz banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0D9488), Color(0xFF0F766E)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'Salom, ${user?.name ?? 'O\'quvchi'}!',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: const [
                              Icon(Icons.local_fire_department_rounded, color: Color(0xFFF97316), size: 16),
                              SizedBox(width: 4),
                              Text('3 kunlik seriya', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Bugun rejangizdagi yangi darslarni o\'zlashtiring va tangalar yutib oling!',
                      style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13),
                    ),
                    const SizedBox(height: 16),
                    // XP progress bar
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Daraja ${user?.level ?? 1}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                            Text('${user?.xp ?? 0} / 500 XP', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: ((user?.xp ?? 50) % 500) / 500,
                            backgroundColor: Colors.black.withOpacity(0.2),
                            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.coinGold),
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Tezkor statistika kartalari
              Row(
                children: [
                  Expanded(
                    child: GlassCard(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Icon(Icons.pie_chart_outline_rounded, color: AppColors.primary, size: 20),
                          SizedBox(height: 8),
                          Text('88%', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                          SizedBox(height: 2),
                          Text('O\'rtacha ball', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: GlassCard(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Icon(Icons.how_to_reg_outlined, color: AppColors.success, size: 20),
                          SizedBox(height: 8),
                          Text('95%', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                          SizedBox(height: 2),
                          Text('Davomat', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: GlassCard(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Icon(Icons.task_alt_rounded, color: AppColors.accentPurple, size: 20),
                          SizedBox(height: 8),
                          Text('12 ta', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                          SizedBox(height: 2),
                          Text('Vazifalar', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // AI Tavsiyalari bloki
              GlassCard(
                color: AppColors.surface,
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.psychology_alt_outlined, color: AppColors.primary, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'AI O\'rganish Tavsiyasi',
                            style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          SizedBox(height: 2),
                          Text(
                            '"Hujayra nafas olishi" mavzusidagi test natijalaringizni yaxshilash uchun flashcardlarni qaytaring.',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.3),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // So'nggi darslar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text(
                    'Mening Darslarim',
                    style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              if (student.isLoadingLessons)
                const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: AppColors.primary)))
              else if (student.lessons.isEmpty)
                const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('Darslar topilmadi', style: TextStyle(color: AppColors.textMuted))))
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: student.lessons.length > 5 ? 5 : student.lessons.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final lesson = student.lessons[index];

                    return GlassCard(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => LessonDetailScreen(lesson: lesson)),
                        );
                      },
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.play_circle_outline_rounded, color: AppColors.primary, size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  lesson.title,
                                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text('AI Tayyor', style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Dars #${index + 1}',
                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
