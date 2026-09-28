import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/student_models.dart';
import '../../providers/student_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/status_badge.dart';
import 'test_runner_screen.dart';

class StudentExamsScreen extends StatefulWidget {
  const StudentExamsScreen({super.key});

  @override
  State<StudentExamsScreen> createState() => _StudentExamsScreenState();
}

class _StudentExamsScreenState extends State<StudentExamsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  int _selectedFilterIndex = 0; // 0: Barchasi, 1: Faol imtihonlar, 2: Topshirilgan

  final List<String> _filters = ['Barchasi', 'Faol imtihonlar', 'Topshirilgan'];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final p = Provider.of<StudentProvider>(context, listen: false);
      p.fetchTests();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final student = Provider.of<StudentProvider>(context);

    // Filtrlash
    final List<TestModel> filteredList = student.tests.where((test) {
      if (_selectedFilterIndex == 1 && test.isCompleted) return false;
      if (_selectedFilterIndex == 2 && !test.isCompleted) return false;

      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final title = test.title.toLowerCase();
        return title.contains(query);
      }
      return true;
    }).toList();

    final int totalCount = student.tests.length;
    final int completedCount = student.tests.where((t) => t.isCompleted).length;
    final int activeCount = totalCount - completedCount;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Imtihonlar va Testlar'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () => student.fetchTests(),
            tooltip: 'Yangilash',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => student.fetchTests(),
        color: AppColors.primary,
        backgroundColor: AppColors.card,
        child: Column(
          children: [
            // Statistik ko'rsatkichlar paneli
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: _buildMiniStat(
                      label: 'Jami testlar',
                      value: '$totalCount',
                      color: AppColors.primary,
                      icon: Icons.quiz_outlined,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildMiniStat(
                      label: 'Faol',
                      value: '$activeCount',
                      color: AppColors.warning,
                      icon: Icons.pending_actions_rounded,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildMiniStat(
                      label: 'Tugatilgan',
                      value: '$completedCount',
                      color: AppColors.success,
                      icon: Icons.verified_outlined,
                    ),
                  ),
                ],
              ),
            ),

            // Qidiruv maydoni
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val.trim()),
                  style: const TextStyle(color: Colors.white, fontSize: 13.5),
                  decoration: InputDecoration(
                    icon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 18),
                    hintText: 'Imtihon yoki test nomini qidirish...',
                    hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                    border: InputBorder.none,
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, color: AppColors.textMuted, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                  ),
                ),
              ),
            ),

            // Filtrlash tugmalari
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Row(
                children: List.generate(_filters.length, (i) {
                  final isSelected = _selectedFilterIndex == i;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        _filters[i],
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textSecondary,
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: AppColors.primary,
                      backgroundColor: AppColors.card,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(
                          color: isSelected ? AppColors.primary : AppColors.border,
                        ),
                      ),
                      onSelected: (_) => setState(() => _selectedFilterIndex = i),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 6),

            // Imtihonlar ro'yxati
            Expanded(
              child: student.isLoadingTests && student.tests.isEmpty
                  ? Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : filteredList.isEmpty
                      ? Center(
                          child: SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(24),
                            child: Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 56,
                                    height: 56,
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withOpacity(0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.assignment_turned_in_outlined,
                                      color: AppColors.primary,
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'Imtihonlar topilmadi',
                                    style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Hozircha topshirilishi kerak bo\'lgan yangi imtihonlar yoki testlar mavjud emas.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12.5,
                                      height: 1.4,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () => student.fetchTests(),
                                    icon: const Icon(Icons.refresh_rounded, size: 16, color: Colors.white),
                                    label: const Text(
                                      'Qayta yuklash',
                                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredList.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final test = filteredList[index];

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
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: AppColors.surface,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.timer_outlined, color: AppColors.textMuted, size: 13),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${test.timeLimit} daqiqa',
                                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    test.title,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 15.5,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${test.questionCount} ta savol • O\'tish bali: ${test.passingScore}%',
                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12.5),
                                  ),
                                  const SizedBox(height: 14),
                                  if (test.isCompleted)
                                    Row(
                                      children: [
                                        const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Natija: ${test.lastScore ?? 100}% ball',
                                          style: const TextStyle(
                                            color: AppColors.success,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                        const Spacer(),
                                        TextButton(
                                          onPressed: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(builder: (_) => TestRunnerScreen(test: test)),
                                            );
                                          },
                                          child: Text(
                                            'Qayta topshirish',
                                            style: TextStyle(
                                              color: AppColors.primary,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
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
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat({
    required String label,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 10.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
