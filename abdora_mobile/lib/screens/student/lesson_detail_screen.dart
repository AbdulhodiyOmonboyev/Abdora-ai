import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../models/lesson_model.dart';
import '../../models/student_models.dart';
import '../../providers/student_provider.dart';
import '../../widgets/glass_card.dart';
import 'games/interactive_game_screen.dart';

class LessonDetailScreen extends StatefulWidget {
  final LessonModel lesson;

  const LessonDetailScreen({super.key, required this.lesson});

  @override
  State<LessonDetailScreen> createState() => _LessonDetailScreenState();
}

class _LessonDetailScreenState extends State<LessonDetailScreen> {
  LessonAiContent? _aiContent;
  bool _isLoading = true;

  // Tanlangan o'rganish usuli (null bo'lsa tanlov kartalari ko'rinadi)
  int? _selectedMethodIndex;

  // Flashcards holati
  int _currentFlashcardIndex = 0;
  bool _isCardFlipped = false;
  final Set<int> _rememberedCards = {};

  // Quiz holati
  int _quizScore = 0;
  final Map<int, int> _selectedQuizAnswers = {};

  // AI Chat holati
  final TextEditingController _chatController = TextEditingController();
  final List<Map<String, String>> _chatMessages = [];

  // 10 ta zamonaviy o'rganish turi
  final List<Map<String, dynamic>> _learningMethods = const [
    {
      'title': 'Sodda Tushuntirish',
      'subtitle': 'Murakkab tushunchalar oddiy xalq tilida',
      'icon': Icons.menu_book_rounded,
      'color': Color(0xFF2563EB), // Ko'k
    },
    {
      'title': 'Mnemotika va Qoidalar',
      'subtitle': 'Eslab qolish formulalari va qoidalari',
      'icon': Icons.psychology_rounded,
      'color': Color(0xFFD97706), // Sariq/Qahrabo
    },
    {
      'title': 'Interaktiv Hikoya',
      'subtitle': 'Qiziqarli hayotiy voqea orqali o\'rganish',
      'icon': Icons.auto_stories_rounded,
      'color': Color(0xFF7C3AED), // Binafsha
    },
    {
      'title': 'Hayotiy Misollar',
      'subtitle': 'Kundalik turmush va amaliyotdagi o\'rni',
      'icon': Icons.lightbulb_rounded,
      'color': Color(0xFF059669), // Yashil
    },
    {
      'title': '3D Flashcardlar',
      'subtitle': 'Animatsiyali aylanuvchi xotira kartalari',
      'icon': Icons.flip_to_back_rounded,
      'color': Color(0xFF4F46E5), // Indigo
    },
    {
      'title': 'AI Viktorina (Quiz)',
      'subtitle': 'Tezkor sinov va bilimlarni mustahkamlash',
      'icon': Icons.quiz_rounded,
      'color': Color(0xFFEA580C), // To'q sariq
    },
    {
      'title': 'Aql Xaritasi (Mind Map)',
      'subtitle': 'Ierarxik tuzilma va mantiqiy bog\'liqliklar',
      'icon': Icons.hub_rounded,
      'color': Color(0xFF0891B2), // Tsian
    },
    {
      'title': 'AI Shaxsiy Tyutor',
      'subtitle': 'Mavzu bo\'yicha cheksiz savol-javob',
      'icon': Icons.smart_toy_rounded,
      'color': Color(0xFFDB2777), // Pushti
    },
    {
      'title': 'Mavzu O\'yini (Interaktiv)',
      'subtitle': 'Juftlash, Blitz va xotira mini-o\'yinlari',
      'icon': Icons.sports_esports_rounded,
      'color': Color(0xFF0D9488), // Zumrad
    },
    {
      'title': 'Guruhdoshlar Bilan Bellashuv',
      'subtitle': 'Guruhdoshlar bilan onlayn bellashuv va duel',
      'icon': Icons.people_alt_rounded,
      'color': Color(0xFF9333EA), // Qirmizi
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadLessonAi();
  }

  @override
  void dispose() {
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

  void _sendChatMessage([String? predefinedText]) {
    final text = predefinedText ?? _chatController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _chatMessages.add({'role': 'user', 'text': text});
      if (predefinedText == null) _chatController.clear();

      String aiAnswer;
      final lower = text.toLowerCase();
      if (lower.contains('farq') || lower.contains('asosiy')) {
        aiAnswer = '"${widget.lesson.title}" mavzusining asosiy farqi va mohiyati: Biri ma\'lum harakatning sababini bildirish uchun xizmat qilsa, ikkinchisi qat\'iy inkor yoki tasdiq funksiyasini bajaradi. Misollarda buni aniq ko\'rish mumkin.';
      } else if (lower.contains('xato') || lower.contains('ehtiyot')) {
        aiAnswer = 'Ko\'p uchraydigan asosiy xato: Belgilarning o\'xshashligiga aldanib, ularning kontekstdagi vazifasini unutib qo\'yishdir. Doimo gapdagi ma\'no mantiqiga e\'tibor qarating.';
      } else {
        aiAnswer = '"${widget.lesson.title}" bo\'yicha savolingiz tushunarli. AI tahlili: Mavzuni yaxshiroq tushunish uchun Flashcardlar va amaliy Quiz savollaridan foydalanishingizni tavsiya qilaman.';
      }

      _chatMessages.add({'role': 'ai', 'text': aiAnswer});
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        backgroundColor: AppColors.cardBg(context),
        elevation: 0,
        title: Text(
          widget.lesson.title,
          style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 16),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        leading: IconButton(
          icon: Icon(
            _selectedMethodIndex != null ? Icons.arrow_back_rounded : Icons.arrow_back_ios_new_rounded,
            color: AppColors.text1(context),
          ),
          onPressed: () {
            if (_selectedMethodIndex != null) {
              setState(() {
                _selectedMethodIndex = null;
              });
            } else {
              Navigator.pop(context);
            }
          },
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.of(context)))
          : _selectedMethodIndex == null
              ? _buildMethodsSelectionGrid()
              : _buildActiveMethodView(),
    );
  }

