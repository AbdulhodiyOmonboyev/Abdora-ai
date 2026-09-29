import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/lesson_model.dart';
import '../../providers/student_provider.dart';
import '../../widgets/glass_card.dart';
import 'lesson_detail_screen.dart';
import 'student_homework_screen.dart';
import 'student_exams_screen.dart';

class StudentLessonsScreen extends StatefulWidget {
  const StudentLessonsScreen({super.key});

  @override
  State<StudentLessonsScreen> createState() => _StudentLessonsScreenState();
}

class _StudentLessonsScreenState extends State<StudentLessonsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final student = Provider.of<StudentProvider>(context, listen: false);
      if (student.lessons.isEmpty) {
        student.fetchLessons();
      }
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

    // Qidiruv bo'yicha filtrlash
    final List<LessonModel> filteredLessons = student.lessons.where((lesson) {
      if (_searchQuery.isEmpty) return true;
      final query = _searchQuery.toLowerCase();
      final title = lesson.title.toLowerCase();
      final content = (lesson.content ?? '').toLowerCase();
      return title.contains(query) || content.contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        backgroundColor: AppColors.cardBg(context),
        elevation: 0,
        title: Text(
          'Mening Darslarim',
          style: TextStyle(
            color: AppColors.text1(context),
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.of(context)),
            onPressed: () => student.fetchLessons(),
            tooltip: 'Yangilash',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => student.fetchLessons(),
        color: AppColors.of(context),
        backgroundColor: AppColors.cardBg(context),
        child: Column(
          children: [
            // Bo'limlar o'tkazgichi (Darslar, Uyga vazifa, Imtihonlar)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.cardBg(context),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.inputCol(context),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderCol(context)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.of(context),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Darslar',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const StudentHomeworkScreen(),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            'Uyga vazifa',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.text2(context),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const StudentExamsScreen(),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            'Imtihonlar',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.text2(context),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Qidiruv maydoni
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: AppColors.cardBg(context),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.inputCol(context),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderCol(context)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val.trim();
                    });
                  },
                  style: TextStyle(color: AppColors.text1(context), fontSize: 13.5),
                  decoration: InputDecoration(
                    icon: Icon(Icons.search_rounded, color: AppColors.textM(context), size: 20),
                    hintText: 'Dars nomi yoki mavzuni qidiring...',
                    hintStyle: TextStyle(color: AppColors.textM(context), fontSize: 13),
                    border: InputBorder.none,
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.clear_rounded, color: AppColors.textM(context), size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _searchQuery = '';
                              });
                            },
                          )
                        : null,
                  ),
                ),
              ),
            ),

            // Darslar ro'yxati yoki yuklanish holati
            Expanded(
              child: student.isLoadingLessons && student.lessons.isEmpty
                  ? Center(
                      child: CircularProgressIndicator(color: AppColors.of(context)),
                    )
                  : filteredLessons.isEmpty
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
                                      Icons.menu_book_rounded,
                                      color: AppColors.of(context),
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Darslar topilmadi',
                                    style: TextStyle(
                                      color: AppColors.text1(context),
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Hozirda yangi darslar ro\'yxatini qayta yuklash uchun quyidagi tugmani bosing.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: AppColors.text2(context),
                                      fontSize: 12.5,
                                      height: 1.4,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () => student.fetchLessons(),
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
                          itemCount: filteredLessons.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final lesson = filteredLessons[index];

                            return GlassCard(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => LessonDetailScreen(lesson: lesson),
                                  ),
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
                                          color: AppColors.of(context).withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'Dars #${index + 1}',
                                          style: TextStyle(
                                            color: AppColors.of(context),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: AppColors.inputCol(context),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: AppColors.borderCol(context)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.auto_awesome_rounded, color: AppColors.of(context), size: 12),
                                            const SizedBox(width: 4),
                                            Text(
                                              '10 ta AI Modul',
                                              style: TextStyle(color: AppColors.of(context), fontSize: 11),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const Spacer(),
                                      Icon(
                                        Icons.arrow_forward_ios_rounded,
                                        color: AppColors.textM(context),
                                        size: 14,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    lesson.title,
                                    style: TextStyle(
                                      color: AppColors.text1(context),
                                      fontSize: 15.5,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    lesson.content != null && lesson.content!.isNotEmpty
                                        ? lesson.content!
                                        : 'Biologiya chuqurlashtirilgan o\'quv kursi darsi',
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: AppColors.text2(context),
                                      fontSize: 12.5,
                                      height: 1.35,
                                    ),
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
}
