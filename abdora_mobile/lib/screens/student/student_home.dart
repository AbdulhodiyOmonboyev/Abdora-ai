import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../models/shop_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/shop_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/useful_illustrations.dart';
import 'lesson_detail_screen.dart';
import 'student_lessons.dart';
import 'student_tasks_screen.dart';
import 'student_homework_screen.dart';
import 'student_exams_screen.dart';
import 'student_shop_leaderboard_screen.dart';
import 'student_profile_screen.dart';
import 'student_main_nav.dart';

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
      final student = Provider.of<StudentProvider>(context, listen: false);
      student.fetchLessons();
      student.fetchTests();
      student.fetchHomework();

      final shop = Provider.of<ShopProvider>(context, listen: false);
      shop.fetchItems();
    });
  }

  Future<void> _handleRefresh() async {
    final student = Provider.of<StudentProvider>(context, listen: false);
    final shop = Provider.of<ShopProvider>(context, listen: false);
    await Future.wait([
      student.refreshAll(),
      shop.fetchItems(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final student = Provider.of<StudentProvider>(context);
    final shop = Provider.of<ShopProvider>(context);
    final isTablet = context.isTablet;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _handleRefresh,
          color: AppColors.primary,
          backgroundColor: AppColors.card,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.symmetric(
              horizontal: isTablet ? 32 : 16,
              vertical: 14,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Yuqori profil paneli (Skrinshotdagi kabi qora suzuvchi kartochka)
                _buildTopProfileCard(context, user),
                const SizedBox(height: 22),

                // 2. "Foydali" bo'limi sarlavhasi
                const Text(
                  'Foydali',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 12),

                // 3. "Foydali" 2 ustunli 6 ta karta to'plami
                _buildUsefulGrid(context),
                const SizedBox(height: 24),

                // 4. "Do'kon" bo'limi sarlavhasi va "Hammasi >" havolasi
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Text(
                      'Do\'kon',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.3,
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const StudentShopLeaderboardScreen(initialIndex: 0),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Text(
                              'Hammasi',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(width: 2),
                            Icon(
                              Icons.chevron_right_rounded,
                              size: 16,
                              color: AppColors.primary,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // 5. "Do'kon" gorizontal mahsulotlar ro'yxati
                _buildShopHorizontalList(context, shop, user?.coins ?? 0),
                const SizedBox(height: 24),

                // 6. "So'nggi darslar" bo'limi
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'So\'nggi darslar',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        final nav = StudentMainNav.of(context);
                        if (nav != null) {
                          nav.setTab(1);
                        } else {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const StudentLessonsScreen()),
                          );
                        }
                      },
                      child: const Text(
                        'Barchasi',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Darslar ro'yxati
                _buildRecentLessonsList(context, student),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// 1. Yuqori profil paneli
  Widget _buildTopProfileCard(BuildContext context, dynamic user) {
    final String displayName = (user != null && user.name.toString().trim().isNotEmpty)
        ? user.name
        : 'Abdulxodiy Omonboyev';

    final int userCoins = user?.coins ?? 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.35),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Foydalanuvchi avatar rasmi
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(color: AppColors.primary.withOpacity(0.6), width: 1.5),
            ),
            child: Center(
              child: Text(
                displayName.isNotEmpty ? displayName[0].toUpperCase() : 'A',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Ism va ma'lumotlar havolasi
          Expanded(
            child: InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const StudentProfileScreen()),
                );
              },
              borderRadius: BorderRadius.circular(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    displayName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Text(
                        'o\'quvchi ma\'lumotlari',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                      SizedBox(width: 3),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 14,
                        color: AppColors.textSecondary,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Tangalar hisoblagichi nishoni
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.coinGold.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.coinGold.withOpacity(0.35)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.monetization_on_rounded,
                  color: AppColors.coinGold,
                  size: 15,
                ),
                const SizedBox(width: 5),
                Text(
                  '$userCoins',
                  style: const TextStyle(
                    color: AppColors.coinGold,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Qo'ng'iroqcha / Bildirishnomalar tugmasi
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                onPressed: () => _showNotificationsSheet(context),
                icon: const Icon(
                  Icons.notifications_none_rounded,
                  color: AppColors.textPrimary,
                  size: 24,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                splashRadius: 20,
              ),
              Positioned(
                top: 4,
                right: 4,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFEF4444).withOpacity(0.6),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 4),

          // Rang tanlash tugmasi (Theme Palette Picker)
          IconButton(
            onPressed: () => _showThemeColorPicker(context),
            icon: const Icon(
              Icons.palette_outlined,
              color: AppColors.textPrimary,
              size: 22,
            ),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            splashRadius: 20,
            tooltip: 'Ilova rangini tanlash',
          ),
        ],
      ),
    );
  }

  /// 2. "Foydali" 2 ustunli 6 ta karta to'plami
  Widget _buildUsefulGrid(BuildContext context) {
    return Column(
      children: [
        // 1-qator: Mening guruhim & Imtihonlarim
        Row(
          children: [
            Expanded(
              child: _buildUsefulCard(
                title: 'Mening\nguruhim',
                illustration: const ClassroomIllustration(size: 60),
                onTap: () {
                  final nav = StudentMainNav.of(context);
                  if (nav != null) {
                    nav.setTab(1);
                  } else {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const StudentLessonsScreen()),
                    );
                  }
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildUsefulCard(
                title: 'Imtihonlarim',
                illustration: const ExamIllustration(size: 60),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const StudentExamsScreen(),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // 2-qator: Kutubxona & Lug'atlar
        Row(
          children: [
            Expanded(
              child: _buildUsefulCard(
                title: 'Kutubxona',
                illustration: const LibraryIllustration(size: 60),
                onTap: () => _showLibrarySheet(context),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildUsefulCard(
                title: 'Lug\'atlar',
                illustration: const VocabularyIllustration(size: 60),
                onTap: () => _showVocabularySheet(context),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // 3-qator: Uyga vazifa & Referal tizimi
        Row(
          children: [
            Expanded(
              child: _buildUsefulCard(
                title: 'Uyga\nvazifa',
                illustration: const AdditionalLessonIllustration(size: 60),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const StudentHomeworkScreen(),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildUsefulCard(
                title: 'Referal\ntizimi',
                illustration: const ReferralIllustration(size: 60),
                onTap: () => _showReferralSheet(context),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Har bir Foydali kartochkasi dizayni
  Widget _buildUsefulCard({
    required String title,
    required Widget illustration,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        splashColor: AppColors.primary.withOpacity(0.08),
        highlightColor: AppColors.primary.withOpacity(0.04),
        child: Ink(
          height: 102,
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.only(left: 14, right: 8, top: 10, bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      height: 1.25,
                    ),
                  ),
                ),
                illustration,
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// 3. "Do'kon" gorizontal ro'yxati
  Widget _buildShopHorizontalList(BuildContext context, ShopProvider shop, int userCoins) {
    // Agar serverdan mahsulotlar kelmagan bo'lsa, tanlangan saralangan ro'yxatni ko'rsatamiz
    final List<ShopItemModel> displayItems = shop.items.isNotEmpty
        ? shop.items
        : [
            ShopItemModel(
              id: 'curated_airpods',
              title: 'AirPods Max',
              description: 'Yuqori sifatli simsiz quloqchin darslar va xorijiy tillarni tinglash mashqlari uchun',
              priceCoins: 1500,
              category: 'QULOQCHIN',
              stock: 8,
            ),
            ShopItemModel(
              id: 'curated_mindset',
              title: 'Kitob: Mindset',
              description: 'Kerol Dvekning o\'sish tafakkuri va muvaffaqiyat psixologiyasi kitobi',
              priceCoins: 120,
              category: 'KITOB',
              stock: 25,
            ),
            ShopItemModel(
              id: 'curated_hoodie',
              title: 'Abdora AI Hoodie',
              description: 'Eksklyuziv sifatli Abdora AI brendli issiq kiyim',
              priceCoins: 450,
              category: 'MERCH',
              stock: 15,
            ),
            ShopItemModel(
              id: 'curated_atomic',
              title: 'Kitob: Atomic Habits',
              description: 'Jeyms Klirning odatlar kuchi va unumdorlik bo\'yicha mashhur asari',
              priceCoins: 140,
              category: 'KITOB',
              stock: 30,
            ),
            ShopItemModel(
              id: 'curated_powerbank',
              title: 'Powerbank 20000mAh',
              description: 'Tezkor quvvatlovchi zamonaviy portativ batareya',
              priceCoins: 350,
              category: 'GADGET',
              stock: 12,
            ),
          ];

    return SizedBox(
      height: 215,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: displayItems.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final item = displayItems[index];
          return _buildShopItemCard(context, item, userCoins);
        },
      ),
    );
  }

  /// Do'kon mahsuloti kartasi
  Widget _buildShopItemCard(BuildContext context, ShopItemModel item, int userCoins) {
    Widget illustration;
    final catUpper = item.category.toUpperCase();
    final titleUpper = item.title.toUpperCase();

    if (catUpper.contains('QULOQ') || catUpper.contains('EAR') || titleUpper.contains('AIRPOD')) {
      illustration = const EarphonesIllustration(size: 54);
    } else if (catUpper.contains('KITOB') || catUpper.contains('BOOK') || titleUpper.contains('KITOB')) {
      illustration = const BookProductIllustration(size: 54);
    } else if (catUpper.contains('MERCH') || catUpper.contains('HOODIE') || titleUpper.contains('HOODIE')) {
      illustration = const HoodieProductIllustration(size: 54);
    } else {
      illustration = const GadgetProductIllustration(size: 54);
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _showProductPurchaseDialog(context, item, userCoins),
        borderRadius: BorderRadius.circular(16),
        splashColor: AppColors.primary.withOpacity(0.08),
        highlightColor: AppColors.primary.withOpacity(0.04),
        child: Ink(
          width: 152,
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Toifa nishoni (Kategoriya)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    item.category.toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const Spacer(),

                // Markaziy vektor illyustratsiya
                Center(child: illustration),
                const Spacer(),

                // Nomi
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),

                // Qoldiq soni
                Text(
                  '${item.stock} ta qolgan',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 10.5,
                  ),
                ),
                const SizedBox(height: 6),

                // Narx qatori (Oltin tanga)
                Row(
                  children: [
                    const Icon(
                      Icons.monetization_on_rounded,
                      color: AppColors.coinGold,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${item.priceCoins} tanga',
                      style: const TextStyle(
                        color: AppColors.coinGold,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// 4. "So'nggi darslar" ro'yxati
  Widget _buildRecentLessonsList(BuildContext context, StudentProvider student) {
    if (student.isLoadingLessons) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    if (student.lessons.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: const Center(
          child: Text(
            'Hozircha darslar mavjud emas',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ),
      );
    }

    final displayLessons = student.lessons.take(3).toList();

    return Column(
      children: displayLessons.map((lesson) {
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          child: GlassCard(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => LessonDetailScreen(lesson: lesson)),
              );
            },
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.menu_book_rounded,
                    color: AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lesson.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'AI Modullari • Darsni davom ettirish',
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: AppColors.textMuted,
                  size: 13,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  /// Mahsulot sotib olish dialogi
  void _showProductPurchaseDialog(BuildContext context, ShopItemModel item, int userCoins) {
    final bool canAfford = userCoins >= item.priceCoins;

    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.border),
        ),
        title: Row(
          children: [
            const Icon(Icons.shopping_bag_outlined, color: AppColors.primary, size: 22),
            const SizedBox(width: 8),
            const Text(
              'Do\'kon xaridi',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              item.title,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              item.description,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Mahsulot narxi:', style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
                      Row(
                        children: [
                          const Icon(Icons.monetization_on_rounded, color: AppColors.coinGold, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '${item.priceCoins} tanga',
                            style: const TextStyle(color: AppColors.coinGold, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Sizning balansingiz:', style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
                      Row(
                        children: [
                          const Icon(Icons.account_balance_wallet_outlined, color: AppColors.textSecondary, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '$userCoins tanga',
                            style: TextStyle(
                              color: canAfford ? AppColors.success : const Color(0xFFEF4444),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (!canAfford) ...[
              const SizedBox(height: 10),
              const Text(
                'Tangalar yetarli emas. Darslarni tamomlash, test topshirish va do\'stlarni taklif qilish orqali tangalarni to\'plashingiz mumkin.',
                style: TextStyle(color: Color(0xFFF87171), fontSize: 11.5, height: 1.3),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Bekor qilish', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: canAfford
                ? () async {
                    Navigator.pop(dialogCtx);
                    final shopProvider = Provider.of<ShopProvider>(context, listen: false);
                    final success = await shopProvider.buyItem(item.id);

                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: success ? AppColors.card : AppColors.card,
                          behavior: SnackBarBehavior.floating,
                          content: Row(
                            children: [
                              Icon(
                                success ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                                color: success ? AppColors.success : AppColors.primary,
                                size: 20,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  success
                                      ? 'Xarid muvaffaqiyatli amalga oshirildi!'
                                      : 'Xarid so\'rovi qabul qilindi. Administrator tez orada tasdiqlaydi.',
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                  }
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              disabledBackgroundColor: AppColors.border,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Sotib olish', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  /// 1-Modal: Bildirishnomalar
  void _showNotificationsSheet(BuildContext context) {
    final List<Map<String, dynamic>> notifications = [
      {
        'title': 'Yangi dars ochildi',
        'desc': 'Hujayra biologiyasi va energiya almashinuvi darsi tayyor.',
        'time': '5 daqiqa oldin',
        'isNew': true,
      },
      {
        'title': 'Uyga vazifa baholandi',
        'desc': 'Topshirgan amaliy topshirig\'ingiz 95 ball bilan qabul qilindi.',
        'time': 'Bugun, 10:30',
        'isNew': true,
      },
      {
        'title': 'AI Repetitor tahlili',
        'desc': 'Test natijalaringiz bo\'yicha zaif mavzular tahlili shakllantirildi.',
        'time': 'Kecha, 18:20',
        'isNew': false,
      },
      {
        'title': 'Reyting o\'sishi',
        'desc': 'Guruh reytingida 2-o\'ringa ko\'tarildingiz! +30 tanga taqdim etildi.',
        'time': '2 kun oldin',
        'isNew': false,
      },
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetCtx) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            children: [
              // Tortish dastagi
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 14),

              // Sarlavha
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Bildirishnomalar',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary, size: 20),
                    onPressed: () => Navigator.pop(sheetCtx),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Bildirishnomalar ro'yxati
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  itemCount: notifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final item = notifications[i];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: item['isNew'] == true
                            ? AppColors.primary.withOpacity(0.06)
                            : AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: item['isNew'] == true
                              ? AppColors.primary.withOpacity(0.3)
                              : AppColors.border,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.notifications_active_outlined,
                              color: AppColors.primary,
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      item['title'] as String,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13.5,
                                      ),
                                    ),
                                    Text(
                                      item['time'] as String,
                                      style: const TextStyle(
                                        color: AppColors.textMuted,
                                        fontSize: 10.5,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item['desc'] as String,
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12,
                                    height: 1.3,
                                  ),
                                ),
                              ],
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
      ),
    );
  }

  /// 2-Modal: Kutubxona
  void _showLibrarySheet(BuildContext context) {
    final List<Map<String, String>> books = [
      {
        'title': 'Biologiya: To\'liq abituriyent qo\'llanmasi',
        'info': 'PDF • 24.5 MB • 320 bet',
        'category': 'Darslik',
      },
      {
        'title': 'IELTS Band 7.5+ Grammatika va Lug\'at to\'plami',
        'info': 'PDF • 12.1 MB • 180 bet',
        'category': 'Ingliz tili',
      },
      {
        'title': 'Kimyo va Biologiya formulalari jadvali',
        'info': 'PDF • 5.3 MB • 45 bet',
        'category': 'Qo\'llanma',
      },
      {
        'title': 'Milliy sertifikat testlar tahlili 2026',
        'info': 'PDF • 18.2 MB • 210 bet',
        'category': 'Testlar',
      },
      {
        'title': 'Xotirani kuchaytirish va samarali o\'qish sirlari',
        'info': 'PDF • 8.7 MB • 120 bet',
        'category': 'Psixologiya',
      },
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetCtx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.45,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tortish dastagi
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
              const SizedBox(height: 14),

              // Sarlavha
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Kutubxona',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Barcha o\'quv materiallari va konspektlar',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary, size: 20),
                    onPressed: () => Navigator.pop(sheetCtx),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Qidiruv maydoni
              Container(
                decoration: BoxDecoration(
                  color: AppColors.inputBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: const TextField(
                  style: TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    icon: Icon(Icons.search_rounded, color: AppColors.textMuted, size: 18),
                    hintText: 'Kitob yoki konspekt nomini qidiring...',
                    hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
                    border: InputBorder.none,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Materiallar ro'yxati
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  itemCount: books.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final item = books[i];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                            ),
                            child: const Center(
                              child: Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFEF4444), size: 22),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['title']!,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  item['info']!,
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  backgroundColor: AppColors.card,
                                  content: Text(
                                    '${item['title']} yuklab olinmoqda...',
                                    style: const TextStyle(color: Colors.white, fontSize: 12),
                                  ),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('O\'qish', style: TextStyle(color: Colors.white, fontSize: 11.5)),
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
      ),
    );
  }

  /// 3-Modal: Lug'atlar (AI Vocabulary)
  void _showVocabularySheet(BuildContext context) {
    final List<Map<String, String>> words = [
      {
        'word': 'Mitochondria',
        'phonetic': '[ˌmaɪ.təʊˈkɒn.dri.ə]',
        'level': 'B2',
        'trans': 'Mitoxondriya — hujayraning asosiy energiya (ATF) ishlab chiqaruvchi stansiyasi.',
      },
      {
        'word': 'Photosynthesis',
        'phonetic': '[ˌfəʊ.təʊˈsɪn.θə.sɪs]',
        'level': 'B2',
        'trans': 'Fotosintez — yorug\'lik energiyasi hisobiga organik moddalar sintezlanishi.',
      },
      {
        'word': 'Homeostasis',
        'phonetic': '[ˌhɒm.i.əʊˈsteɪ.sɪs]',
        'level': 'C1',
        'trans': 'Gomeostaz — organizm ichki muhiti barqarorligini saqlovchi biologik mexanizm.',
      },
      {
        'word': 'Chromosome',
        'phonetic': '[ˈkrəʊ.mə.səʊm]',
        'level': 'B1',
        'trans': 'Xromosoma — irsiy axborotni saqlovchi va uzatuvchi genetik struktura.',
      },
      {
        'word': 'Metabolism',
        'phonetic': '[məˈtæb.əl.ɪ.zəm]',
        'level': 'B2',
        'trans': 'Moddalar almashinuvi — tirik organizmda kechuvchi barcha kimyoviy o\'zgarishlar majmui.',
      },
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetCtx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.45,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
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
              const SizedBox(height: 14),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Lug\'atlar (AI Vocabulary)',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Mavzular bo\'yicha faol biologik va ilmiy atamalar',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary, size: 20),
                    onPressed: () => Navigator.pop(sheetCtx),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  itemCount: words.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final w = words[i];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    w['word']!,
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    w['phonetic']!,
                                    style: const TextStyle(
                                      color: AppColors.textMuted,
                                      fontSize: 11.5,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.secondary.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  w['level']!,
                                  style: const TextStyle(
                                    color: AppColors.secondary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            w['trans']!,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
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
      ),
    );
  }

  /// 4-Modal: Referal tizimi
  void _showReferralSheet(BuildContext context) {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final String referralCode = 'ABDORA-${(user?.username.isNotEmpty == true ? user!.username : 'TALABA').toUpperCase()}';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetCtx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.45,
        maxChildSize: 0.9,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Column(
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
              const SizedBox(height: 14),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Referal tizimi',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary, size: 20),
                    onPressed: () => Navigator.pop(sheetCtx),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    // Oltin bonus banneri
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.coinGold.withOpacity(0.15),
                            AppColors.primary.withOpacity(0.08),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.coinGold.withOpacity(0.35)),
                      ),
                      child: Column(
                        children: const [
                          Icon(Icons.stars_rounded, color: AppColors.coinGold, size: 36),
                          SizedBox(height: 8),
                          Text(
                            'Do\'stingizni taklif qiling — +50 tanga oling!',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 6),
                          Text(
                            'Har bir yangi ro\'yxatdan o\'tgan do\'stingiz uchun ham sizga, ham do\'stingizga 50 oltin tanga sovg\'a qilinadi.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Referal kodi qutisi
                    const Text(
                      'Sizning shaxsiy referal kodingiz:',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            referralCode,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              letterSpacing: 1,
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: () {
                              Clipboard.setData(ClipboardData(text: referralCode));
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  backgroundColor: AppColors.card,
                                  behavior: SnackBarBehavior.floating,
                                  content: Text(
                                    'Referal kodi nusxalandi!',
                                    style: TextStyle(color: Colors.white, fontSize: 13),
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.copy_rounded, size: 14, color: Colors.white),
                            label: const Text('Nusxalash', style: TextStyle(color: Colors.white, fontSize: 12)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Referal statistikasi
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text('Taklif qilinganlar', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                SizedBox(height: 4),
                                Text(
                                  '3 ta do\'st',
                                  style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text('Jami mukofot', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                SizedBox(height: 4),
                                Text(
                                  '+150 tanga',
                                  style: TextStyle(color: AppColors.coinGold, fontSize: 15, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// 5-Modal: Ilova rangini tanlash (Theme Color Picker)
  void _showThemeColorPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetCtx) => Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return Container(
            decoration: const BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
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
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.palette_outlined, color: AppColors.primary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Ilova rangini tanlash',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              themeProvider.currentColor.name,
                              style: TextStyle(
                                color: AppColors.primaryLight,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary, size: 20),
                      onPressed: () => Navigator.pop(sheetCtx),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                const Text(
                  'Sevimli aksent rangingizni tanlang:',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 14),

                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: themeProvider.availableColors.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final option = themeProvider.availableColors[index];
                    final isSelected = themeProvider.selectedIndex == index;

                    return Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () {
                          themeProvider.setThemeColor(index);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.card,
                              duration: const Duration(seconds: 1),
                              behavior: SnackBarBehavior.floating,
                              content: Text(
                                '${option.name} rangi tanlandi',
                                style: const TextStyle(color: Colors.white, fontSize: 12.5),
                              ),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Ink(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? option.primary.withOpacity(0.12) : AppColors.background,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isSelected ? option.primary : AppColors.border,
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: option.primary,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: option.primary.withOpacity(0.4),
                                      blurRadius: 6,
                                    ),
                                  ],
                                ),
                                child: isSelected
                                    ? const Center(
                                        child: Icon(Icons.check_rounded, color: Colors.white, size: 18),
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Text(
                                  option.name,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : AppColors.textPrimary,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              if (isSelected)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: option.primary.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'Faol',
                                    style: TextStyle(
                                      color: option.primary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }
}