  // 1. O'RGANISH USULLARI TANLOV TO'RI (GRID)
  Widget _buildMethodsSelectionGrid() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dars sarlavhasi kartasi
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.of(context).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Interaktiv Darslik',
                        style: TextStyle(
                          color: AppColors.of(context),
                          fontWeight: FontWeight.bold,
                          fontSize: 11.5,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        Icon(Icons.auto_awesome_rounded, color: AppColors.of(context), size: 14),
                        const SizedBox(width: 4),
                        Text(
                          '10 xil usul',
                          style: TextStyle(color: AppColors.of(context), fontSize: 11.5, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  widget.lesson.title,
                  style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 17),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.lesson.content != null && widget.lesson.content!.isNotEmpty
                      ? widget.lesson.content!
                      : 'O\'zingizga mos bo\'lgan o\'rganish usulini tanlang va bilimlarni o\'yinlar yordamida mustahkamlang.',
                  style: TextStyle(color: AppColors.text2(context), fontSize: 12.5, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Sarlavha: O'rganish turini tanlang
          Text(
            'O\'zingizga mos o\'rganish turini tanlang:',
            style: TextStyle(
              color: AppColors.text1(context),
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Har bir usul darsni tushunishni oson va qiziqarli qiladi',
            style: TextStyle(color: AppColors.textM(context), fontSize: 12),
          ),
          const SizedBox(height: 14),

          // 2 ustunli kartalar to'ri
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: Responsive.isTablet(context) ? 3 : 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.92,
            ),
            itemCount: _learningMethods.length,
            itemBuilder: (context, index) {
              final method = _learningMethods[index];
              final color = method['color'] as Color;

              return InkWell(
                onTap: () {
                  if (index == 8) {
                    // Mavzu O'yini
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => InteractiveGameScreen(
                          topicTitle: widget.lesson.title,
                          topicDescription: widget.lesson.content,
                          aiContent: _aiContent,
                          initialGameMode: GameMode.solo,
                        ),
                      ),
                    );
                  } else if (index == 9) {
                    // Guruhdosh bilan bellashuv
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => InteractiveGameScreen(
                          topicTitle: widget.lesson.title,
                          topicDescription: widget.lesson.content,
                          aiContent: _aiContent,
                          initialGameMode: GameMode.duel,
                        ),
                      ),
                    );
                  } else {
                    setState(() {
                      _selectedMethodIndex = index;
                    });
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.cardBg(context),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.borderCol(context)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.14),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(method['icon'] as IconData, color: color, size: 22),
                      ),
                      const Spacer(),
                      Text(
                        method['title'] as String,
                        style: TextStyle(
                          color: AppColors.text1(context),
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 5),
                      Text(
                        method['subtitle'] as String,
                        style: TextStyle(
                          color: AppColors.textM(context),
                          fontSize: 11,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // 2. TANLANGAN USUL KO'RINISHI
  Widget _buildActiveMethodView() {
    final method = _learningMethods[_selectedMethodIndex!];
    final color = method['color'] as Color;

    return Column(
      children: [
        // Yuqori qaytish va rejim sarlavhasi
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.cardBg(context),
            border: Border(bottom: BorderSide(color: AppColors.borderCol(context))),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(method['icon'] as IconData, color: color, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      method['title'] as String,
                      style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    Text(
                      method['subtitle'] as String,
                      style: TextStyle(color: AppColors.textM(context), fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              TextButton.icon(
                onPressed: () {
                  setState(() {
                    _selectedMethodIndex = null;
                  });
                },
                icon: const Icon(Icons.grid_view_rounded, size: 14),
                label: const Text('Boshqasi', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),

        // Tanlangan rejim mazmuni
        Expanded(
          child: _buildSelectedContent(_selectedMethodIndex!),
        ),
      ],
    );
  }

  Widget _buildSelectedContent(int index) {
    switch (index) {
      case 0:
        return _buildSimpleExplanationView();
      case 1:
        return _buildMnemonicsView();
      case 2:
        return _buildStoryView();
      case 3:
        return _buildExamplesView();
      case 4:
        return _buildFlashcardsView();
      case 5:
        return _buildQuizView();
      case 6:
        return _buildMindMapView();
      case 7:
        return _buildAiChatView();
      default:
        return _buildSimpleExplanationView();
    }
  }

  // 1. Soddalashtirilgan tushuntirish
  Widget _buildSimpleExplanationView() {
    final text = _aiContent?.simpleExplanation.isNotEmpty == true
        ? _aiContent!.simpleExplanation
        : (widget.lesson.content ?? 'Ushbu dars bo\'yicha batafsil soddalashtirilgan tushuntirish tayyorlanmoqda.');

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.menu_book_rounded, color: AppColors.of(context), size: 20),
                const SizedBox(width: 8),
                Text(
                  'Mavzu Mohiyati (Sodda tilda)',
                  style: TextStyle(color: AppColors.of(context), fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              text,
              style: TextStyle(color: AppColors.text1(context), fontSize: 14.5, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }

  // 2. Mnemotika
  Widget _buildMnemonicsView() {
    final text = _aiContent?.mnemonics.isNotEmpty == true
        ? _aiContent!.mnemonics
        : 'Eslab qolish formulasi: Har bir atamani o\'zining bosh harfi va hayotiy vazifasi bilan bog\'lab esda saqlang.';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.psychology_rounded, color: Colors.amber, size: 22),
                SizedBox(width: 8),
                Text(
                  'Yodda Saqlash Qoidalari (Mnemotika)',
                  style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              text,
              style: TextStyle(color: AppColors.text1(context), fontSize: 14.5, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }

  // 3. Hikoya ko'rinishi
  Widget _buildStoryView() {
    final text = _aiContent?.storyMode.isNotEmpty == true
        ? _aiContent!.storyMode
        : 'Bir kuni qadimgi olimlar va talabalar ushbu qoidani amalda qo\'llash jarayonida qiziqarli holatga duch kelishdi... Hikoya darsning har bir qismini mantiqiy voqealar tizimi bilan bog\'laydi.';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.auto_stories_rounded, color: Color(0xFF7C3AED), size: 22),
                SizedBox(width: 8),
                Text(
                  'Mavzu Bo\'yicha Hikoya',
                  style: TextStyle(color: Color(0xFF7C3AED), fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              text,
              style: TextStyle(color: AppColors.text1(context), fontSize: 14.5, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }

  // 4. Misollar
  Widget _buildExamplesView() {
    final examples = _aiContent?.realLifeExamples ?? [];
    if (examples.isEmpty) {
      return Center(
        child: Text('Amaliy misollar tayyorlanmoqda', style: TextStyle(color: AppColors.textM(context))),
      );
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
                ex['title'] ?? 'Misol ${index + 1}',
                style: TextStyle(color: AppColors.of(context), fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 6),
              Text(
                ex['desc'] ?? '',
                style: TextStyle(color: AppColors.text1(context), fontSize: 13.5, height: 1.5),
              ),
            ],
          ),
        );
      },
    );
  }

  // 5. 3D FLASHCARDLAR
  Widget _buildFlashcardsView() {
    final cards = _aiContent?.flashcards ?? [];
    if (cards.isEmpty) {
      return Center(
        child: Text('Ushbu dars uchun Flashcardlar tayyorlanmoqda', style: TextStyle(color: AppColors.textM(context))),
      );
    }

    final card = cards[_currentFlashcardIndex];
    final isRemembered = _rememberedCards.contains(_currentFlashcardIndex);

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Karta ${_currentFlashcardIndex + 1} / ${cards.length}',
                style: TextStyle(color: AppColors.textM(context), fontSize: 13, fontWeight: FontWeight.bold),
              ),
              Text(
                'Eslab qolingan: ${_rememberedCards.length}',
                style: const TextStyle(color: AppColors.success, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: (_currentFlashcardIndex + 1) / cards.length,
              backgroundColor: AppColors.inputCol(context),
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.of(context)),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 24),

          // 3D Animatsiyali Karta
          GestureDetector(
            onTap: () => setState(() => _isCardFlipped = !_isCardFlipped),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeInOut,
              width: double.infinity,
              height: 240,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: _isCardFlipped ? AppColors.surfaceCol(context) : AppColors.cardBg(context),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: _isCardFlipped ? AppColors.of(context) : AppColors.borderCol(context),
                  width: 1.8,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.of(context).withOpacity(_isCardFlipped ? 0.15 : 0.05),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _isCardFlipped ? 'JAVOB' : 'SAVOL (Bosib aylantiring)',
                      style: TextStyle(
                        color: _isCardFlipped ? AppColors.of(context) : AppColors.textM(context),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _isCardFlipped ? card.back : card.front,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.text1(context),
                        fontSize: 16.5,
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

          // Eslab qoldim / Takrorlash tugmasi
          ElevatedButton.icon(
            onPressed: () {
              setState(() {
                if (isRemembered) {
                  _rememberedCards.remove(_currentFlashcardIndex);
                } else {
                  _rememberedCards.add(_currentFlashcardIndex);
                }
              });
            },
            icon: Icon(isRemembered ? Icons.check_circle_rounded : Icons.bookmark_add_outlined, size: 18),
            label: Text(isRemembered ? 'Eslab qolindi' : 'Eslab qoldim deb belgilash'),
            style: ElevatedButton.styleFrom(
              backgroundColor: isRemembered ? AppColors.success : AppColors.of(context),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 16),

          // Oldingi va Keyingi tugmalari
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
                icon: Icon(Icons.arrow_back_ios_rounded, color: AppColors.text1(context)),
              ),
              const SizedBox(width: 32),
              IconButton(
                onPressed: _currentFlashcardIndex < cards.length - 1
                    ? () => setState(() {
                          _currentFlashcardIndex++;
                          _isCardFlipped = false;
                        })
                    : null,
                icon: Icon(Icons.arrow_forward_ios_rounded, color: AppColors.text1(context)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 6. AI VIKTORINA (QUIZ)
  Widget _buildQuizView() {
    final quiz = _aiContent?.quizQuestions ?? [];
    if (quiz.isEmpty) {
      return Center(
        child: Text('Viktorina savollari tayyorlanmoqda', style: TextStyle(color: AppColors.textM(context))),
      );
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
                style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 12),
              ...List.generate(q.options.length, (optIndex) {
                final isSelected = selectedAnswer == optIndex;
                final isCorrect = q.correctIndex == optIndex;

                Color tileColor = AppColors.surfaceCol(context);
                Color borderColor = AppColors.borderCol(context);

                if (selectedAnswer != null) {
                  if (isCorrect) {
                    tileColor = AppColors.success.withOpacity(0.15);
                    borderColor = AppColors.success;
                  } else if (isSelected) {
                    tileColor = Colors.red.withOpacity(0.15);
                    borderColor = Colors.red;
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
                              style: TextStyle(color: AppColors.text1(context), fontSize: 13),
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
                  style: TextStyle(color: AppColors.of(context), fontSize: 11.5),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  // 7. AQL XARITASI (MIND MAP)
  Widget _buildMindMapView() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.of(context).withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.of(context).withOpacity(0.3)),
            ),
            child: Text(
              widget.lesson.title,
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.of(context), fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ),
          const SizedBox(height: 20),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Mavzuning Asosiy Bo\'g\'inlari',
                  style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 12),
                _buildMindMapNode('1. Boshlang\'ich tushuncha va asosiy ta\'rif'),
                _buildMindMapNode('2. Qo\'llanilish holatlari va grammatik / mantiqiy vazifalari'),
                _buildMindMapNode('3. Istisnolar va e\'tibor qaratilishi lozim bo\'lgan jihatlar'),
                _buildMindMapNode('4. Amaliy mashqlar va xulosalar'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMindMapNode(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.hub_rounded, color: AppColors.of(context), size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: TextStyle(color: AppColors.text1(context), fontSize: 13, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  // 8. AI TYUTOR SUHBAT
  Widget _buildAiChatView() {
    return Column(
      children: [
        // Tezkor savol chiplari
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          color: AppColors.cardBg(context),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ActionChip(
                  label: const Text('Asosiy farqini tushuntir', style: TextStyle(fontSize: 11)),
                  onPressed: () => _sendChatMessage('Ushbu mavzuning asosiy farqini tushuntirib bering'),
                ),
                const SizedBox(width: 6),
                ActionChip(
                  label: const Text('Ko\'p uchraydigan xatolar?', style: TextStyle(fontSize: 11)),
                  onPressed: () => _sendChatMessage('Qaysi xatolardan ehtiyot bo\'lish kerak?'),
                ),
                const SizedBox(width: 6),
                ActionChip(
                  label: const Text('Qisqa xulosa ber', style: TextStyle(fontSize: 11)),
                  onPressed: () => _sendChatMessage('Mavzu bo\'yicha qisqa va lo\'nda xulosa bering'),
                ),
              ],
            ),
          ),
        ),

        // Xabarlar ro'yxati
        Expanded(
          child: _chatMessages.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.smart_toy_outlined, color: AppColors.of(context), size: 44),
                        const SizedBox(height: 12),
                        Text(
                          'AI Tyutor sizga yordam berishga tayyor',
                          style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Mavzu bo\'yicha istalgan savolingizni bering yoki yuqoridagi tayyor savollardan birini tanlang.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textM(context), fontSize: 12),
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
                          color: isUser ? AppColors.of(context) : AppColors.surfaceCol(context),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: isUser ? AppColors.of(context) : AppColors.borderCol(context)),
                        ),
                        child: Text(
                          msg['text'] ?? '',
                          style: TextStyle(
                            color: isUser ? Colors.white : AppColors.text1(context),
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),

        // Xabar kiritish paneli
        Container(
          padding: EdgeInsets.fromLTRB(16, 8, 16, context.bottomSafeArea > 0 ? context.bottomSafeArea : 12),
          decoration: BoxDecoration(
            color: AppColors.surfaceCol(context),
            border: Border(top: BorderSide(color: AppColors.borderCol(context))),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _chatController,
                  style: TextStyle(color: AppColors.text1(context), fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Savolingizni yozing...',
                    hintStyle: TextStyle(color: AppColors.textM(context), fontSize: 13),
                    border: InputBorder.none,
                  ),
                  onSubmitted: (_) => _sendChatMessage(),
                ),
              ),
              IconButton(
                icon: Icon(Icons.send_rounded, color: AppColors.of(context)),
                onPressed: () => _sendChatMessage(),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
