import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/student_models.dart';
import '../../providers/student_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/status_badge.dart';

class StudentHomeworkScreen extends StatefulWidget {
  const StudentHomeworkScreen({super.key});

  @override
  State<StudentHomeworkScreen> createState() => _StudentHomeworkScreenState();
}

class _StudentHomeworkScreenState extends State<StudentHomeworkScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  int _selectedFilterIndex = 0; // 0: Barchasi, 1: Kutilmoqda, 2: Topshirilgan

  final List<String> _filters = ['Barchasi', 'Kutilmoqda', 'Topshirilgan'];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final p = Provider.of<StudentProvider>(context, listen: false);
      p.fetchHomework();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showSubmitHomeworkDialog(HomeworkModel hw) {
    final textController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
        ),
        padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Vazifani topshirish',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: AppColors.textMuted, size: 20),
                  onPressed: () => Navigator.pop(ctx),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primary.withOpacity(0.2)),
              ),
              child: Text(
                hw.title,
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: textController,
              maxLines: 5,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Javobingiz yoki yechimlaringizni bu yerga batafsil yozing...',
                hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                filled: true,
                fillColor: AppColors.inputBg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
              ),
            ),
            const SizedBox(height: 20),
            CustomButton(
              text: 'Yuborish',
              onPressed: () async {
                final answer = textController.text.trim();
                if (answer.isEmpty) return;

                final p = Provider.of<StudentProvider>(context, listen: false);
                final ok = await p.submitHomework(hw.id, answer);

                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      behavior: SnackBarBehavior.floating,
                      backgroundColor: AppColors.card,
                      content: Row(
                        children: [
                          Icon(
                            ok ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                            color: ok ? AppColors.success : AppColors.primary,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              ok
                                  ? 'Vazifa muvaffaqiyatli topshirildi!'
                                  : 'Vazifa qabul qilindi. O\'qituvchi tez orada tekshiradi.',
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
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
    final student = Provider.of<StudentProvider>(context);

    // Filtrlash
    final List<HomeworkModel> filteredList = student.homeworkList.where((hw) {
      if (_selectedFilterIndex == 1 && hw.isSubmitted) return false;
      if (_selectedFilterIndex == 2 && !hw.isSubmitted) return false;

      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final title = hw.title.toLowerCase();
        final desc = hw.description.toLowerCase();
        return title.contains(query) || desc.contains(query);
      }
      return true;
    }).toList();

    final int totalCount = student.homeworkList.length;
    final int submittedCount = student.homeworkList.where((h) => h.isSubmitted).length;
    final int pendingCount = totalCount - submittedCount;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Uyga Vazifalar'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () => student.fetchHomework(),
            tooltip: 'Yangilash',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => student.fetchHomework(),
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
                      label: 'Jami',
                      value: '$totalCount',
                      color: AppColors.primary,
                      icon: Icons.assignment_outlined,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildMiniStat(
                      label: 'Kutilmoqda',
                      value: '$pendingCount',
                      color: AppColors.warning,
                      icon: Icons.hourglass_top_rounded,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildMiniStat(
                      label: 'Topshirilgan',
                      value: '$submittedCount',
                      color: AppColors.success,
                      icon: Icons.task_alt_rounded,
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
                    hintText: 'Vazifa nomini qidirish...',
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

            // Vazifalar ro'yxati
            Expanded(
              child: student.isLoadingHomework && student.homeworkList.isEmpty
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
                                      Icons.assignment_outlined,
                                      color: AppColors.primary,
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'Vazifalar topilmadi',
                                    style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Hozircha topshirish kerak bo\'lgan yangi uyga vazifalar mavjud emas.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12.5,
                                      height: 1.4,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () => student.fetchHomework(),
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
                            final hw = filteredList[index];

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
                                        hw.dueDate != null
                                            ? 'Muddati: ${hw.dueDate!.day}.${hw.dueDate!.month}.${hw.dueDate!.year}'
                                            : 'Muddatsiz',
                                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    hw.title,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
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
                                        Icon(Icons.verified_rounded, color: AppColors.primary, size: 18),
                                        const SizedBox(width: 8),
                                        Text(
                                          hw.finalScore != null
                                              ? 'Baholandi: ${hw.finalScore} / ${hw.maxScore} ball'
                                              : 'O\'qituvchi tekshirmoqda',
                                          style: TextStyle(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
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
