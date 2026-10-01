import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/glass_card.dart';

class TeacherMonitorScreen extends StatefulWidget {
  const TeacherMonitorScreen({super.key});

  @override
  State<TeacherMonitorScreen> createState() => _TeacherMonitorScreenState();
}

class _TeacherMonitorScreenState extends State<TeacherMonitorScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String _selectedFilter = 'Barchasi'; // Barchasi, Juftliklar, Blitz, Duellar

  // O'quvchilar faolligi ma'lumotlari
  List<Map<String, dynamic>> _activities = [];
  Map<String, dynamic> _summary = {
    'totalGames': 0,
    'totalDuels': 0,
    'avgScore': 0,
    'totalStudents': 0,
  };
  List<Map<String, dynamic>> _topLearners = [];

  final List<String> _filterTabs = ['Barchasi', 'Juftliklar', 'Blitz', 'Duellar'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchGameActivities();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchGameActivities() async {
    setState(() => _isLoading = true);

    try {
      final res = await ApiClient().dio.get(Endpoints.teacherGameActivities);
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data['data'] ?? res.data;
        if (mounted) {
          setState(() {
            _summary = data['summary'] ?? _summary;
            _activities = List<Map<String, dynamic>>.from(data['recentActivities'] ?? []);
            _topLearners = List<Map<String, dynamic>>.from(data['topLearners'] ?? []);
            _isLoading = false;
          });
          return;
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        backgroundColor: AppColors.cardBg(context),
        elevation: 0,
        title: Text(
          'O\'qituvchi Nazorati',
          style: TextStyle(
            color: AppColors.text1(context),
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.of(context)),
            tooltip: 'Yangilash',
            onPressed: _fetchGameActivities,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.of(context),
          labelColor: AppColors.of(context),
          unselectedLabelColor: AppColors.textM(context),
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'Jonli Faollik'),
            Tab(text: 'Yetakchilar'),
            Tab(text: 'Mavzular'),
          ],
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.of(context)))
          : RefreshIndicator(
              onRefresh: _fetchGameActivities,
              color: AppColors.of(context),
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildLiveActivityTab(),
                  _buildLeaderboardTab(),
                  _buildTopicMasteryTab(),
                ],
              ),
            ),
    );
  }

  // 1. JONLI FAOLLIK TABI
  Widget _buildLiveActivityTab() {
    final filtered = _activities.where((a) {
      if (_selectedFilter == 'Barchasi') return true;
      if (_selectedFilter == 'Juftliklar') return (a['gameType'] ?? '').toString().contains('Juftlik');
      if (_selectedFilter == 'Blitz') return (a['gameType'] ?? '').toString().contains('Blitz');
      if (_selectedFilter == 'Duellar') return a['mode'] == 'duel';
      return true;
    }).toList();

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Nazorat xulosasi paneli
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  'O\'yinlar soni',
                  '${_summary['totalGames']}',
                  Icons.sports_esports_rounded,
                  AppColors.of(context),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricCard(
                  'Duellar',
                  '${_summary['totalDuels']}',
                  Icons.people_alt_rounded,
                  const Color(0xFF7C3AED),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricCard(
                  'O\'rtacha ball',
                  '${_summary['avgScore']}',
                  Icons.stars_rounded,
                  AppColors.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Filtrlash chiplari
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filterTabs.map((filter) {
                final isSelected = _selectedFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(
                      filter,
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppColors.text2(context),
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppColors.of(context),
                    backgroundColor: AppColors.cardBg(context),
                    onSelected: (_) => setState(() => _selectedFilter = filter),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 14),

          Text(
            'O\'quvchilarning so\'nggi o\'yin natijalari (${filtered.length}):',
            style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 10),

          // Faolliklar ro'yxati
          ...filtered.map((act) {
            final isDuel = act['mode'] == 'duel';
            final studentName = act['studentName'] ?? 'O\'quvchi';
            final topic = act['topicTitle'] ?? 'Mavzu';
            final score = act['score'] ?? 0;
            final isWon = act['isWon'] == true;
            final opponent = act['opponentName'];

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              child: GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: (isDuel ? const Color(0xFF7C3AED) : AppColors.of(context)).withOpacity(0.15),
                          child: Text(
                            studentName.substring(0, 1),
                            style: TextStyle(
                              color: isDuel ? const Color(0xFF7C3AED) : AppColors.of(context),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                studentName,
                                style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 13.5),
                              ),
                              Text(
                                isDuel ? 'Guruhdosh bilan bellashuv' : 'Mustaqil o\'rganish (Yakka)',
                                style: TextStyle(color: AppColors.textM(context), fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '+$score ball',
                            style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.inputCol(context),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.borderCol(context)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                isDuel ? Icons.people_alt_rounded : Icons.extension_rounded,
                                size: 14,
                                color: AppColors.of(context),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  topic,
                                  style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.w600, fontSize: 12.5),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          if (isDuel && opponent != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Raqib: $opponent • Natija: ${isWon ? "Gʻalaba qozondi" : "Teng kurash"}',
                              style: TextStyle(color: isWon ? AppColors.success : AppColors.text2(context), fontSize: 11.5),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // 2. YETAKCHILAR TABI
  Widget _buildLeaderboardTab() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _topLearners.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final learner = _topLearners[index];
        final name = learner['name'] ?? '';
        final games = learner['gamesCount'] ?? 0;
        final duels = learner['duelsWon'] ?? 0;
        final score = learner['totalGameScore'] ?? 0;

        return GlassCard(
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: index == 0
                      ? Colors.amber.withOpacity(0.2)
                      : index == 1
                          ? Colors.grey.withOpacity(0.2)
                          : index == 2
                              ? Colors.brown.withOpacity(0.2)
                              : AppColors.inputCol(context),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: TextStyle(
                      color: index == 0
                          ? Colors.amber.shade700
                          : index == 1
                              ? Colors.grey.shade700
                              : index == 2
                                  ? Colors.brown
                                  : AppColors.text2(context),
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$games ta o\'yin • $duels ta duel g\'olibi',
                      style: TextStyle(color: AppColors.textM(context), fontSize: 11.5),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '$score ball',
                    style: TextStyle(color: AppColors.of(context), fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  Text(
                    'O\'yin faolligi',
                    style: TextStyle(color: AppColors.textM(context), fontSize: 10),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // 3. MAVZULAR BO'YICHA O'ZLASHTIRISH TABI
  Widget _buildTopicMasteryTab() {
    final Map<String, Map<String, dynamic>> topicStats = {};
    for (final act in _activities) {
      final title = act['topicTitle']?.toString() ?? '';
      if (title.isEmpty) continue;
      if (!topicStats.containsKey(title)) {
        topicStats[title] = {
          'title': title,
          'players': <String>{},
          'games': 0,
          'totalScore': 0,
        };
      }
      topicStats[title]!['games'] = (topicStats[title]!['games'] as int) + 1;
      topicStats[title]!['totalScore'] = (topicStats[title]!['totalScore'] as int) + ((act['score'] as num?)?.toInt() ?? 0);
      final student = act['studentName']?.toString();
      if (student != null) {
        (topicStats[title]!['players'] as Set<String>).add(student);
      }
    }

    final topics = topicStats.values.map((stat) {
      final games = stat['games'] as int;
      final avg = games > 0 ? ((stat['totalScore'] as int) / games).round() : 0;
      final mastery = avg.clamp(0, 100);
      return {
        'title': stat['title'] as String,
        'players': (stat['players'] as Set<String>).length,
        'mastery': mastery,
        'games': games,
      };
    }).toList();

    if (topics.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.auto_graph_rounded, size: 48, color: AppColors.textM(context)),
              const SizedBox(height: 12),
              Text(
                'Hozircha mavzular statistikasi mavjud emas',
                style: TextStyle(color: AppColors.text2(context), fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: topics.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = topics[index];
        final mastery = item['mastery'] as int;

        return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      item['title'] as String,
                      style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.of(context).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '$mastery% o\'zlashtirish',
                      style: TextStyle(color: AppColors.of(context), fontWeight: FontWeight.bold, fontSize: 11.5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: mastery / 100,
                  backgroundColor: AppColors.inputCol(context),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    mastery >= 90 ? AppColors.success : mastery >= 80 ? AppColors.of(context) : Colors.orange,
                  ),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${item['players']} nafar o\'quvchi o\'ynadi',
                    style: TextStyle(color: AppColors.text2(context), fontSize: 11.5),
                  ),
                  Text(
                    '${item['games']} marta takrorlangan',
                    style: TextStyle(color: AppColors.textM(context), fontSize: 11.5),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.cardBg(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderCol(context)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(color: AppColors.textM(context), fontSize: 10),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
