import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../models/lesson_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/glass_card.dart';
import 'lesson_detail_screen.dart';
import 'student_homework_screen.dart';
import 'student_exams_screen.dart';

enum LessonDisplayMode {
  path, // Duolingo o'quv yo'li
  grid, // Kartalar ko'rinishi
}

enum LessonStatus {
  completed, // O'zlashtirilgan
  active, // Hozirgi dars (pulsatsiyalanuvchi)
  locked, // Qulflangan
}

class StudentLessonsScreen extends StatefulWidget {
  const StudentLessonsScreen({super.key});

  @override
  State<StudentLessonsScreen> createState() => _StudentLessonsScreenState();
}

class _StudentLessonsScreenState extends State<StudentLessonsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  LessonDisplayMode _displayMode = LessonDisplayMode.path;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final student = Provider.of<StudentProvider>(context, listen: false);
      if (student.lessons.isEmpty) {
        student.fetchLessons();
      } else {
        student.fetchLessonProgress();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Dars holatini aniqlash (Completed, Active, Locked)
  LessonStatus _getLessonStatus(
    LessonModel lesson,
    int index,
    List<LessonModel> lessons,
    Set<String> completedIds,
  ) {
    if (completedIds.contains(lesson.id)) {
      return LessonStatus.completed;
    }

    // Tugallanmagan darslar orasida birinchisi - aktiv
    final firstUncompletedIndex = lessons.indexWhere((l) => !completedIds.contains(l.id));
    if (firstUncompletedIndex == -1) {
      return LessonStatus.completed;
    }
    if (firstUncompletedIndex == index) {
      return LessonStatus.active;
    }

    // Qolganlari - qulflangan
    return LessonStatus.locked;
  }

  // Qulflangan dars dialogi
  void _showLockedLessonDialog(LessonModel lesson, int lessonNumber) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        decoration: BoxDecoration(
          color: AppColors.cardBg(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.borderCol(context), width: 1.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.borderCol(context),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 18),
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.lock_clock_rounded, color: Colors.amber, size: 32),
            ),
            const SizedBox(height: 14),
            Text(
              '$lessonNumber-Dars qulflangan',
              style: TextStyle(
                color: AppColors.text1(context),
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${lesson.title}\n\nUshbu darsga o\'tish uchun avvalgi darslarni to\'liq o\'zlashtiring va topshiriqlarni bajaring. Bosqichma-bosqich o\'rganish mustahkam bilim beradi!',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.text2(context),
                fontSize: 13,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: BorderSide(color: AppColors.borderCol(context)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: Text(
                      'Tushundim',
                      style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => LessonDetailScreen(lesson: lesson),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.of(context),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text(
                      'Baribir ko\'rish',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final student = Provider.of<StudentProvider>(context);
    final auth = Provider.of<AuthProvider>(context, listen: false);

    // Qidiruv bo'yicha filtrlash
    final List<LessonModel> filteredLessons = student.lessons.where((lesson) {
      if (_searchQuery.isEmpty) return true;
      final query = _searchQuery.toLowerCase();
      final title = lesson.title.toLowerCase();
      final content = (lesson.content ?? '').toLowerCase();
      return title.contains(query) || content.contains(query);
    }).toList();

    final totalLessons = student.lessons.length;
    final completedCount = student.completedLessonIds.length;
    final progressFactor = totalLessons > 0 ? (completedCount / totalLessons).clamp(0.0, 1.0) : 0.0;

    // Bosqich nomi
    String stageName = 'Boshlang\'ich';
    if (progressFactor >= 0.75) {
      stageName = 'Mukammal daraja';
    } else if (progressFactor >= 0.4) {
      stageName = 'O\'rta daraja';
    }

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
          // Ko'rinish rejimini almashtirish (Yo'l / Grid)
          Container(
            margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
            decoration: BoxDecoration(
              color: AppColors.inputCol(context),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.borderCol(context)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                InkWell(
                  onTap: () {
                    setState(() {
                      _displayMode = LessonDisplayMode.path;
                    });
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                    decoration: BoxDecoration(
                      color: _displayMode == LessonDisplayMode.path ? AppColors.of(context) : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.alt_route_rounded,
                      size: 17,
                      color: _displayMode == LessonDisplayMode.path ? Colors.white : AppColors.textM(context),
                    ),
                  ),
                ),
                InkWell(
                  onTap: () {
                    setState(() {
                      _displayMode = LessonDisplayMode.grid;
                    });
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                    decoration: BoxDecoration(
                      color: _displayMode == LessonDisplayMode.grid ? AppColors.of(context) : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.grid_view_rounded,
                      size: 17,
                      color: _displayMode == LessonDisplayMode.grid ? Colors.white : AppColors.textM(context),
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.of(context)),
            onPressed: () {
              student.fetchLessons();
              student.fetchLessonProgress();
            },
            tooltip: 'Yangilash',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await student.fetchLessons();
          await student.fetchLessonProgress();
        },
        color: AppColors.of(context),
        backgroundColor: AppColors.cardBg(context),
        child: Column(
          children: [
            // 1. Bo'limlar o'tkazgichi (Darslar, Uyga vazifa, Imtihonlar)
            _buildNavigationTabs(context),

            // 2. Duolingo Guruh Progress Bari ("Bosqich: Boshlang'ich", "X/Y ta dars o'zlashtirildi")
            _buildStageProgressBar(
              context,
              stageName: stageName,
              completedCount: completedCount,
              totalCount: totalLessons,
              progressFactor: progressFactor,
              streak: student.streakCurrent,
            ),

            // 3. Qidiruv maydoni
            _buildSearchBar(context),

            // 4. Asosiy darslar tarkibi (Duolingo Winding Path yoki Grid)
            Expanded(
              child: student.isLoadingLessons && student.lessons.isEmpty
                  ? Center(
                      child: CircularProgressIndicator(color: AppColors.of(context)),
                    )
                  : filteredLessons.isEmpty
                      ? _buildEmptyState(context, student)
                      : _displayMode == LessonDisplayMode.path
                          ? _buildDuolingoWindingPath(
                              context: context,
                              lessons: filteredLessons,
                              completedIds: student.completedLessonIds,
                              userAvatar: auth.user?.avatar,
                              userName: auth.user?.name ?? 'O\'quvchi',
                            )
                          : _buildGridView(
                              context: context,
                              lessons: filteredLessons,
                              completedIds: student.completedLessonIds,
                            ),
            ),
          ],
        ),
      ),
    );
  }

  // 1. Bo'limlar o'tkazgichi
  Widget _buildNavigationTabs(BuildContext context) {
    return Container(
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
    );
  }

  // 2. Duolingo Guruh Progress Bari
  Widget _buildStageProgressBar(
    BuildContext context, {
    required String stageName,
    required int completedCount,
    required int totalCount,
    required double progressFactor,
    required int streak,
  }) {
    final percent = (progressFactor * 100).toInt();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBg(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderCol(context)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.of(context).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.workspace_premium_rounded, size: 14, color: AppColors.of(context)),
                        const SizedBox(width: 4),
                        Text(
                          'Bosqich: $stageName',
                          style: TextStyle(
                            color: AppColors.of(context),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (streak > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.local_fire_department_rounded, size: 13, color: Colors.orange),
                          const SizedBox(width: 3),
                          Text(
                            '$streak kun',
                            style: const TextStyle(
                              color: Colors.orange,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              Text(
                '$completedCount/$totalCount ta dars o\'zlashtirildi',
                style: TextStyle(
                  color: AppColors.text2(context),
                  fontWeight: FontWeight.w600,
                  fontSize: 11.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Progress shkalasi
          Stack(
            children: [
              Container(
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.inputCol(context),
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              AnimatedFractionallySizedBox(
                duration: const Duration(milliseconds: 600),
                curve: Curves.easeOutCubic,
                widthFactor: totalCount == 0 ? 0.0 : progressFactor.clamp(0.04, 1.0),
                child: Container(
                  height: 10,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.of(context),
                        AppColors.success,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(6),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.success.withOpacity(0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                progressFactor >= 1.0
                    ? 'Barcha darslar a\'lo darajada o\'zlashtirildi! 🏆'
                    : progressFactor > 0.0
                        ? 'Zo\'r natija! Keyingi bekat sari davom eting 🚀'
                        : 'Bilim sarguzashtini hoziroq 1-darsdan boshlang! ✨',
                style: TextStyle(
                  color: AppColors.textM(context),
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                ),
              ),
              Text(
                '$percent%',
                style: TextStyle(
                  color: AppColors.text1(context),
                  fontWeight: FontWeight.bold,
                  fontSize: 11.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 3. Qidiruv maydoni
  Widget _buildSearchBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.cardBg(context),
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
    );
  }

  // DUOLINGO O'QUV YO'LI (Winding Path)
  Widget _buildDuolingoWindingPath({
    required BuildContext context,
    required List<LessonModel> lessons,
    required Set<String> completedIds,
    String? userAvatar,
    required String userName,
  }) {
    // S-simon lateral siljish shabloni: markaz -> o'ng -> markaz -> chap -> markaz...
    const lateralPattern = [0.0, 0.42, 0.22, -0.22, -0.42, -0.2, 0.2];

    // Rejadagi barcha darslar soni (kamida 12 ta katak yoki mavjud darslar soni)
    final targetCount = lessons.length >= 12 ? lessons.length : 12;
    final List<LessonModel> displayLessons = List.from(lessons);
    while (displayLessons.length < targetCount) {
      final nextNum = displayLessons.length + 1;
      displayLessons.add(
        LessonModel(
          id: 'placeholder_$nextNum',
          title: '$nextNum-Dars • Rejalashtirilgan',
          content: 'Ushbu dars o\'quv dasturi bo\'yicha tez kunda taqdim etiladi.',
          subject: lessons.isNotEmpty ? lessons.first.subject : 'biologiya',
          orderIndex: nextNum,
        ),
      );
    }

    return CustomScrollView(
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(top: 14, bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.explore_rounded, size: 16, color: AppColors.of(context)),
                const SizedBox(width: 6),
                Text(
                  'Duolingo O\'quv Yo\'li',
                  style: TextStyle(
                    color: AppColors.text2(context),
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (ctx, index) {
              final lesson = displayLessons[index];
              final isPlaceholder = lesson.id.startsWith('placeholder_');
              final status = isPlaceholder
                  ? LessonStatus.locked
                  : _getLessonStatus(lesson, index, displayLessons, completedIds);
              final lateralOffset = lateralPattern[index % lateralPattern.length];
              final isLast = index == displayLessons.length - 1;

              // Har 5 darsdan keyin Unit Milestone (Bosqich Bekati)
              final showMilestoneAfter = (index + 1) % 5 == 0 && !isLast;

              return Column(
                children: [
                  _DuolingoPathNode(
                    lesson: lesson,
                    lessonNumber: index + 1,
                    status: status,
                    lateralOffset: lateralOffset,
                    userAvatar: userAvatar,
                    userName: userName,
                    onTap: () {
                      if (status == LessonStatus.locked || isPlaceholder) {
                        _showLockedLessonDialog(lesson, index + 1);
                      } else {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => LessonDetailScreen(lesson: lesson),
                          ),
                        );
                      }
                    },
                  ),
                  if (showMilestoneAfter) ...[
                    const SizedBox(height: 10),
                    _buildMilestoneBanner(context, (index + 1) ~/ 5),
                    const SizedBox(height: 10),
                  ],
                ],
              );
            },
            childCount: displayLessons.length,
          ),
        ),
        // Yo'l yakunidagi G'alaba qasri
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 48),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.cardBg(context),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.borderCol(context)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.14),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.emoji_events_rounded, color: AppColors.success, size: 32),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Bosqich Marrasi',
                    style: TextStyle(
                      color: AppColors.text1(context),
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Barcha darslarni o\'zlashtirib, imtihon topshiring va sertifikatga ega bo\'ling!',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.text2(context), fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Bosqich Bekati (Milestone Checkpoint)
  Widget _buildMilestoneBanner(BuildContext context, int unitNumber) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 28),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.of(context).withOpacity(0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.of(context).withOpacity(0.25)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shield_rounded, color: AppColors.of(context), size: 18),
          const SizedBox(width: 8),
          Text(
            '$unitNumber-Bosqich Bekati: Bilimlar Sinovi',
            style: TextStyle(
              color: AppColors.of(context),
              fontWeight: FontWeight.bold,
              fontSize: 12.5,
            ),
          ),
        ],
      ),
    );
  }

  // KARTALAR REJIMI (Grid View)
  Widget _buildGridView({
    required BuildContext context,
    required List<LessonModel> lessons,
    required Set<String> completedIds,
  }) {
    return GridView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(14),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: Responsive.isTablet(context) ? 3 : 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.84,
      ),
      itemCount: lessons.length,
      itemBuilder: (context, index) {
        final lesson = lessons[index];
        final status = _getLessonStatus(lesson, index, lessons, completedIds);

        Color badgeColor;
        String badgeText;
        IconData badgeIcon;

        switch (status) {
          case LessonStatus.completed:
            badgeColor = AppColors.success;
            badgeText = 'O\'zlashtirilgan';
            badgeIcon = Icons.stars_rounded;
            break;
          case LessonStatus.active:
            badgeColor = AppColors.of(context);
            badgeText = 'Hozirgi dars';
            badgeIcon = Icons.play_circle_filled_rounded;
            break;
          case LessonStatus.locked:
            badgeColor = AppColors.textM(context);
            badgeText = 'Qulflangan';
            badgeIcon = Icons.lock_outline_rounded;
            break;
        }

        return GlassCard(
          onTap: () {
            if (status == LessonStatus.locked) {
              _showLockedLessonDialog(lesson, index + 1);
            } else {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => LessonDetailScreen(lesson: lesson),
                ),
              );
            }
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: badgeColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${index + 1}-Dars • $badgeText',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: badgeColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 10.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: badgeColor.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      badgeIcon,
                      color: badgeColor,
                      size: 14,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lesson.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: status == LessonStatus.locked
                            ? AppColors.text2(context)
                            : AppColors.text1(context),
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Expanded(
                      child: Text(
                        lesson.content != null && lesson.content!.isNotEmpty
                            ? lesson.content!
                            : 'Mavzu bo\'yicha darslik va amaliy topshiriqlar',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: AppColors.text2(context),
                          fontSize: 10.5,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(status == LessonStatus.active ? 0.15 : 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: badgeColor.withOpacity(status == LessonStatus.active ? 0.35 : 0.18),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      status == LessonStatus.completed
                          ? 'Takrorlash'
                          : status == LessonStatus.active
                              ? 'Boshlash'
                              : 'Qulflangan',
                      style: TextStyle(
                        color: badgeColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      status == LessonStatus.locked ? Icons.lock_outline_rounded : Icons.arrow_forward_ios_rounded,
                      color: badgeColor,
                      size: 9.5,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Bo'sh holat ko'rinishi
  Widget _buildEmptyState(BuildContext context, StudentProvider student) {
    return Center(
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
                onPressed: () {
                  student.fetchLessons();
                  student.fetchLessonProgress();
                },
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
    );
  }
}

// DUOLINGO YO'LIDAGI INDIVIDUAL TUGUN (Path Node)
class _DuolingoPathNode extends StatelessWidget {
  final LessonModel lesson;
  final int lessonNumber;
  final LessonStatus status;
  final double lateralOffset; // -0.5 dan +0.5 gacha siljish
  final String? userAvatar;
  final String userName;
  final VoidCallback onTap;

  const _DuolingoPathNode({
    required this.lesson,
    required this.lessonNumber,
    required this.status,
    required this.lateralOffset,
    this.userAvatar,
    required this.userName,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 14),
      child: Align(
        alignment: Alignment(lateralOffset, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Agar dars 'active' bo'lsa, tepasida o'quvchi avatari sakrab turadi (Duolingo uslubi)
            if (status == LessonStatus.active) ...[
              _buildStudentAvatarIndicator(context)
                  .animate(onPlay: (controller) => controller.repeat(reverse: true))
                  .moveY(begin: 0, end: -6, duration: 800.ms, curve: Curves.easeInOut),
              const SizedBox(height: 8),
            ],

            // 3D Duolingo tugun tugmasi
            GestureDetector(
              onTap: onTap,
              child: _buildNodeButton(context),
            ),
            const SizedBox(height: 6),

            // Dars raqami va qisqa sarlavhasi
            Container(
              constraints: const BoxConstraints(maxWidth: 160),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.cardBg(context),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: status == LessonStatus.active
                      ? AppColors.of(context).withOpacity(0.4)
                      : AppColors.borderCol(context),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    '$lessonNumber-dars',
                    style: TextStyle(
                      color: status == LessonStatus.completed
                          ? AppColors.success
                          : status == LessonStatus.active
                              ? AppColors.of(context)
                              : AppColors.textM(context),
                      fontWeight: FontWeight.bold,
                      fontSize: 10.5,
                    ),
                  ),
                  Text(
                    lesson.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: status == LessonStatus.locked ? AppColors.text2(context) : AppColors.text1(context),
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // O'quvchi avatari indikatori (Aktiv dars tepasida)
  Widget _buildStudentAvatarIndicator(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.of(context),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.of(context).withOpacity(0.4),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 10,
            backgroundColor: Colors.white,
            child: Text(
              userName.isNotEmpty ? userName.substring(0, 1).toUpperCase() : 'S',
              style: TextStyle(color: AppColors.of(context), fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 5),
          const Text(
            'Hozirgi bekat!',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 10.5,
            ),
          ),
        ],
      ),
    );
  }

  // 3D Dumaloq Duolingo tugmasi
  Widget _buildNodeButton(BuildContext context) {
    const double size = 70.0;

    switch (status) {
      case LessonStatus.completed:
        return Stack(
          alignment: Alignment.center,
          children: [
            // 3D pastki qatlam (chuqurlik)
            Container(
              width: size,
              height: size + 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF059669), // To'q zumrad
              ),
            ),
            // Asosiy yuqori yuzasi
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF34D399),
                    Color(0xFF10B981),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withOpacity(0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.star_rounded, // Oltin/Yashil yulduz / Crown
                  color: Colors.white,
                  size: 36,
                ),
              ),
            ),
            // Crown / Nishon
            Positioned(
              top: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: Colors.amber,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_rounded, color: Colors.white, size: 11),
              ),
            ),
          ],
        );

      case LessonStatus.active:
        return Stack(
          alignment: Alignment.center,
          children: [
            // Pulsatsiyalanuvchi tashqi halqa (Radar/Halo)
            Container(
              width: size + 16,
              height: size + 16,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.of(context).withOpacity(0.5),
                  width: 2.5,
                ),
              ),
            )
                .animate(onPlay: (controller) => controller.repeat(reverse: true))
                .scale(begin: const Offset(0.95, 0.95), end: const Offset(1.15, 1.15), duration: 1200.ms),

            // 3D pastki qatlam
            Container(
              width: size,
              height: size + 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.of(context).withOpacity(0.8),
              ),
            ),
            // Asosiy yuza
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.of(context),
                    AppColors.of(context).withOpacity(0.85),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.of(context).withOpacity(0.45),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.play_arrow_rounded,
                  color: Colors.white,
                  size: 40,
                ),
              ),
            ),
          ],
        );

      case LessonStatus.locked:
        return Stack(
          alignment: Alignment.center,
          children: [
            // 3D pastki qatlam
            Container(
              width: size,
              height: size + 4,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.borderCol(context),
              ),
            ),
            // Asosiy yuza
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.inputCol(context),
                border: Border.all(color: AppColors.borderCol(context)),
              ),
              child: Center(
                child: Icon(
                  Icons.lock_rounded,
                  color: AppColors.textM(context),
                  size: 26,
                ),
              ),
            ),
          ],
        );
    }
  }
}
