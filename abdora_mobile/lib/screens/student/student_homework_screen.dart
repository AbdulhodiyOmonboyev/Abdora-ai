import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/student_models.dart';
import '../../providers/student_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/status_badge.dart';
import 'games/interactive_game_screen.dart';

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
        decoration: BoxDecoration(
          color: AppColors.cardBg(ctx),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.borderCol(ctx), width: 1.5)),
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
                  color: AppColors.borderCol(ctx),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Vazifani topshirish',
                  style: TextStyle(
                    color: AppColors.text1(ctx),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, color: AppColors.textM(ctx), size: 20),
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
                color: AppColors.of(context).withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.of(context).withOpacity(0.2)),
              ),
              child: Text(
                hw.title,
                style: TextStyle(
                  color: AppColors.of(context),
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: textController,
              maxLines: 5,
              style: TextStyle(color: AppColors.text1(ctx), fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Javobingiz yoki yechimlaringizni bu yerga batafsil yozing...',
                hintStyle: TextStyle(color: AppColors.textM(ctx), fontSize: 13),
                filled: true,
                fillColor: AppColors.inputCol(ctx),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.borderCol(ctx)),
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
                      backgroundColor: AppColors.cardBg(context),
                      content: Row(
                        children: [
                          Icon(
                            ok ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                            color: ok ? AppColors.success : AppColors.of(context),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              ok
                                  ? 'Vazifa muvaffaqiyatli topshirildi!'
                                  : 'Vazifa qabul qilindi. O\'qituvchi tez orada tekshiradi.',
                              style: TextStyle(color: AppColors.text1(context), fontSize: 13),
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
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        title: const Text('Uyga Vazifalar'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.of(context)),
            onPressed: () => student.fetchHomework(),
            tooltip: 'Yangilash',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => student.fetchHomework(),
        color: AppColors.of(context),
        backgroundColor: AppColors.cardBg(context),
        child: Column(
          children: [
            // Statistik ko'rsatkichlar paneli
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: _buildMiniStat(
                      context: context,
                      label: 'Jami',
                      value: '$totalCount',
                      color: AppColors.of(context),
                      icon: Icons.assignment_outlined,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildMiniStat(
                      context: context,
                      label: 'Kutilmoqda',
                      value: '$pendingCount',
                      color: AppColors.warning,
                      icon: Icons.hourglass_top_rounded,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildMiniStat(
                      context: context,
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
                  color: AppColors.cardBg(context),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderCol(context)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val.trim()),
                  style: TextStyle(color: AppColors.text1(context), fontSize: 13.5),
                  decoration: InputDecoration(
                    icon: Icon(Icons.search_rounded, color: AppColors.textM(context), size: 18),
                    hintText: 'Vazifa nomini qidirish...',
                    hintStyle: TextStyle(color: AppColors.textM(context), fontSize: 13),
                    border: InputBorder.none,
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.clear_rounded, color: AppColors.textM(context), size: 18),
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
                          color: isSelected ? Colors.white : AppColors.text2(context),
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: AppColors.of(context),
                      backgroundColor: AppColors.cardBg(context),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(
                          color: isSelected ? AppColors.of(context) : AppColors.borderCol(context),
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
                  ? Center(child: CircularProgressIndicator(color: AppColors.of(context)))
                  : filteredList.isEmpty
                      ? Center(
                          child: SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(24),
                            child: Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppColors.cardBg(context),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.borderCol(context)),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 56,
                                    height: 56,
                                    decoration: BoxDecoration(
                                      color: AppColors.of(context).withOpacity(0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.assignment_outlined,
                                      color: AppColors.of(context),
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Vazifalar topilmadi',
                                    style: TextStyle(
                                      color: AppColors.text1(context),
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Hozircha topshirish kerak bo\'lgan yangi uyga vazifalar mavjud emas.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: AppColors.text2(context),
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
                                      backgroundColor: AppColors.of(context),
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
                                        style: TextStyle(color: AppColors.textM(context), fontSize: 11.5),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    hw.title,
                                    style: TextStyle(
                                      color: AppColors.text1(context),
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    hw.description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(color: AppColors.text2(context), fontSize: 13),
                                  ),
                                  const SizedBox(height: 12),
                                  // Mavzu bo'yicha interaktiv o'yin va bellashuv bloki
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.of(context).withOpacity(0.06),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: AppColors.of(context).withOpacity(0.2),
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.sports_esports_rounded,
                                              color: AppColors.of(context),
                                              size: 16,
                                            ),
                                            const SizedBox(width: 6),
                                            Text(
                                              'Mavzu Bo\'yicha O\'yin',
                                              style: TextStyle(
                                                color: AppColors.of(context),
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12.5,
                                              ),
                                            ),
                                            const Spacer(),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: AppColors.success.withOpacity(0.12),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Text(
                                                '+15 Tanga',
                                                style: TextStyle(
                                                  color: AppColors.success,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          'Vazifani o\'yin va juftliklar orqali oson o\'rganing yoki guruhdoshingiz bilan bellashing.',
                                          style: TextStyle(
                                            color: AppColors.text2(context),
                                            fontSize: 11.5,
                                            height: 1.3,
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: InkWell(
                                                onTap: () {
                                                  Navigator.push(
                                                    context,
                                                    MaterialPageRoute(
                                                      builder: (_) => InteractiveGameScreen(
                                                        topicTitle: hw.title,
                                                        topicDescription: hw.description,
                                                        initialGameMode: GameMode.solo,
                                                      ),
                                                    ),
                                                  );
                                                },
                                                borderRadius: BorderRadius.circular(8),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.cardBg(context),
                                                    borderRadius: BorderRadius.circular(8),
                                                    border: Border.all(
                                                      color: AppColors.of(context).withOpacity(0.4),
                                                    ),
                                                  ),
                                                  child: Row(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      Icon(
                                                        Icons.play_arrow_rounded,
                                                        size: 15,
                                                        color: AppColors.of(context),
                                                      ),
                                                      const SizedBox(width: 4),
                                                      Text(
                                                        'Yakka O\'yin',
                                                        style: TextStyle(
                                                          color: AppColors.of(context),
                                                          fontSize: 11.5,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: InkWell(
                                                onTap: () {
                                                  Navigator.push(
                                                    context,
                                                    MaterialPageRoute(
                                                      builder: (_) => InteractiveGameScreen(
                                                        topicTitle: hw.title,
                                                        topicDescription: hw.description,
                                                        initialGameMode: GameMode.duel,
                                                      ),
                                                    ),
                                                  );
                                                },
                                                borderRadius: BorderRadius.circular(8),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.of(context),
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: Row(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: const [
                                                      Icon(
                                                        Icons.people_alt_rounded,
                                                        size: 14,
                                                        color: Colors.white,
                                                      ),
                                                      SizedBox(width: 4),
                                                      Text(
                                                        'Bellashuv',
                                                        style: TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 11.5,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  if (hw.isSubmitted)
                                    Row(
                                      children: [
                                        Icon(Icons.verified_rounded, color: AppColors.of(context), size: 18),
                                        const SizedBox(width: 8),
                                        Text(
                                          hw.finalScore != null
                                              ? 'Baholandi: ${hw.finalScore} / ${hw.maxScore} ball'
                                              : 'O\'qituvchi tekshirmoqda',
                                          style: TextStyle(
                                            color: AppColors.of(context),
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
    required BuildContext context,
    required String label,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.cardBg(context),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderCol(context)),
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
                style: TextStyle(
                  color: AppColors.text1(context),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  color: AppColors.textM(context),
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
