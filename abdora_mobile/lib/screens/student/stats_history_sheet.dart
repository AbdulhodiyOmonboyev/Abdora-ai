import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/constants/app_colors.dart';

enum StatsHistoryType {
  coin, // Abdora tangalari
  exp,  // Tajriba ballari (EXP)
}

class StatsHistoryItem {
  final String id;
  final String title;
  final String category;
  final int amount;
  final bool isPositive;
  final DateTime date;
  final IconData icon;
  final Color iconColor;

  const StatsHistoryItem({
    required this.id,
    required this.title,
    required this.category,
    required this.amount,
    required this.isPositive,
    required this.date,
    required this.icon,
    required this.iconColor,
  });
}

class StatsHistorySheet {
  /// Tangalar tarixini ochish
  static void showCoinHistory(BuildContext context, {required dynamic user}) {
    show(context, type: StatsHistoryType.coin, user: user);
  }

  /// EXP tarixini ochish
  static void showExpHistory(BuildContext context, {required dynamic user}) {
    show(context, type: StatsHistoryType.exp, user: user);
  }

  /// Umumiy modal sheet ochish usuli
  static void show(
    BuildContext context, {
    required StatsHistoryType type,
    required dynamic user,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _StatsHistorySheetWidget(type: type, user: user),
    );
  }
}

class _StatsHistorySheetWidget extends StatefulWidget {
  final StatsHistoryType type;
  final dynamic user;

  const _StatsHistorySheetWidget({
    required this.type,
    required this.user,
  });

  @override
  State<_StatsHistorySheetWidget> createState() => _StatsHistorySheetWidgetState();
}

class _StatsHistorySheetWidgetState extends State<_StatsHistorySheetWidget> {
  int _selectedFilterIndex = 0;
  bool _isLoading = true;
  List<StatsHistoryItem> _items = [];
  int? _serverEarnedCoins;
  int? _serverSpentCoins;

  @override
  void initState() {
    super.initState();
    _fetchLiveHistory();
  }

