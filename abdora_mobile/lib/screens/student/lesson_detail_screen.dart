import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../models/lesson_model.dart';
import '../../models/student_models.dart';
import '../../providers/student_provider.dart';
import '../../widgets/glass_card.dart';

class LessonDetailScreen extends StatefulWidget {
  final LessonModel lesson;

  const LessonDetailScreen({super.key, required this.lesson});

  @override
  State<LessonDetailScreen> createState() => _LessonDetailScreenState();
}

class _LessonDetailScreenState extends State<LessonDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  LessonAiContent? _aiContent;
  bool _isLoading = true;

  // Flashcards state
  int _currentFlashcardIndex = 0;
  bool _isCardFlipped = false;

  // Quiz state
  int _quizScore = 0;
  final Map<int, int> _selectedQuizAnswers = {};

  // AI Chat state
  final TextEditingController _chatController = TextEditingController();
  final List<Map<String, String>> _chatMessages = [];

  final List<String> _tabs = [
    'Tushuntirish',
    'Mnemotika',
    'Hikoya',
    'Misollar',
    'Xulosa',
    'Flashcardlar',
    'AI Quiz',
    'Aql xaritasi',
    'AI Tyutor',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _loadLessonAi();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _chatController.dispose();
    super.dispose();
  }

  Future<void> _loadLessonAi() async {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final content = await studentProvider.fetchLessonAi(widget.lesson.id);
    if (mounted) {
      setState(() {
        _aiContent = content ?? LessonAiContent();
        _isLoading = false;
      });
    }
  }

  void _sendChatMessage() {
    final text = _chatController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _chatMessages.add({'role': 'user', 'text': text});
      _chatController.clear();
      // Simulyatsiya qilingan AI javobi
      _chatMessages.add({
        'role': 'ai',
        'text': '"${widget.lesson.title}" mavzusi bo\'yicha savolingiz qabul qilindi. AI javobi: Ushbu biologik jarayon tirik organizmlarning asosiy hayotiy faoliyati hisoblanadi.',
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.lesson.title),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildSimpleExplanationTab(),
                _buildMnemonicsTab(),
                _buildStoryTab(),
                _buildExamplesTab(),
                _buildSummaryTab(),
                _buildFlashcardsTab(),
                _buildQuizTab(),
                _buildMindMapTab(),
                _buildAiChatTab(),
              ],
            ),
    );
  }

  // 1. Soddalashtirilgan tushuntirish
  Widget _buildSimpleExplanationTab() {
    final text = _aiContent?.simpleExplanation.isNotEmpty == true
        ? _aiContent!.simpleExplanation
        : (widget.lesson.content ?? 'Ushbu dars bo\'yicha batafsil materiallar tayyorlanmoqda.');

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.auto_awesome_rounded, color: AppColors.primary, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'AI Tushuntirishi (Oddiy tilda)',
                      style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  text,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 2. Mnemotika
  Widget _buildMnemonicsTab() {
    final text = _aiContent?.mnemonics.isNotEmpty == true
        ? _aiContent!.mnemonics
        : 'Eslab qolish uchun maxsus qoidalar mavjud emas.';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.lightbulb_outline_rounded, color: AppColors.coinGold, size: 22),
                SizedBox(width: 8),
                Text(
                  'Yodda Saqlash Qoidalari (Mnemotika)',
                  style: TextStyle(color: AppColors.coinGold, fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              text,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }

  // 3. Hikoya
  Widget _buildStoryTab() {
    final text = _aiContent?.storyMode.isNotEmpty == true
        ? _aiContent!.storyMode
        : 'Mavzu bo\'yicha ilmiy hikoya tuzilmoqda.';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.menu_book_rounded, color: AppColors.accentPurple, size: 22),
                SizedBox(width: 8),
                Text(
                  'Hikoya Ko\'rinishida',
                  style: TextStyle(color: AppColors.accentPurple, fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              text,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }

  // 4. Misollar
  Widget _buildExamplesTab() {
    final examples = _aiContent?.realLifeExamples ?? [];
    if (examples.isEmpty) {
      return const Center(child: Text('Hayotiy misollar mavjud emas', style: TextStyle(color: AppColors.textMuted)));
    }

    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: examples.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final ex = examples[index];
        return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                ex['title'] ?? 'Misol',
                style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 6),
              Text(
                ex['desc'] ?? '',
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.5),
              ),
            ],
          ),
        );
      },
    );
  }

  // 5. Xulosa
  Widget _buildSummaryTab() {
    final summary = _aiContent?.summary ?? [];
    if (summary.isEmpty) {
      return const Center(child: Text('Xulosa tayyorlanmoqda', style: TextStyle(color: AppColors.textMuted)));
    }

    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: summary.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        return GlassCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  summary[index],
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.4),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // 6. Flashcardlar
  Widget _buildFlashcardsTab() {
    final cards = _aiContent?.flashcards ?? [];
    if (cards.isEmpty) {
      return const Center(child: Text('Flashcardlar mavjud emas', style: TextStyle(color: AppColors.textMuted)));
    }

    final card = cards[_currentFlashcardIndex];

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Karta ${_currentFlashcardIndex + 1} / ${cards.length}',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () => setState(() => _isCardFlipped = !_isCardFlipped),
            child: Container(
              width: double.infinity,
              height: 240,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: _isCardFlipped ? AppColors.surface : AppColors.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _isCardFlipped ? AppColors.primary : AppColors.border,
                  width: 1.5,
                ),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _isCardFlipped ? 'JAVOB' : 'SAVOL (Bosib aylantiring)',
                      style: TextStyle(
                        color: _isCardFlipped ? AppColors.primary : AppColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      _isCardFlipped ? card.back : card.front,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                onPressed: _currentFlashcardIndex > 0
                    ? () => setState(() {
                          _currentFlashcardIndex--;
                          _isCardFlipped = false;
                        })
                    : null,
                icon: const Icon(Icons.arrow_back_ios_rounded, color: AppColors.textPrimary),
              ),
              const SizedBox(width: 32),
              IconButton(
                onPressed: _currentFlashcardIndex < cards.length - 1
                    ? () => setState(() {
                          _currentFlashcardIndex++;
                          _isCardFlipped = false;
                        })
                    : null,
                icon: const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textPrimary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 7. AI Quiz
  Widget _buildQuizTab() {
    final quiz = _aiContent?.quizQuestions ?? [];
    if (quiz.isEmpty) {
      return const Center(child: Text('Quiz savollari mavjud emas', style: TextStyle(color: AppColors.textMuted)));
    }

    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: quiz.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, qIndex) {
        final q = quiz[qIndex];
        final selectedAnswer = _selectedQuizAnswers[qIndex];

        return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${qIndex + 1}. ${q.question}',
                style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 12),
              ...List.generate(q.options.length, (optIndex) {
                final isSelected = selectedAnswer == optIndex;
                final isCorrect = q.correctIndex == optIndex;

                Color tileColor = AppColors.surface;
                Color borderColor = AppColors.border;

                if (selectedAnswer != null) {
                  if (isCorrect) {
                    tileColor = AppColors.success.withOpacity(0.15);
                    borderColor = AppColors.success;
                  } else if (isSelected) {
                    tileColor = AppColors.danger.withOpacity(0.15);
                    borderColor = AppColors.danger;
                  }
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: selectedAnswer == null
                        ? () {
                            setState(() {
                              _selectedQuizAnswers[qIndex] = optIndex;
                              if (optIndex == q.correctIndex) _quizScore += 10;
                            });
                          }
                        : null,
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: tileColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              q.options[optIndex],
                              style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                            ),
                          ),
                          if (selectedAnswer != null && isCorrect)
                            const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              if (selectedAnswer != null && q.explanation.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Izoh: ${q.explanation}',
                  style: const TextStyle(color: AppColors.primaryLight, fontSize: 11),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  // 8. Aql xaritasi
  Widget _buildMindMapTab() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
            ),
            child: Text(
              widget.lesson.title,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ),
          const SizedBox(height: 20),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Bog\'liq Tushunchalar va Bo\'limlar',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                ),
                SizedBox(height: 12),
                Text('• Hujayraviy tuzilish va moddalar almashinuvi', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
                Text('• Energiya hosil bo\'lish jarayoni', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
                Text('• Kimyoviy reaksiyalar va fermentlar ta\'siri', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
                Text('• Organizmning atrof-muhit bilan aloqasi', style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 9. AI Tyutor
  Widget _buildAiChatTab() {
    return Column(
      children: [
        Expanded(
          child: _chatMessages.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.smart_toy_outlined, color: AppColors.primary, size: 44),
                        SizedBox(height: 12),
                        Text(
                          'Dars bo\'yicha savolingiz bormi?',
                          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        SizedBox(height: 6),
                        Text(
                          'AI Tyutorga savol bering, u sizga mavzuni sodda tilda tushuntirib beradi.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: _chatMessages.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final msg = _chatMessages[index];
                    final isUser = msg['role'] == 'user';

                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        constraints: BoxConstraints(maxWidth: context.screenWidth * 0.78),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isUser ? AppColors.primary : AppColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: isUser ? AppColors.primary : AppColors.border),
                        ),
                        child: Text(
                          msg['text'] ?? '',
                          style: TextStyle(
                            color: isUser ? Colors.white : AppColors.textPrimary,
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
        Container(
          padding: EdgeInsets.fromLTRB(16, 8, 16, context.bottomSafeArea > 0 ? context.bottomSafeArea : 12),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _chatController,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'Savolingizni yozing...',
                    hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
                    border: InputBorder.none,
                  ),
                  onSubmitted: (_) => _sendChatMessage(),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.send_rounded, color: AppColors.primary),
                onPressed: _sendChatMessage,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
