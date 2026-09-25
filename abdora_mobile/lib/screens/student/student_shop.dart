import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/shop_provider.dart';
import '../../widgets/glass_card.dart';

class StudentShopScreen extends StatefulWidget {
  const StudentShopScreen({super.key});

  @override
  State<StudentShopScreen> createState() => _StudentShopScreenState();
}

class _StudentShopScreenState extends State<StudentShopScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<ShopProvider>(context, listen: false).fetchItems();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final shopProvider = Provider.of<ShopProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Tangalar Do\'koni'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              children: [
                const Icon(Icons.monetization_on_rounded, color: AppColors.coinGold, size: 20),
                const SizedBox(width: 6),
                Text(
                  '${user?.coins ?? 0}',
                  style: const TextStyle(
                    color: AppColors.coinGold,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => shopProvider.fetchItems(),
        color: AppColors.primary,
        child: shopProvider.isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : shopProvider.items.isEmpty
                ? const Center(
                    child: Text(
                      'Hozircha sotuvda mahsulotlar yo\'q',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                      childAspectRatio: 0.78,
                    ),
                    itemCount: shopProvider.items.length,
                    itemBuilder: (context, index) {
                      final item = shopProvider.items[index];
                      final canAfford = (user?.coins ?? 0) >= item.priceCoins;

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
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Center(
                                  child: Icon(
                                    Icons.card_giftcard_rounded,
                                    size: 38,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
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
                            const SizedBox(height: 4),
                            Text(
                              item.description,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 11,
                              ),
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
                                      style: const TextStyle(
                                        color: AppColors.coinGold,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                                InkWell(
                                  onTap: canAfford
                                      ? () async {
                                          final success = await shopProvider.buyItem(item.id);
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(
                                                content: Text(success ? 'Buyurtma qabul qilindi!' : 'Xaridda xatolik'),
                                                backgroundColor: success ? AppColors.success : AppColors.danger,
                                              ),
                                            );
                                          }
                                        }
                                      : null,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: canAfford ? AppColors.primary : AppColors.surface,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      'Olish',
                                      style: TextStyle(
                                        color: canAfford ? Colors.white : AppColors.textMuted,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
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
                  ),
      ),
    );
  }
}
