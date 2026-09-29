import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/glass_card.dart';
import 'student_lessons.dart';
import 'student_homework_screen.dart';
import 'student_exams_screen.dart';

class StudentGroupScreen extends StatefulWidget {
  const StudentGroupScreen({super.key});

  @override
  State<StudentGroupScreen> createState() => _StudentGroupScreenState();
}

class _StudentGroupScreenState extends State<StudentGroupScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  // Guruhdoshlar ro'yxati namunasi
  final List<Map<String, dynamic>> _classmates = const [
    {'name': 'Shukrona Rahimova', 'xp': 2850, 'coins': 340, 'rank': 1, 'isMe': false},
    {'name': 'Abdulxodiy Omonboyev', 'xp': 2400, 'coins': 280, 'rank': 2, 'isMe': true},
    {'name': 'Jasurbek Aliyev', 'xp': 2150, 'coins': 210, 'rank': 3, 'isMe': false},
    {'name': 'Madina Karimova', 'xp': 1980, 'coins': 195, 'rank': 4, 'isMe': false},
    {'name': 'Bekzod Mirzayev', 'xp': 1850, 'coins': 170, 'rank': 5, 'isMe': false},
    {'name': 'Dildora Yusupova', 'xp': 1720, 'coins': 150, 'rank': 6, 'isMe': false},
    {'name': 'Sardor Sobirov', 'xp': 1600, 'coins': 130, 'rank': 7, 'isMe': false},
    {'name': 'Ziyoda Nurmatova', 'xp': 1490, 'coins': 110, 'rank': 8, 'isMe': false},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showTeacherContactSheet(BuildContext context) {
    final isDark = AppColors.isDark(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: AppColors.cardBg(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(
            top: BorderSide(color: AppColors.borderCol(context), width: 1.5),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderCol(context),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'O\'qituvchi bilan bog\'lanish',
              style: TextStyle(
                color: AppColors.text1(context),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Savollaringiz yoki tushunmagan mavzularingiz bo\'yicha murojaat qilishingiz mumkin.',
              style: TextStyle(color: AppColors.text2(context), fontSize: 13),
            ),
            const SizedBox(height: 20),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.phone_outlined, color: AppColors.primary),
              ),
              title: Text(
                'Telefon orqali bog\'lanish',
                style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 14),
              ),
              subtitle: Text('+998 90 123 45 67', style: TextStyle(color: AppColors.text2(context), fontSize: 12.5)),
              trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Qo\'ng\'iroq qilish tanlandi')),
                );
              },
            ),
            Divider(color: AppColors.borderCol(context)),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.send_rounded, color: Color(0xFF2563EB)),
              ),
              title: Text(
                'Telegram guruh orqali yozish',
                style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 14),
              ),
              subtitle: Text('@abdora_biologiya_group', style: TextStyle(color: AppColors.text2(context), fontSize: 12.5)),
              trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Telegram guruhi ochilmoqda')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final student = Provider.of<StudentProvider>(context);
    final isDark = AppColors.isDark(context);

    final filteredClassmates = _classmates.where((c) {
      if (_searchQuery.isEmpty) return true;
      return c['name'].toString().toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        backgroundColor: AppColors.cardBg(context),
        elevation: 0,
        title: Text(
          'Mening Guruhim',
          style: TextStyle(
            color: AppColors.text1(context),
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.of(context)),
            onPressed: () {
              student.fetchLessons();
              student.fetchTests();
              student.fetchHomework();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Guruh ma\'lumotlari yangilandi')),
              );
            },
            tooltip: 'Yangilash',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Asosiy Guruh Kartasi (Hero Banner)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                      : [const Color(0xFFFFFFFF), const Color(0xFFF1F5F9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: AppColors.of(context).withOpacity(0.35),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.of(context).withOpacity(0.12),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.of(context).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          Icons.groups_rounded,
                          color: AppColors.of(context),
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Biologiya Chuqurlashtirilgan Guruh',
                              style: TextStyle(
                                color: AppColors.text1(context),
                                fontSize: 16.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Guruh kodi: BIO-2026-A1',
                              style: TextStyle(
                                color: AppColors.of(context),
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Divider(color: AppColors.borderCol(context)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildHeaderStat(context, Icons.person_rounded, '${_classmates.length} nafar', 'O\'quvchilar'),
                      _buildHeaderStat(context, Icons.menu_book_rounded, '${student.lessons.length} ta', 'Darslar'),
                      _buildHeaderStat(context, Icons.assignment_turned_in_rounded, '${student.tests.length} ta', 'Imtihonlar'),
                      _buildHeaderStat(context, Icons.check_circle_rounded, '98%', 'Faollik'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. O'qituvchi ma'lumotlari
            Text(
              'O\'qituvchi',
              style: TextStyle(
                color: AppColors.text1(context),
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            GlassCard(
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      border: Border.all(color: AppColors.of(context), width: 1.5),
                    ),
                    child: const Center(
                      child: Text(
                        'A',
                        style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Abdulxodiy Omonboyev',
                          style: TextStyle(
                            color: AppColors.text1(context),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Biologiya bosh mutaxassisi',
                          style: TextStyle(
                            color: AppColors.text2(context),
                            fontSize: 12.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _showTeacherContactSheet(context),
                    icon: Icon(Icons.chat_outlined, size: 16, color: AppColors.of(context)),
                    label: Text(
                      'Bog\'lanish',
                      style: TextStyle(color: AppColors.of(context), fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: AppColors.of(context)),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 3. Dars jadvali
            Text(
              'Dars Jadvali',
              style: TextStyle(
                color: AppColors.text1(context),
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            GlassCard(
              child: Column(
                children: [
                  _buildScheduleItem(context, 'Dushanba', '14:00 - 16:00', 'Nazariy ma\'ruza • 3-xona'),
                  Divider(color: AppColors.borderCol(context)),
                  _buildScheduleItem(context, 'Chorshanba', '14:00 - 16:00', 'Amaliy laboratoriya • 3-xona'),
                  Divider(color: AppColors.borderCol(context)),
                  _buildScheduleItem(context, 'Juma', '14:00 - 16:00', 'Oraliq nazorat va test tahlili • Onlayn'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 4. Tezkor guruh bo'limlari (Darslar, Vazifalar, Imtihonlar)
            Text(
              'Guruh resurslari',
              style: TextStyle(
                color: AppColors.text1(context),
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildQuickActionCard(
                    context,
                    title: 'Darslar',
                    subtitle: '${student.lessons.length} ta mavzu',
                    icon: Icons.menu_book_rounded,
                    color: AppColors.of(context),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const StudentLessonsScreen()),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildQuickActionCard(
                    context,
                    title: 'Vazifalar',
                    subtitle: '${student.homeworkList.length} ta vazifa',
                    icon: Icons.assignment_outlined,
                    color: const Color(0xFF3B82F6),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const StudentHomeworkScreen()),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildQuickActionCard(
                    context,
                    title: 'Imtihonlar',
                    subtitle: '${student.tests.length} ta test',
                    icon: Icons.quiz_outlined,
                    color: AppColors.coinGold,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const StudentExamsScreen()),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 5. Guruhdoshlar ro'yxati
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Guruhdoshlar (${_classmates.length})',
                  style: TextStyle(
                    color: AppColors.text1(context),
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.inputCol(context),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderCol(context)),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (v) => setState(() => _searchQuery = v.trim()),
                style: TextStyle(color: AppColors.text1(context), fontSize: 13.5),
                decoration: InputDecoration(
                  icon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                  hintText: 'Guruhdoshlarni qidirish...',
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
            const SizedBox(height: 12),

            // O'quvchilar ro'yxati kartalari
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredClassmates.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final studentItem = filteredClassmates[index];
                final bool isMe = studentItem['isMe'] == true;

                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isMe
                        ? AppColors.of(context).withOpacity(0.1)
                        : AppColors.cardBg(context),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isMe
                          ? AppColors.of(context).withOpacity(0.5)
                          : AppColors.borderCol(context),
                      width: isMe ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: studentItem['rank'] <= 3
                              ? AppColors.coinGold.withOpacity(0.2)
                              : AppColors.inputCol(context),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '#${studentItem['rank']}',
                            style: TextStyle(
                              color: studentItem['rank'] <= 3
                                  ? AppColors.coinGold
                                  : AppColors.text2(context),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  studentItem['name'],
                                  style: TextStyle(
                                    color: AppColors.text1(context),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                if (isMe) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.of(context),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'Siz',
                                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${studentItem['xp']} XP ball',
                              style: TextStyle(color: AppColors.text2(context), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.monetization_on_rounded, color: AppColors.coinGold, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '${studentItem['coins']}',
                            style: const TextStyle(
                              color: AppColors.coinGold,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderStat(BuildContext context, IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: AppColors.of(context), size: 18),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: AppColors.text1(context),
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
        Text(
          label,
          style: TextStyle(color: AppColors.text2(context), fontSize: 11),
        ),
      ],
    );
  }

  Widget _buildScheduleItem(BuildContext context, String day, String time, String desc) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.of(context).withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              day,
              style: TextStyle(
                color: AppColors.of(context),
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  time,
                  style: TextStyle(
                    color: AppColors.text1(context),
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                Text(
                  desc,
                  style: TextStyle(color: AppColors.text2(context), fontSize: 11.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.cardBg(context),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderCol(context)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                color: AppColors.text1(context),
                fontWeight: FontWeight.bold,
                fontSize: 12.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.text2(context), fontSize: 10.5),
            ),
          ],
        ),
      ),
    );
  }
}
