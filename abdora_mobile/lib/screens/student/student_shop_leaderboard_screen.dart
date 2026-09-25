import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../providers/auth_provider.dart';
import '../../providers/shop_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/glass_card.dart';

class StudentShopLeaderboardScreen extends StatefulWidget {
  const StudentShopLeaderboardScreen({super.key});

  @override
  State<StudentShopLeaderboardScreen> createState() => _StudentShopLeaderboardScreenState();
}

class _StudentShopLeaderboardScreenState extends State<StudentShopLeaderboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedCategory = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    Future.microtask(() {
      Provider.of<ShopProvider>(context, listen: false).fetchItems();
      Provider.of<StudentProvider>(context, listen: false).fetchLeaderboard();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Do\'kon & Reyting'),
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
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: const [
            Tab(text: 'Tangalar Do\'koni'),
            Tab(text: 'Peshqadamlar'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildShopTab(),
          _buildLeaderboardTab(),
        ],
      ),
    );
  }

  // 1. Tangalar Do'koni
  Widget _buildShopTab() {
    final user = Provider.of<AuthProvider>(context).user;
    final shop = Provider.of<ShopProvider>(context);
    final isTablet = context.isTablet;

    final filteredItems = _selectedCategory == 'all'
        ? shop.items
        : shop.items.where((i) => i.category == _selectedCategory).toList();

    return RefreshIndicator(
      onRefresh: () => shop.fetchItems(),
      color: AppColors.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Banner
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.coinGold.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.monetization_on_rounded, color: AppColors.coinGold, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Sizning tangalaringiz', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          const SizedBox(height: 2),
                          Text(
                            '${user?.coins ?? 0} tanga',
                            style: const TextStyle(color: AppColors.coinGold, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Kategoriya filtri
          SliverToBoxAdapter(
            child: SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildCategoryChip('all', 'Barchasi'),
                  _buildCategoryChip('merch', 'Brend buyumlar'),
                  _buildCategoryChip('book', 'Kitoblar'),
                  _buildCategoryChip('discount', 'Chegirmalar'),
                ],
              ),
            ),
          ),

          // Mahsulotlar to'ri
          if (shop.isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
            )
          else if (filteredItems.isEmpty)
            const SliverFillRemaining(
              child: Center(child: Text('Mahsulotlar mavjud emas', style: TextStyle(color: AppColors.textMuted))),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverGrid(
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: isTablet ? 3 : 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: isTablet ? 0.85 : 0.74,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = filteredItems[index];
                    final canBuy = (user?.coins ?? 0) >= item.priceCoins;

                    return GlassCard(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Center(
                                child: Icon(Icons.card_giftcard_rounded, color: AppColors.primary, size: 36),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            item.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.description,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.monetization_on_rounded, color: AppColors.coinGold, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${item.priceCoins}',
                                    style: const TextStyle(color: AppColors.coinGold, fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                ],
                              ),
                              InkWell(
                                onTap: canBuy
                                    ? () async {
                                        final ok = await shop.buyItem(item.id);
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text(ok ? 'Xarid muvaffaqiyatli amalga oshirildi!' : 'Xaridda xatolik'),
                                              backgroundColor: ok ? AppColors.success : AppColors.danger,
                                            ),
                                          );
                                        }
                                      }
                                    : null,
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: canBuy ? AppColors.primary : AppColors.surface,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Olish',
                                    style: TextStyle(
                                      color: canBuy ? Colors.white : AppColors.textMuted,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                  childCount: filteredItems.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String catKey, String label) {
    final isSelected = _selectedCategory == catKey;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => setState(() => _selectedCategory = catKey),
        backgroundColor: AppColors.surface,
        selectedColor: AppColors.primary,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : AppColors.textSecondary,
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  // 2. Peshqadamlar Reytingi (Podium)
  Widget _buildLeaderboardTab() {
    final student = Provider.of<StudentProvider>(context);
    final user = Provider.of<AuthProvider>(context).user;

    if (student.isLoadingLeaderboard) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    final list = student.leaderboard;
    if (list.isEmpty) {
      return const Center(child: Text('Reyting ma\'lumotlari topilmadi', style: TextStyle(color: AppColors.textMuted)));
    }

    final first = list.isNotEmpty ? list[0] : null;
    final second = list.length > 1 ? list[1] : null;
    final third = list.length > 2 ? list[2] : null;

    return RefreshIndicator(
      onRefresh: () => student.fetchLeaderboard(),
      color: AppColors.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Top-3 Podium
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  // 2-o'rin (Kumush)
                  if (second != null) _buildPodiumStep(second, 2, 110, const Color(0xFF94A3B8)),
                  const SizedBox(width: 12),
                  // 1-o'rin (Oltin)
                  if (first != null) _buildPodiumStep(first, 1, 140, AppColors.coinGold),
                  const SizedBox(width: 12),
                  // 3-o'rin (Bronza)
                  if (third != null) _buildPodiumStep(third, 3, 90, const Color(0xFFD97706)),
                ],
              ),
            ),
          ),

          // Qolgan o'quvchilar ro'yxati
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final entry = list[index];
                  final isMe = entry.id == user?.id;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: GlassCard(
                      color: isMe ? AppColors.primary.withOpacity(0.12) : AppColors.card,
                      border: isMe ? Border.all(color: AppColors.primary, width: 1.5) : null,
                      child: Row(
                        children: [
                          Container(
                            width: 28,
                            alignment: Alignment.center,
                            child: Text(
                              '#${entry.rank}',
                              style: TextStyle(
                                color: isMe ? AppColors.primary : AppColors.textMuted,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          CircleAvatar(
                            backgroundColor: AppColors.surface,
                            radius: 18,
                            child: Text(
                              entry.name.isNotEmpty ? entry.name[0].toUpperCase() : 'U',
                              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  entry.name,
                                  style: TextStyle(
                                    color: isMe ? AppColors.primaryLight : AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  'Daraja ${entry.level}',
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '${entry.xp} XP',
                            style: const TextStyle(color: AppColors.coinGold, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                childCount: list.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPodiumStep(dynamic entry, int place, double height, Color medalColor) {
    return Column(
      children: [
        CircleAvatar(
          radius: place == 1 ? 26 : 22,
          backgroundColor: medalColor.withOpacity(0.2),
          child: Text(
            entry.name.isNotEmpty ? entry.name[0].toUpperCase() : 'U',
            style: TextStyle(color: medalColor, fontWeight: FontWeight.bold, fontSize: place == 1 ? 18 : 15),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          entry.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11),
        ),
        Text(
          '${entry.xp} XP',
          style: TextStyle(color: medalColor, fontWeight: FontWeight.bold, fontSize: 11),
        ),
        const SizedBox(height: 8),
        Container(
          width: 80,
          height: height,
          decoration: BoxDecoration(
            color: medalColor.withOpacity(0.15),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            border: Border.all(color: medalColor.withOpacity(0.4)),
          ),
          child: Center(
            child: Text(
              '$place',
              style: TextStyle(color: medalColor, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }
}
