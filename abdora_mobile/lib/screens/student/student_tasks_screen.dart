import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/student_models.dart';
import '../../providers/student_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/status_badge.dart';
import 'test_runner_screen.dart';

class StudentTasksScreen extends StatefulWidget {
  const StudentTasksScreen({super.key});

  @override
  State<StudentTasksScreen> createState() => _StudentTasksScreenState();
}

class _StudentTasksScreenState extends State<StudentTasksScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    Future.microtask(() {
      final p = Provider.of<StudentProvider>(context, listen: false);
      p.fetchTests();
      p.fetchHomework();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showSubmitHomeworkDialog(HomeworkModel hw) {
    final textController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Vazifani topshirish',
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(hw.title, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 16),
            TextField(
              controller: textController,
              maxLines: 5,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Javobingizni yoki yechimlaringizni bu yerga yozing...',
                hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
              ),
            ),
            const SizedBox(height: 20),
            CustomButton(
              text: 'Yuborish',
              onPressed: () async {
                if (textController.text.trim().isEmpty) return;
                final p = Provider.of<StudentProvider>(context, listen: false);
                final ok = await p.submitHomework(hw.id, textController.text.trim());
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? 'Vazifa muvaffaqiyatli topshirildi!' : 'Yuborishda xatolik yuz berdi'),
                      backgroundColor: ok ? AppColors.success : AppColors.danger,
                    ),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Topshiriqlar Markazi'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: const [
            Tab(text: 'Imtihonlar & Testlar'),
            Tab(text: 'Uy Vazifalari'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildTestsTab(),
          _buildHomeworkTab(),
        ],
      ),
    );
  }

  Widget _buildTestsTab() {
    final p = Provider.of<StudentProvider>(context);

    if (p.isLoadingTests) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (p.tests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.assignment_turned_in_outlined, color: AppColors.textMuted, size: 48),
            SizedBox(height: 12),
            Text('Hozircha faol testlar mavjud emas', style: TextStyle(color: AppColors.textMuted)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => p.fetchTests(),
      color: AppColors.primary,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: p.tests.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final test = p.tests[index];

          return GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    StatusBadge(
                      text: test.isCompleted ? 'Topshirilgan' : 'Faol Test',
                      color: test.isCompleted ? AppColors.success : AppColors.primary,
                    ),
                    Text(
                      '${test.timeLimit} daqiqa',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  test.title,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  '${test.questionCount} ta savol • O\'tish bali: ${test.passingScore}%',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 14),
                if (test.isCompleted)
                  Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Natija: ${test.lastScore ?? 100}%',
                        style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  )
                else
                  CustomButton(
                    text: 'Testni boshlash',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => TestRunnerScreen(test: test)),
                      );
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHomeworkTab() {
    final p = Provider.of<StudentProvider>(context);

    if (p.isLoadingHomework) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (p.homeworkList.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.menu_book_outlined, color: AppColors.textMuted, size: 48),
            SizedBox(height: 12),
            Text('Uy vazifalari mavjud emas', style: TextStyle(color: AppColors.textMuted)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => p.fetchHomework(),
      color: AppColors.primary,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: p.homeworkList.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final hw = p.homeworkList[index];

          return GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    StatusBadge(
                      text: hw.isSubmitted ? 'Topshirilgan' : 'Kutilmoqda',
                      color: hw.isSubmitted ? AppColors.success : AppColors.warning,
                    ),
                    Text(
                      hw.dueDate != null ? 'Muddati: ${hw.dueDate!.day}.${hw.dueDate!.month}' : '',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  hw.title,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  hw.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 14),
                if (hw.isSubmitted)
                  Row(
                    children: [
                      const Icon(Icons.verified_rounded, color: AppColors.primary, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        hw.finalScore != null ? 'Baholandi: ${hw.finalScore} / ${hw.maxScore}' : 'Tekshirilmoqda',
                        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  )
                else
                  CustomButton(
                    text: 'Vazifani topshirish',
                    isOutlined: true,
                    onPressed: () => _showSubmitHomeworkDialog(hw),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