  Future<void> _fetchLiveHistory() async {
    final userId = widget.user?.id?.toString() ?? '';
    if (userId.isEmpty) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final res = await ApiClient().dio.get(Endpoints.studentHistory(userId));
      if (res.statusCode == 200 && res.data != null && res.data['data'] != null) {
        final data = res.data['data'];
        final List? rawCoinHistory = data['coinHistory'] as List?;
        final List? rawExpHistory = data['expHistory'] as List?;

        final summary = data['summary'];
        if (summary != null) {
          _serverEarnedCoins = summary['totalCoinsEarned'] is int
              ? summary['totalCoinsEarned'] as int
              : int.tryParse(summary['totalCoinsEarned']?.toString() ?? '');
          _serverSpentCoins = summary['totalCoinsSpent'] is int
              ? summary['totalCoinsSpent'] as int
              : int.tryParse(summary['totalCoinsSpent']?.toString() ?? '');
        }

        final List<StatsHistoryItem> parsed = [];

        if (widget.type == StatsHistoryType.coin && rawCoinHistory != null) {
          for (var item in rawCoinHistory) {
            final String title = item['title']?.toString() ?? 'Amaliyot';
            final String typeStr = item['type']?.toString() ?? 'other';
            final int coins = (item['coins'] is int)
                ? item['coins'] as int
                : int.tryParse(item['coins']?.toString() ?? '0') ?? 0;
            final DateTime date = DateTime.tryParse(item['date']?.toString() ?? '') ?? DateTime.now();

            if (coins != 0) {
              parsed.add(StatsHistoryItem(
                id: item['id']?.toString() ?? '${DateTime.now().millisecondsSinceEpoch}_${parsed.length}',
                title: title,
                category: _getCategoryLabel(typeStr),
                amount: coins,
                isPositive: coins > 0,
                date: date,
                icon: _getCategoryIcon(typeStr),
                iconColor: coins > 0 ? AppColors.coinGold : Colors.redAccent,
              ));
            }
          }
        } else if (widget.type == StatsHistoryType.exp) {
          final targetList = (rawExpHistory != null && rawExpHistory.isNotEmpty)
              ? rawExpHistory
              : (rawCoinHistory ?? []);

          for (var item in targetList) {
            final String title = item['title']?.toString() ?? 'Faoliyat';
            final String typeStr = item['type']?.toString() ?? 'other';
            final int xp = (item['amount'] is int)
                ? item['amount'] as int
                : (item['xp'] is int
                    ? item['xp'] as int
                    : int.tryParse(item['xp']?.toString() ?? item['amount']?.toString() ?? '0') ?? 0);
            final DateTime date = DateTime.tryParse(item['date']?.toString() ?? '') ?? DateTime.now();

            if (xp > 0) {
              parsed.add(StatsHistoryItem(
                id: item['id']?.toString() ?? '${DateTime.now().millisecondsSinceEpoch}_${parsed.length}',
                title: title,
                category: item['category']?.toString() ?? _getCategoryLabel(typeStr),
                amount: xp,
                isPositive: true,
                date: date,
                icon: _getCategoryIcon(typeStr),
                iconColor: AppColors.secondary,
              ));
            }
          }
        }

        if (mounted) {
          setState(() {
            _items = parsed;
          });
        }
      }
    } catch (_) {
      // Offline yoki tarmoq xatoligida mavjud ro'yxat saqlanadi
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _getCategoryLabel(String type) {
    switch (type) {
      case 'game':
        return 'O\'yinlar';
      case 'test':
        return 'Test sinovi';
      case 'homework':
        return 'Uyga vazifa';
      case 'attendance':
        return 'Davomat';
      case 'purchase':
        return 'Do\'kon xaridi';
      case 'bonus':
        return 'Rag\'bat bonusi';
      case 'streak':
        return 'Kunlik seriya';
      default:
        return 'Faoliyat';
    }
  }

  IconData _getCategoryIcon(String type) {
    switch (type) {
      case 'game':
        return Icons.sports_esports_rounded;
      case 'test':
        return Icons.quiz_rounded;
      case 'homework':
        return Icons.assignment_turned_in_rounded;
      case 'attendance':
        return Icons.event_available_rounded;
      case 'purchase':
        return Icons.shopping_bag_rounded;
      case 'bonus':
        return Icons.stars_rounded;
      case 'streak':
        return Icons.local_fire_department_rounded;
      default:
        return Icons.auto_awesome_rounded;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    final String hour = date.hour.toString().padLeft(2, '0');
    final String minute = date.minute.toString().padLeft(2, '0');
    final String timeStr = '$hour:$minute';

    if (difference.inDays == 0 && now.day == date.day) {
      return 'Bugun, $timeStr';
    } else if (difference.inDays == 1 || (difference.inDays == 0 && now.day != date.day)) {
      return 'Kecha, $timeStr';
    } else {
      const monthNames = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
      ];
      final monthName = monthNames[date.month - 1];
      return '${date.day}-$monthName, $timeStr';
    }
  }

  List<StatsHistoryItem> get _filteredItems {
    if (widget.type == StatsHistoryType.coin) {
      switch (_selectedFilterIndex) {
        case 1:
          return _items.where((i) => i.isPositive).toList();
        case 2:
          return _items.where((i) => !i.isPositive).toList();
        default:
          return _items;
      }
    } else {
      switch (_selectedFilterIndex) {
        case 1:
          return _items.where((i) => i.category == 'Darslar' || i.category == 'O\'yinlar').toList();
        case 2:
          return _items.where((i) => i.category == 'Test sinovi' || i.category == 'Uyga vazifa').toList();
        case 3:
          return _items.where((i) => i.category == 'Rag\'bat bonusi' || i.category == 'Kunlik seriya').toList();
        default:
          return _items;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final isCoin = widget.type == StatsHistoryType.coin;
    final int userCoins = widget.user?.coins ?? 0;
    final int userXp = widget.user?.xp ?? 0;
    final int userLevel = widget.user?.level ?? 1;

    final primaryThemeColor = isCoin ? AppColors.coinGold : AppColors.primary;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollController) => Container(
        decoration: BoxDecoration(
          color: AppColors.cardBg(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
          border: Border(top: BorderSide(color: AppColors.borderCol(context), width: 1.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.45 : 0.12),
              blurRadius: 18,
              offset: const Offset(0, -6),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tortish chizig'i
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderCol(context),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Sarlavha paneli
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: primaryThemeColor.withOpacity(0.14),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: primaryThemeColor.withOpacity(0.35)),
                      ),
                      child: Icon(
                        isCoin ? Icons.monetization_on_rounded : Icons.bolt_rounded,
                        color: primaryThemeColor,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isCoin ? 'Tangalar tarixi' : 'EXP (Tajriba) tarixi',
                          style: TextStyle(
                            color: AppColors.text1(context),
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isCoin
                              ? 'Tushgan va sarflangan tangalar hisobi'
                              : 'Qo\'lga kiritilgan tajriba ballari',
                          style: TextStyle(
                            color: AppColors.text2(context),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(
                    Icons.close_rounded,
                    color: AppColors.text2(context),
                    size: 22,
                  ),
                  splashRadius: 20,
                  tooltip: 'Yopish',
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Asosiy ko'rsatkichlar kartasi (Hero Card)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isCoin
                      ? [
                          AppColors.coinGold.withOpacity(0.18),
                          AppColors.coinGold.withOpacity(0.06),
                        ]
                      : [
                          AppColors.primary.withOpacity(0.18),
                          AppColors.secondary.withOpacity(0.08),
                        ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: primaryThemeColor.withOpacity(0.35), width: 1.2),
              ),
              child: isCoin
                  ? _buildCoinSummary(context, userCoins)
                  : _buildExpSummary(context, userXp, userLevel),
            ),
            const SizedBox(height: 14),

            // Filtrlash tugmachalari
            _buildFilterTabs(context, isCoin),
            const SizedBox(height: 12),

            // Ro'yxat sarlavhasi
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Amallar tarixi',
                  style: TextStyle(
                    color: AppColors.text1(context),
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (_isLoading)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Text(
                    '${_filteredItems.length} ta yozuv',
                    style: TextStyle(
                      color: AppColors.text2(context),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),

            // Tranzaksiyalar ro'yxati
            Expanded(
              child: _isLoading
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 28,
                              height: 28,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: primaryThemeColor),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Ma\'lumotlar yuklanmoqda...',
                              style: TextStyle(color: AppColors.text2(context), fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _filteredItems.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.history_toggle_off_rounded,
                                  size: 46,
                                  color: AppColors.textM(context).withOpacity(0.5),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  isCoin
                                      ? 'Hozircha tangalar tarixi mavjud emas'
                                      : 'Hozircha tajriba (EXP) tarixi mavjud emas',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: AppColors.text1(context),
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  isCoin
                                      ? 'Darslarda qatnashish, testlar va o\'yinlar orqali tanga to\'plashingiz mumkin.'
                                      : 'Darslar va topshiriqlarni yakunlab yangi darajalarga ko\'tariling.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: AppColors.text2(context),
                                    fontSize: 12,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView.separated(
                          controller: scrollController,
                          physics: const BouncingScrollPhysics(),
                          itemCount: _filteredItems.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final item = _filteredItems[index];
                            return _buildHistoryItemRow(context, item, isCoin, index);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  /// Tanga xulosasi kartasi
  Widget _buildCoinSummary(BuildContext context, int userCoins) {
    int totalEarned = _serverEarnedCoins ?? 0;
    int totalSpent = _serverSpentCoins ?? 0;
    if (_serverEarnedCoins == null && _serverSpentCoins == null) {
      for (var item in _items) {
        if (item.isPositive) {
          totalEarned += item.amount;
        } else {
          totalSpent += item.amount.abs();
        }
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Mavjud hisob balansi',
              style: TextStyle(
                color: AppColors.text2(context),
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.coinGold.withOpacity(0.18),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified_rounded, size: 12, color: AppColors.coinGold),
                  SizedBox(width: 4),
                  Text(
                    'Faol hamyon',
                    style: TextStyle(
                      color: AppColors.coinGold,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              '$userCoins',
              style: TextStyle(
                color: AppColors.text1(context),
                fontSize: 28,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(width: 6),
            const Text(
              'tanga',
              style: TextStyle(
                color: AppColors.coinGold,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.cardBg(context),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.borderCol(context)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Row(
                children: [
                  const Icon(Icons.arrow_downward_rounded, size: 14, color: AppColors.success),
                  const SizedBox(width: 5),
                  Text(
                    'Kirim: +$totalEarned',
                    style: const TextStyle(
                      color: AppColors.success,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              Container(width: 1, height: 16, color: AppColors.borderCol(context)),
              Row(
                children: [
                  const Icon(Icons.arrow_upward_rounded, size: 14, color: Colors.redAccent),
                  const SizedBox(width: 5),
                  Text(
                    'Xaridlar: -$totalSpent',
                    style: const TextStyle(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// EXP xulosasi kartasi
  Widget _buildExpSummary(BuildContext context, int userXp, int userLevel) {
    final nextLevelXp = (userLevel * 500);
    final currentLevelProgress = (userXp % 500);
    final progressFraction = (currentLevelProgress / 500).clamp(0.0, 1.0);
    final remainingXp = 500 - currentLevelProgress;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Jami to\'plangan tajriba',
              style: TextStyle(
                color: AppColors.text2(context),
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.18),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.military_tech_rounded, size: 13, color: AppColors.primary),
                  const SizedBox(width: 3),
                  Text(
                    '$userLevel-daraja Bilimdon',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              '$userXp',
              style: TextStyle(
                color: AppColors.text1(context),
                fontSize: 28,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(width: 6),
            const Text(
              'EXP',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Progress bar
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: progressFraction,
            minHeight: 7,
            backgroundColor: AppColors.borderCol(context),
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '$currentLevelProgress / 500 EXP',
              style: TextStyle(
                color: AppColors.text2(context),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'Keyingi bosqichgacha $remainingXp EXP',
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Filtrlash tugmalari
  Widget _buildFilterTabs(BuildContext context, bool isCoin) {
    final List<String> labels = isCoin
        ? ['Barchasi', 'Tushumlar (+)', 'Xaridlar (-)']
        : ['Barchasi', 'O\'yin va Darslar', 'Test va Vazifalar', 'Bonuslar'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: labels.asMap().entries.map((entry) {
          final idx = entry.key;
          final label = entry.value;
          final isSelected = _selectedFilterIndex == idx;

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => setState(() => _selectedFilterIndex = idx),
              borderRadius: BorderRadius.circular(12),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: isSelected
                      ? (isCoin ? AppColors.coinGold : AppColors.primary)
                      : AppColors.borderCol(context).withOpacity(0.35),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppColors.text1(context),
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  /// Yozuv qatori kartochkasi
  Widget _buildHistoryItemRow(
    BuildContext context,
    StatsHistoryItem item,
    bool isCoin,
    int index,
  ) {
    final bool isIncome = item.isPositive;
    final Color badgeBg = isCoin
        ? (isIncome ? AppColors.success.withOpacity(0.12) : Colors.red.withOpacity(0.12))
        : AppColors.secondary.withOpacity(0.14);

    final Color badgeText = isCoin
        ? (isIncome ? AppColors.success : Colors.redAccent)
        : AppColors.secondary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: AppColors.cardBg(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderCol(context)),
      ),
      child: Row(
        children: [
          // Kategoriya belgisi
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: item.iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              item.icon,
              color: item.iconColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),

          // Sarlavha va sana
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppColors.text1(context),
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      item.category,
                      style: TextStyle(
                        color: AppColors.text2(context),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      '•',
                      style: TextStyle(color: AppColors.textM(context), fontSize: 10),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      _formatDate(item.date),
                      style: TextStyle(
                        color: AppColors.textM(context),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Miqdor nishoni (+15 tanga yoki +60 EXP)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: badgeBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              isCoin
                  ? (isIncome ? '+${item.amount} tanga' : '-${item.amount.abs()} tanga')
                  : '+${item.amount} EXP',
              style: TextStyle(
                color: badgeText,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    ).animate(delay: (index * 30).ms).fadeIn(duration: 200.ms).slideY(begin: 0.05, end: 0);
  }
}
