import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/student_models.dart';
import '../../../providers/notification_provider.dart';
import '../../../widgets/glass_card.dart';

// O'yin turlari
enum GameType {
  matchPairs, // Juftliklarni topish
  blitzSprint, // Tezkor blitz savollar
  memoryFlip, // Xotira kartalari
}

// O'yin rejimi
enum GameMode {
  solo, // Yakka o'yin
  duel, // Guruhdosh bilan bellashuv
}

// Juftlik elementi modeli
class GamePairItem {
  final String id;
  final String term;
  final String definition;

  GamePairItem({
    required this.id,
    required this.term,
    required this.definition,
  });
}

// Blitz savoli modeli
class BlitzQuestion {
  final String question;
  final List<String> options;
  final int correctIndex;
  final String explanation;

  BlitzQuestion({
    required this.question,
    required this.options,
    required this.correctIndex,
    required this.explanation,
  });
}

class InteractiveGameScreen extends StatefulWidget {
  final String topicTitle;
  final String? topicDescription;
  final LessonAiContent? aiContent;
  final GameType initialGameType;
  final GameMode initialGameMode;

  const InteractiveGameScreen({
    super.key,
    required this.topicTitle,
    this.topicDescription,
    this.aiContent,
    this.initialGameType = GameType.matchPairs,
    this.initialGameMode = GameMode.solo,
  });

  @override
  State<InteractiveGameScreen> createState() => _InteractiveGameScreenState();
}

class _InteractiveGameScreenState extends State<InteractiveGameScreen> {
  late GameType _currentGameType;
  late GameMode _currentGameMode;

  // Guruhdosh bilan bellashuv holatlari
  String _roomCode = '';
  bool _isDuelWaiting = false;
  String? _opponentName;
  int _opponentScore = 0;
  Timer? _opponentSimTimer;

  // Umumiy ball va vaqt
  int _playerScore = 0;
  int _comboCount = 0;
  int _secondsElapsed = 0;
  Timer? _gameTimer;
  bool _isGameOver = false;

  // 1. Juftliklar o'yini holati
  List<GamePairItem> _generatedPairs = [];
  List<String> _shuffledTerms = [];
  List<String> _shuffledDefinitions = [];
  String? _selectedTerm;
  String? _selectedDefinition;
  final Set<String> _matchedPairIds = {};
  bool _isCheckingPair = false;

  // 2. Blitz o'yini holati
  List<BlitzQuestion> _blitzQuestions = [];
  int _currentBlitzIndex = 0;
  int _blitzSecondsLeft = 15;
  Timer? _blitzTimer;
  int? _selectedAnswerIndex;
  bool _isBlitzAnswered = false;

  // 3. Xotira kartalari holati
  List<Map<String, dynamic>> _memoryCards = [];
  int? _firstFlippedIndex;
  int? _secondFlippedIndex;
  bool _isMemoryFlipping = false;
  int _memoryMoves = 0;

  // Interaktiv animatsiyalar holati
  String? _floatingScoreText;
  Key _floatingScoreKey = UniqueKey();
  String? _wrongTerm;
  String? _wrongDef;
  bool _showStartCountdown = false;
  int _countdownValue = 3;
  Timer? _countdownTimer;
  double _playerDuelProgress = 0.0;
  double _opponentDuelProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _currentGameType = widget.initialGameType;
    _currentGameMode = widget.initialGameMode;

    _generateTopicContent();
    _initCurrentGame();

    if (_currentGameMode == GameMode.duel) {
      _generateRoomCode();
    }
  }

  @override
  void dispose() {
    _gameTimer?.cancel();
    _blitzTimer?.cancel();
    _opponentSimTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  // Mavzu bo'yicha interaktiv o'yin kontentini generatsiya qilish
  void _generateTopicContent() {
    final title = widget.topicTitle.toLowerCase();
    final desc = (widget.topicDescription ?? '').toLowerCase();

    // Agar Flashcardlar yoki Quiz mavjud bo'lsa, ulardan generatsiya qilamiz
    if (widget.aiContent != null && widget.aiContent!.flashcards.isNotEmpty) {
      _generatedPairs = widget.aiContent!.flashcards.map((f) {
        return GamePairItem(
          id: UniqueKey().toString(),
          term: f.front,
          definition: f.back,
        );
      }).take(6).toList();
    } else if (title.contains('lam') || title.contains('arab')) {
      _generatedPairs = [
        GamePairItem(id: '1', term: 'Lam-i Ta\'lil', definition: 'Harakatning sababini izohlovchi yuklama'),
        GamePairItem(id: '2', term: 'Lan yuklamasi', definition: 'Kelasi zamonda qat\'iy inkor ma\'nosi'),
        GamePairItem(id: '3', term: 'Lam-i Amr', definition: 'Uchinchi shaxsga buyruq yoki talab ifodasi'),
        GamePairItem(id: '4', term: 'Lam-i Juza', definition: 'Fe\'lning jazm holatiga keltiruvchi omil'),
        GamePairItem(id: '5', term: 'Lam-i Ibtido', definition: 'Gap boshida ta\'kid bildirish vositasi'),
        GamePairItem(id: '6', term: 'Harfi Jarr Lam', definition: 'Tegishlilik va egalik munosabatini ko\'rsatadi'),
      ];
    } else if (title.contains('sitologiya') || title.contains('hujayra') || title.contains('bio')) {
      _generatedPairs = [
        GamePairItem(id: '1', term: 'Mitoxondriya', definition: 'ATF energiyasi ishlab chiqaruvchi asosiy stansiya'),
        GamePairItem(id: '2', term: 'Ribosoma', definition: 'Oqsil biosintezini amalga oshiruvchi organoid'),
        GamePairItem(id: '3', term: 'Lizosoma', definition: 'Hujayra ichi hazm qilish va moddalarni parchalash'),
        GamePairItem(id: '4', term: 'Xloroplast', definition: 'Fotosintez jarayoni kechuvchi yashil plastida'),
        GamePairItem(id: '5', term: 'Hujayra markazi', definition: 'Bo\'linish dukini hosil qilishda qatnashadi'),
        GamePairItem(id: '6', term: 'Goldji majmuasi', definition: 'Organik moddalarni to\'plash va saralash markazi'),
      ];
    } else if (title.contains('metabolizm') || title.contains('energiya')) {
      _generatedPairs = [
        GamePairItem(id: '1', term: 'Anabolizm', definition: 'Oddiy moddalardan murakkab moddalar sintezi'),
        GamePairItem(id: '2', term: 'Katabolizm', definition: 'Murakkab moddalarning oddiy birikmalarga parchalanishi'),
        GamePairItem(id: '3', term: 'Glikoliz', definition: 'Glyukozaning kislorodsiz bosqichda parchalanishi'),
        GamePairItem(id: '4', term: 'ATF', definition: 'Universal kimyoviy energiya akkumulyatori'),
        GamePairItem(id: '5', term: 'Krebs sikli', definition: 'Mitoxondriya matritsasida kechuvchi oksidlanish'),
        GamePairItem(id: '6', term: 'Fermentlar', definition: 'Kimyoviy reaksiyalarni tezlatuvchi biologik katalizatorlar'),
      ];
    } else {
      // Mavzudan dinamik juftliklar
      _generatedPairs = [
        GamePairItem(id: '1', term: widget.topicTitle, definition: 'Ushbu darsning bosh o\'rganish obyekti'),
        GamePairItem(id: '2', term: 'Asosiy tushuncha', definition: desc.isNotEmpty ? desc : 'Mavzuning amaliy qo\'llanish sohasi'),
        GamePairItem(id: '3', term: 'Formulasi / Qoidasi', definition: 'Amaliyotda qo\'llaniladigan muhim qoida'),
        GamePairItem(id: '4', term: 'Xulosa', definition: 'O\'zlashtirilgan bilimlarning yakuniy mohiyati'),
      ];
    }

    // Blitz savollarini tayyorlash
    if (widget.aiContent != null && widget.aiContent!.quizQuestions.isNotEmpty) {
      _blitzQuestions = widget.aiContent!.quizQuestions.map((q) {
        return BlitzQuestion(
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        );
      }).toList();
    } else {
      _blitzQuestions = _generatedPairs.map((pair) {
        final wrongOpts = _generatedPairs.where((p) => p.id != pair.id).map((p) => p.definition).take(3).toList();
        final allOpts = [...wrongOpts, pair.definition]..shuffle();
        return BlitzQuestion(
          question: '${pair.term} tushunchasining to\'g\'ri ta\'rifi qaysi?',
          options: allOpts,
          correctIndex: allOpts.indexOf(pair.definition),
          explanation: '${pair.term}: ${pair.definition}',
        );
      }).toList();
    }
  }

  void _generateRoomCode() {
    final random = Random();
    final num = 100 + random.nextInt(900);
    _roomCode = 'ABD-$num';
  }

  void _initCurrentGame() {
    _gameTimer?.cancel();
    _blitzTimer?.cancel();
    _opponentSimTimer?.cancel();

    _playerScore = 0;
    _opponentScore = 0;
    _comboCount = 0;
    _secondsElapsed = 0;
    _isGameOver = false;

    // Umumiy taymer
    _gameTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_isGameOver && mounted) {
        setState(() {
          _secondsElapsed++;
        });
      }
    });

    if (_currentGameType == GameType.matchPairs) {
      _initMatchPairs();
    } else if (_currentGameType == GameType.blitzSprint) {
      _initBlitzSprint();
    } else if (_currentGameType == GameType.memoryFlip) {
      _initMemoryFlip();
    }

    // Bellashuv rejimida raqib ballini jonli simulyatsiya qilish
    if (_currentGameMode == GameMode.duel && _opponentName != null) {
      _startOpponentSimulation();
    }
  }

  void _startOpponentSimulation() {
    _opponentSimTimer?.cancel();
    final random = Random();
    _opponentSimTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!_isGameOver && mounted) {
        setState(() {
          _opponentScore += random.nextInt(20) + 15;
          _opponentDuelProgress = (_opponentDuelProgress + 0.15).clamp(0.0, 0.95);
        });
      }
    });
  }

  // 1. Juftliklar o'yinini initsializatsiya qilish
  void _initMatchPairs() {
    _selectedTerm = null;
    _selectedDefinition = null;
    _matchedPairIds.clear();
    _isCheckingPair = false;

    _shuffledTerms = _generatedPairs.map((p) => p.term).toList()..shuffle();
    _shuffledDefinitions = _generatedPairs.map((p) => p.definition).toList()..shuffle();
  }

  // 2. Blitz o'yinini initsializatsiya qilish
  void _initBlitzSprint() {
    _currentBlitzIndex = 0;
    _startBlitzQuestionTimer();
  }

  void _startBlitzQuestionTimer() {
    _blitzTimer?.cancel();
    _blitzSecondsLeft = 15;
    _selectedAnswerIndex = null;
    _isBlitzAnswered = false;

    _blitzTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_blitzSecondsLeft > 1) {
        setState(() {
          _blitzSecondsLeft--;
        });
      } else {
        _blitzTimer?.cancel();
        _handleBlitzAnswer(-1); // Vaqt tugadi
      }
    });
  }

  // 3. Xotira kartalarini initsializatsiya qilish
  void _initMemoryFlip() {
    _memoryMoves = 0;
    _firstFlippedIndex = null;
    _secondFlippedIndex = null;
    _isMemoryFlipping = false;

    List<Map<String, dynamic>> cards = [];
    final pairsToUse = _generatedPairs.take(6).toList();

    for (var p in pairsToUse) {
      cards.add({
        'pairId': p.id,
        'text': p.term,
        'isTerm': true,
        'isMatched': false,
        'isFlipped': false,
      });
      cards.add({
        'pairId': p.id,
        'text': p.definition,
        'isTerm': false,
        'isMatched': false,
        'isFlipped': false,
      });
    }

    cards.shuffle();
    _memoryCards = cards;
  }

  // JUFTLIKLAR O'YINI MANTIQI
  void _onTermTapped(String term) {
    if (_isCheckingPair) return;
    setState(() {
      _selectedTerm = term;
    });
    _checkPairMatch();
  }

  void _onDefinitionTapped(String def) {
    if (_isCheckingPair) return;
    setState(() {
      _selectedDefinition = def;
    });
    _checkPairMatch();
  }

  void _triggerFloatingScore(String text) {
    setState(() {
      _floatingScoreText = text;
      _floatingScoreKey = UniqueKey();
    });
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted && _floatingScoreText == text) {
        setState(() {
          _floatingScoreText = null;
        });
      }
    });
  }

  void _startCountdownAnimation() {
    _countdownTimer?.cancel();
    setState(() {
      _showStartCountdown = true;
      _countdownValue = 3;
    });

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_countdownValue > 1) {
        setState(() {
          _countdownValue--;
        });
        HapticFeedback.lightImpact();
      } else {
        timer.cancel();
        setState(() {
          _showStartCountdown = false;
        });
        HapticFeedback.heavyImpact();
      }
    });
  }

  void _checkPairMatch() {
    if (_selectedTerm == null || _selectedDefinition == null) return;

    _isCheckingPair = true;

    final termItem = _generatedPairs.firstWhere((p) => p.term == _selectedTerm);
    final isMatch = termItem.definition == _selectedDefinition;

    if (isMatch) {
      HapticFeedback.lightImpact();
      final earned = 20 + (_comboCount * 5);
      final comboSuffix = _comboCount >= 2 ? ' (${_comboCount + 1}x Combo!)' : '';
      _triggerFloatingScore('+$earned Ball!$comboSuffix');

      setState(() {
        _matchedPairIds.add(termItem.id);
        _comboCount++;
        _playerScore += earned;
        _playerDuelProgress = (_matchedPairIds.length / _generatedPairs.length).clamp(0.0, 1.0);
        _selectedTerm = null;
        _selectedDefinition = null;
        _isCheckingPair = false;
        _wrongTerm = null;
        _wrongDef = null;
      });

      if (_matchedPairIds.length == _generatedPairs.length) {
        _finishGame();
      }
    } else {
      HapticFeedback.heavyImpact();
      final wrongT = _selectedTerm;
      final wrongD = _selectedDefinition;
      setState(() {
        _comboCount = 0;
        _wrongTerm = wrongT;
        _wrongDef = wrongD;
      });
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) {
          setState(() {
            _selectedTerm = null;
            _selectedDefinition = null;
            _isCheckingPair = false;
            _wrongTerm = null;
            _wrongDef = null;
          });
        }
      });
    }
  }

  // BLITZ O'YINI MANTIQI
  void _handleBlitzAnswer(int index) {
    if (_isBlitzAnswered) return;
    _blitzTimer?.cancel();

    final currentQ = _blitzQuestions[_currentBlitzIndex];
    final isCorrect = index == currentQ.correctIndex;

    setState(() {
      _selectedAnswerIndex = index;
      _isBlitzAnswered = true;
      if (isCorrect) {
        _comboCount++;
        final earned = 25 + (_comboCount * 5) + (_blitzSecondsLeft * 2);
        _playerScore += earned;
        _playerDuelProgress = ((_currentBlitzIndex + 1) / _blitzQuestions.length).clamp(0.0, 1.0);
        final comboSuffix = _comboCount >= 2 ? ' (${_comboCount}x Combo!)' : '';
        _triggerFloatingScore('+$earned Ball!$comboSuffix');
        HapticFeedback.lightImpact();
      } else {
        _comboCount = 0;
        _triggerFloatingScore('Noto\'g\'ri! Izohga qarang');
        HapticFeedback.heavyImpact();
      }
    });

    Future.delayed(const Duration(milliseconds: 1400), () {
      if (!mounted) return;
      if (_currentBlitzIndex + 1 < _blitzQuestions.length) {
        setState(() {
          _currentBlitzIndex++;
        });
        _startBlitzQuestionTimer();
      } else {
        _finishGame();
      }
    });
  }

  // XOTIRA KARTALARI MANTIQI
  void _onMemoryCardTapped(int index) {
    if (_isMemoryFlipping || _memoryCards[index]['isMatched'] == true || _memoryCards[index]['isFlipped'] == true) {
      return;
    }

    setState(() {
      _memoryCards[index]['isFlipped'] = true;
    });

    if (_firstFlippedIndex == null) {
      _firstFlippedIndex = index;
    } else {
      _secondFlippedIndex = index;
      _memoryMoves++;
      _isMemoryFlipping = true;

      final first = _memoryCards[_firstFlippedIndex!];
      final second = _memoryCards[_secondFlippedIndex!];

      if (first['pairId'] == second['pairId']) {
        // Mos keldi!
        HapticFeedback.lightImpact();
        Future.delayed(const Duration(milliseconds: 400), () {
          if (mounted) {
            final earned = 30 + (_comboCount * 5);
            final comboSuffix = _comboCount >= 2 ? ' (${_comboCount + 1}x Combo!)' : '';
            _triggerFloatingScore('+$earned Ball! Ajoyib xotira!$comboSuffix');

            setState(() {
              first['isMatched'] = true;
              second['isMatched'] = true;
              _comboCount++;
              _playerScore += earned;
              _playerDuelProgress = (_memoryCards.where((c) => c['isMatched'] == true).length / _memoryCards.length).clamp(0.0, 1.0);
              _firstFlippedIndex = null;
              _secondFlippedIndex = null;
              _isMemoryFlipping = false;
            });

            // Hammasi ochildimi?
            final allDone = _memoryCards.every((c) => c['isMatched'] == true);
            if (allDone) {
              _finishGame();
            }
          }
        });
      } else {
        // Noto'g'ri
        HapticFeedback.heavyImpact();
        _comboCount = 0;
        Future.delayed(const Duration(milliseconds: 900), () {
          if (mounted) {
            setState(() {
              first['isFlipped'] = false;
              second['isFlipped'] = false;
              _firstFlippedIndex = null;
              _secondFlippedIndex = null;
              _isMemoryFlipping = false;
            });
          }
        });
      }
    }
  }

  // O'YINNI YAKUNLASH
  void _finishGame() {
    _gameTimer?.cancel();
    _blitzTimer?.cancel();
    _opponentSimTimer?.cancel();

    setState(() {
      _isGameOver = true;
    });

    // Abdora tanga va bildirishnoma berish
    final notifProvider = Provider.of<NotificationProvider>(context, listen: false);
    final isWonDuel = _currentGameMode == GameMode.duel && _playerScore >= _opponentScore;

    notifProvider.addNotification(
      title: _currentGameMode == GameMode.duel
          ? (isWonDuel ? 'Bellashuvda g\'alaba qozondingiz!' : 'Guruhdosh bilan bellashuv yakunlandi')
          : 'Mavzu o\'yini muvaffaqiyatli yakunlandi!',
      description: '"${widget.topicTitle}" mavzusi bo\'yicha siz $_playerScore ball to\'pladingiz. +15 Abdora tangasi hisobingizga qo\'shildi!',
      category: NotificationCategory.challenge,
      route: 'homework',
    );

    // O'qituvchi nazorati va umumiy statistika uchun serverga yuborish
    try {
      ApiClient().dio.post(
        Endpoints.gameActivity,
        data: {
          'topicTitle': widget.topicTitle,
          'gameType': _currentGameType == GameType.matchPairs ? 'Juftliklar' : _currentGameType == GameType.blitzSprint ? 'Blitz Sprint' : 'Xotira',
          'score': _playerScore,
          'opponentName': _opponentName,
          'isWon': isWonDuel,
          'moves': _memoryMoves,
          'duration': _secondsElapsed,
          'mode': _currentGameMode == GameMode.duel ? 'duel' : 'solo',
        },
      ).catchError((_) {});
    } catch (_) {}
  }

  // GURUHDOSHGA TAKLIF YUBORISH DIALOGI
  void _showInviteClassmateSheet() {
    final classmates = [
      {'name': 'Shukrona Rahimova', 'online': true, 'rank': 1},
      {'name': 'Jasurbek Aliyev', 'online': true, 'rank': 3},
      {'name': 'Madina Karimova', 'online': false, 'rank': 4},
      {'name': 'Bekzod Mirzayev', 'online': true, 'rank': 5},
      {'name': 'Dildora Yusupova', 'online': false, 'rank': 6},
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: AppColors.cardBg(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.borderCol(context), width: 1.5)),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Guruhdoshni jangga chorlash',
                  style: TextStyle(
                    color: AppColors.text1(context),
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, color: AppColors.textM(context), size: 20),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Xona kodi: $_roomCode. Guruhdoshlaringizdan birini bellashuvga taklif qiling.',
              style: TextStyle(color: AppColors.text2(context), fontSize: 12.5),
            ),
            const SizedBox(height: 16),
            ...classmates.map((c) {
              final isOnline = c['online'] as bool;
              final name = c['name'] as String;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.inputCol(context),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderCol(context)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: AppColors.of(context).withOpacity(0.15),
                      child: Text(
                        name.substring(0, 1),
                        style: TextStyle(color: AppColors.of(context), fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                          Row(
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: BoxDecoration(
                                  color: isOnline ? AppColors.success : AppColors.textM(context),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                isOnline ? 'Onlayn' : 'Oflayn',
                                style: TextStyle(
                                  color: isOnline ? AppColors.success : AppColors.textM(context),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _startDuelWithOpponent(name);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.of(context),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text(
                        'Chorlash',
                        style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  void _startDuelWithOpponent(String opponentName) {
    setState(() {
      _opponentName = opponentName;
      _currentGameMode = GameMode.duel;
      _playerDuelProgress = 0.0;
      _opponentDuelProgress = 0.0;
    });
    _initCurrentGame();
    _startCountdownAnimation();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.cardBg(context),
        content: Row(
          children: [
            Icon(Icons.sports_esports_rounded, color: AppColors.of(context)),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '$opponentName bilan bellashuv boshlandi! G\'alaba qozonish uchun tezroq harakat qiling.',
                style: TextStyle(color: AppColors.text1(context), fontSize: 12.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // XONAGA ULANISH MODALI
  void _showJoinRoomDialog() {
    final codeController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBg(context),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(
          'Xonaga ulanish',
          style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 17),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Guruhdoshingiz yuborgan 6 xonali kodni kiriting (Masalan: ABD-492):',
              style: TextStyle(color: AppColors.text2(context), fontSize: 13),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: codeController,
              textCapitalization: TextCapitalization.characters,
              style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, letterSpacing: 2),
              decoration: InputDecoration(
                hintText: 'ABD-000',
                hintStyle: TextStyle(color: AppColors.textM(context)),
                filled: true,
                fillColor: AppColors.inputCol(context),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppColors.borderCol(context)),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Bekor qilish', style: TextStyle(color: AppColors.textM(context))),
          ),
          ElevatedButton(
            onPressed: () {
              final code = codeController.text.trim();
              if (code.isNotEmpty) {
                Navigator.pop(ctx);
                _startDuelWithOpponent('Jasurbek Aliyev (Xona: $code)');
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.of(context),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Ulanish', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        backgroundColor: AppColors.cardBg(context),
        elevation: 0,
        title: Text(
          widget.topicTitle,
          style: TextStyle(color: AppColors.text1(context), fontSize: 16, fontWeight: FontWeight.bold),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          // Guruhdosh taklif qilish yoki xona kodi
          if (_currentGameMode == GameMode.duel)
            IconButton(
              icon: Icon(Icons.share_rounded, color: AppColors.of(context)),
              tooltip: 'Xona kodini ulashish',
              onPressed: () {
                Clipboard.setData(ClipboardData(text: _roomCode));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Xona kodi nusxalandi: $_roomCode'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
            ),
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.of(context)),
            tooltip: 'Qayta boshlash',
            onPressed: () => _initCurrentGame(),
          ),
        ],
      ),
      body: Stack(
        children: [
          _isGameOver ? _buildGameOverView() : _buildGameActiveView(),

          // 3, 2, 1, START! Bellashuv animatsiyasi
          if (_showStartCountdown)
            Container(
              color: Colors.black.withOpacity(0.75),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      key: ValueKey(_countdownValue),
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.of(context),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.of(context).withOpacity(0.5),
                            blurRadius: 25,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          '$_countdownValue',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ).animate(key: ValueKey(_countdownValue)).scale(begin: const Offset(1.6, 1.6), end: const Offset(1.0, 1.0), duration: 400.ms).fadeIn(),
                    const SizedBox(height: 20),
                    const Text(
                      'Tayyorlaning! Bellashuv boshlanmoqda...',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ).animate().fadeIn(duration: 300.ms),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // O'YIN FAOL KO'RINISHI
  Widget _buildGameActiveView() {
    return Column(
      children: [
        // 1. Yuqori panel: Rejim tanlash va Bellashuv ko'rsatkichlari
        _buildTopControlBar(),

        // 2. Bellashuv jadvali (Duel rejimida)
        if (_currentGameMode == GameMode.duel) _buildDuelScoreHeader(),

        // 3. O'yin maydoni
        Expanded(
          child: _currentGameType == GameType.matchPairs
              ? _buildMatchPairsView()
              : _currentGameType == GameType.blitzSprint
                  ? _buildBlitzSprintView()
                  : _buildMemoryFlipView(),
        ),
      ],
    );
  }

  // YUQORI BOSHQARUV PANELI
  Widget _buildTopControlBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      color: AppColors.cardBg(context),
      child: Column(
        children: [
          // O'yin turlari slayderi (Juftliklar, Blitz, Xotira)
          Row(
            children: [
              _buildTypeChip('Juftliklar', GameType.matchPairs, Icons.extension_rounded),
              const SizedBox(width: 6),
              _buildTypeChip('Blitz Sprint', GameType.blitzSprint, Icons.bolt_rounded),
              const SizedBox(width: 6),
              _buildTypeChip('Xotira', GameType.memoryFlip, Icons.grid_view_rounded),
            ],
          ),
          const SizedBox(height: 8),
          // Hisoblagichlar paneli
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Ball
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.of(context).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.stars_rounded, color: AppColors.of(context), size: 16),
                    const SizedBox(width: 5),
                    Text(
                      '$_playerScore ball',
                      style: TextStyle(color: AppColors.of(context), fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                ),
              ),
              // Combo
              if (_comboCount > 1)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${_comboCount}x Combo!',
                    style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ).animate().scale(duration: 200.ms),
              // Vaqt
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.inputCol(context),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.borderCol(context)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.timer_outlined, color: AppColors.textM(context), size: 14),
                    const SizedBox(width: 5),
                    Text(
                      '${_secondsElapsed ~/ 60}:${(_secondsElapsed % 60).toString().padLeft(2, '0')}',
                      style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.w600, fontSize: 12.5),
                    ),
                  ],
                ),
              ),
              // Guruhdosh chaqirish tugmasi
              InkWell(
                onTap: () {
                  if (_currentGameMode == GameMode.solo) {
                    _showInviteClassmateSheet();
                  } else {
                    _showJoinRoomDialog();
                  }
                },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.of(context),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.people_alt_rounded, color: Colors.white, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        _currentGameMode == GameMode.duel ? 'Xona: $_roomCode' : 'Bellashuv',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Combo va Mukofot banneri
          if (_comboCount >= 2) ...[
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.amber.shade700,
                    AppColors.of(context),
                  ],
                ),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.amber.withOpacity(0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.local_fire_department_rounded, color: Colors.white, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    _comboCount >= 5
                        ? 'To\'xtatib bo\'lmas shiddat! ${_comboCount}x Combo!'
                        : _comboCount >= 3
                            ? 'Olovdek shiddatli bilim! ${_comboCount}x Combo!'
                            : 'Zo\'r ketma-ketlik! ${_comboCount}x Combo!',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11.5),
                  ),
                ],
              ),
            ).animate().scale(duration: 250.ms).shimmer(duration: 1200.ms),
          ],

          // Floating Score ko'rsatkichi
          if (_floatingScoreText != null) ...[
            const SizedBox(height: 6),
            Container(
              key: _floatingScoreKey,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: _floatingScoreText!.contains('Noto\'g\'ri')
                    ? Colors.red.shade700
                    : AppColors.success,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: (_floatingScoreText!.contains('Noto\'g\'ri') ? Colors.red : AppColors.success).withOpacity(0.4),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Text(
                _floatingScoreText!,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ).animate().fadeIn(duration: 150.ms).scale(begin: const Offset(0.8, 0.8), end: const Offset(1.0, 1.0)).slideY(begin: 0.2, end: 0),
          ],
        ],
      ),
    );
  }

  Widget _buildTypeChip(String label, GameType type, IconData icon) {
    final isSelected = _currentGameType == type;
    return Expanded(
      child: InkWell(
        onTap: () {
          if (_currentGameType != type) {
            setState(() {
              _currentGameType = type;
            });
            _initCurrentGame();
          }
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.of(context) : AppColors.inputCol(context),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? AppColors.of(context) : AppColors.borderCol(context)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 13, color: isSelected ? Colors.white : AppColors.text2(context)),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppColors.text2(context),
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  fontSize: 11.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // DUEL REJIMIDA JONLI POYGA VA BALL CHIZIG'I
  Widget _buildDuelScoreHeader() {
    final opponent = _opponentName ?? 'Guruhdoshingiz';
    final isPlayerLeading = _playerScore >= _opponentScore;

    return Container(
      margin: const EdgeInsets.fromLTRB(14, 10, 14, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.cardBg(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderCol(context)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: AppColors.of(context),
                    child: const Text('Siz', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  Text('Siz: $_playerScore', style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 13)),
                  if (isPlayerLeading && _playerScore > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('Peshqadam', style: TextStyle(color: AppColors.success, fontSize: 9.5, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ],
              ),
              Row(
                children: [
                  if (!isPlayerLeading && _opponentScore > 0) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('Peshqadam', style: TextStyle(color: Colors.orange, fontSize: 9.5, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 6),
                  ],
                  Text('$opponent: $_opponentScore', style: TextStyle(color: AppColors.text2(context), fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: Colors.orange.shade700,
                    child: Text(opponent.substring(0, 1), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Jonli poyga yo'lakchasi
          Stack(
            alignment: Alignment.centerLeft,
            children: [
              Container(
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.inputCol(context),
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              // Raqib chizig'i
              FractionallySizedBox(
                widthFactor: _opponentDuelProgress.clamp(0.05, 1.0),
                child: Container(
                  height: 10,
                  decoration: BoxDecoration(
                    color: Colors.orange.shade600.withOpacity(0.55),
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              ),
              // O'quvchi chizig'i
              FractionallySizedBox(
                widthFactor: _playerDuelProgress.clamp(0.05, 1.0),
                child: Container(
                  height: 10,
                  decoration: BoxDecoration(
                    color: AppColors.of(context),
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Start', style: TextStyle(color: AppColors.textM(context), fontSize: 10)),
              Row(
                children: [
                  Icon(Icons.flag_rounded, size: 12, color: AppColors.of(context)),
                  const SizedBox(width: 2),
                  Text('Finish (G\'alaba)', style: TextStyle(color: AppColors.of(context), fontSize: 10, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 1. JUFTLIKLAR O'YINI KO'RINISHI
  Widget _buildMatchPairsView() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.touch_app_rounded, size: 16, color: AppColors.of(context)),
              const SizedBox(width: 6),
              Text(
                'Atama va mos ta\'rifni tanlab juftlang:',
                style: TextStyle(color: AppColors.text2(context), fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Chap ustun: Atamalar
              Expanded(
                child: Column(
                  children: _shuffledTerms.asMap().entries.map((entry) {
                    final index = entry.key;
                    final term = entry.value;
                    final pair = _generatedPairs.firstWhere((p) => p.term == term);
                    final isMatched = _matchedPairIds.contains(pair.id);
                    final isSelected = _selectedTerm == term;
                    final isWrong = _wrongTerm == term;

                    if (isMatched) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.success, width: 1.5),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                term,
                                style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ).animate().scale(begin: const Offset(0.92, 0.92), end: const Offset(1.0, 1.0), duration: 250.ms);
                    }

                    Widget cardWidget = Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: InkWell(
                        onTap: () => _onTermTapped(term),
                        borderRadius: BorderRadius.circular(12),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          decoration: BoxDecoration(
                            color: isWrong
                                ? Colors.red.withOpacity(0.18)
                                : isSelected
                                    ? AppColors.of(context).withOpacity(0.18)
                                    : AppColors.cardBg(context),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isWrong
                                  ? Colors.red
                                  : isSelected
                                      ? AppColors.of(context)
                                      : AppColors.borderCol(context),
                              width: isSelected || isWrong ? 2 : 1,
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: AppColors.of(context).withOpacity(0.25),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  term,
                                  style: TextStyle(
                                    color: isWrong
                                        ? Colors.red
                                        : isSelected
                                            ? AppColors.of(context)
                                            : AppColors.text1(context),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.5,
                                  ),
                                ),
                              ),
                              if (isSelected)
                                Icon(Icons.radio_button_checked_rounded, size: 14, color: AppColors.of(context)),
                            ],
                          ),
                        ),
                      ),
                    );

                    if (isWrong) {
                      cardWidget = cardWidget.animate().shake(hz: 4, offset: const Offset(6, 0), duration: 400.ms);
                    } else if (isSelected) {
                      cardWidget = cardWidget.animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(duration: 1200.ms);
                    } else {
                      cardWidget = cardWidget.animate(delay: (index * 50).ms).fadeIn(duration: 250.ms).slideX(begin: -0.05, end: 0);
                    }

                    return cardWidget;
                  }).toList(),
                ),
              ),
              const SizedBox(width: 10),
              // O'ng ustun: Ta'riflar
              Expanded(
                child: Column(
                  children: _shuffledDefinitions.asMap().entries.map((entry) {
                    final index = entry.key;
                    final def = entry.value;
                    final pair = _generatedPairs.firstWhere((p) => p.definition == def);
                    final isMatched = _matchedPairIds.contains(pair.id);
                    final isSelected = _selectedDefinition == def;
                    final isWrong = _wrongDef == def;

                    if (isMatched) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.success, width: 1.5),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                def,
                                style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w600, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ).animate().scale(begin: const Offset(0.92, 0.92), end: const Offset(1.0, 1.0), duration: 250.ms);
                    }

                    Widget cardWidget = Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: InkWell(
                        onTap: () => _onDefinitionTapped(def),
                        borderRadius: BorderRadius.circular(12),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          decoration: BoxDecoration(
                            color: isWrong
                                ? Colors.red.withOpacity(0.18)
                                : isSelected
                                    ? AppColors.of(context).withOpacity(0.18)
                                    : AppColors.cardBg(context),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isWrong
                                  ? Colors.red
                                  : isSelected
                                      ? AppColors.of(context)
                                      : AppColors.borderCol(context),
                              width: isSelected || isWrong ? 2 : 1,
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: AppColors.of(context).withOpacity(0.25),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Text(
                            def,
                            style: TextStyle(
                              color: isWrong
                                  ? Colors.red
                                  : isSelected
                                      ? AppColors.of(context)
                                      : AppColors.text2(context),
                              fontSize: 11.5,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ),
                    );

                    if (isWrong) {
                      cardWidget = cardWidget.animate().shake(hz: 4, offset: const Offset(6, 0), duration: 400.ms);
                    } else if (isSelected) {
                      cardWidget = cardWidget.animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(duration: 1200.ms);
                    } else {
                      cardWidget = cardWidget.animate(delay: (index * 50).ms).fadeIn(duration: 250.ms).slideX(begin: 0.05, end: 0);
                    }

                    return cardWidget;
                  }).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 2. BLITZ SPRINT KO'RINISHI
  Widget _buildBlitzSprintView() {
    if (_blitzQuestions.isEmpty) {
      return Center(
        child: Text('Ushbu mavzu bo\'yicha blitz savollar tayyorlanmoqda...', style: TextStyle(color: AppColors.text2(context))),
      );
    }

    final q = _blitzQuestions[_currentBlitzIndex];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Vaqt shkalasi
          Row(
            children: [
              Text(
                'Savol ${_currentBlitzIndex + 1}/${_blitzQuestions.length}',
                style: TextStyle(color: AppColors.text2(context), fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Icon(Icons.timer_rounded, size: 14, color: _blitzSecondsLeft <= 5 ? Colors.red : AppColors.of(context)),
              const SizedBox(width: 4),
              Text(
                '$_blitzSecondsLeft soniya',
                style: TextStyle(
                  color: _blitzSecondsLeft <= 5 ? Colors.red : AppColors.of(context),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: _blitzSecondsLeft / 15,
              backgroundColor: AppColors.inputCol(context),
              valueColor: AlwaysStoppedAnimation<Color>(
                _blitzSecondsLeft <= 5 ? Colors.red : AppColors.of(context),
              ),
              minHeight: 7,
            ),
          ),
          const SizedBox(height: 18),

          // Savol kartasi
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.of(context).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Tezkor sinov',
                        style: TextStyle(color: AppColors.of(context), fontSize: 10.5, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  q.question,
                  style: TextStyle(color: AppColors.text1(context), fontSize: 15.5, fontWeight: FontWeight.bold, height: 1.35),
                ),
              ],
            ),
          ).animate(key: ValueKey(_currentBlitzIndex)).fadeIn(duration: 250.ms).slideY(begin: 0.08, end: 0),
          const SizedBox(height: 14),

          // Javob variantlari
          Expanded(
            child: ListView.separated(
              itemCount: q.options.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (ctx, idx) {
                final opt = q.options[idx];
                final isSelected = _selectedAnswerIndex == idx;
                final isCorrect = idx == q.correctIndex;

                Color borderColor = AppColors.borderCol(context);
                Color bgColor = AppColors.cardBg(context);

                if (_isBlitzAnswered) {
                  if (isCorrect) {
                    borderColor = AppColors.success;
                    bgColor = AppColors.success.withOpacity(0.15);
                  } else if (isSelected) {
                    borderColor = Colors.red;
                    bgColor = Colors.red.withOpacity(0.15);
                  }
                }

                Widget optWidget = InkWell(
                  onTap: () => _handleBlitzAnswer(idx),
                  borderRadius: BorderRadius.circular(12),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: borderColor,
                        width: isSelected || (_isBlitzAnswered && isCorrect) ? 2 : 1,
                      ),
                      boxShadow: isSelected || (_isBlitzAnswered && isCorrect)
                          ? [
                              BoxShadow(
                                color: (isCorrect ? AppColors.success : Colors.red).withOpacity(0.2),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: isSelected || (_isBlitzAnswered && isCorrect)
                              ? (isCorrect ? AppColors.success : Colors.red)
                              : AppColors.inputCol(context),
                          child: Text(
                            String.fromCharCode(65 + idx),
                            style: TextStyle(
                              color: isSelected || (_isBlitzAnswered && isCorrect) ? Colors.white : AppColors.text2(context),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            opt,
                            style: TextStyle(
                              color: isSelected || (_isBlitzAnswered && isCorrect)
                                  ? (isCorrect ? AppColors.success : Colors.red)
                                  : AppColors.text1(context),
                              fontSize: 13,
                              fontWeight: isSelected || (_isBlitzAnswered && isCorrect) ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                        ),
                        if (_isBlitzAnswered && isCorrect)
                          const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                        if (_isBlitzAnswered && isSelected && !isCorrect)
                          const Icon(Icons.cancel_rounded, color: Colors.red, size: 18),
                      ],
                    ),
                  ),
                );

                if (_isBlitzAnswered && isSelected && !isCorrect) {
                  optWidget = optWidget.animate().shake(hz: 4, offset: const Offset(6, 0), duration: 400.ms);
                } else if (_isBlitzAnswered && isCorrect) {
                  optWidget = optWidget.animate().scale(begin: const Offset(0.98, 0.98), end: const Offset(1.02, 1.02), duration: 250.ms);
                } else if (!_isBlitzAnswered) {
                  optWidget = optWidget.animate(delay: (idx * 60).ms).fadeIn(duration: 250.ms).slideY(begin: 0.1, end: 0);
                }

                return optWidget;
              },
            ),
          ),

          // Tushuntirish kartochkasi (Izoh)
          if (_isBlitzAnswered) ...[
            Container(
              margin: const EdgeInsets.only(top: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.of(context).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.of(context).withOpacity(0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.lightbulb_outline_rounded, color: AppColors.of(context), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Izoh va tahlil:',
                          style: TextStyle(color: AppColors.of(context), fontSize: 11.5, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          q.explanation,
                          style: TextStyle(color: AppColors.text1(context), fontSize: 11.5, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.15, end: 0),
          ],
        ],
      ),
    );
  }

  // 3. XOTIRA KARTALARI KO'RINISHI
  Widget _buildMemoryFlipView() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Urinishlar: $_memoryMoves', style: TextStyle(color: AppColors.text2(context), fontSize: 13, fontWeight: FontWeight.w600)),
              Text(
                'Topilgan juftliklar: ${_memoryCards.where((c) => c['isMatched'] == true).length ~/ 2} / ${_memoryCards.length ~/ 2}',
                style: TextStyle(color: AppColors.of(context), fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(14),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 0.85,
            ),
            itemCount: _memoryCards.length,
            itemBuilder: (ctx, idx) {
              final card = _memoryCards[idx];
              final isFlipped = card['isFlipped'] == true || card['isMatched'] == true;
              final isMatched = card['isMatched'] == true;

              Widget cardChild;
              if (isFlipped) {
                cardChild = Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (isMatched) ...[
                      const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                      const SizedBox(height: 4),
                    ],
                    Expanded(
                      child: Center(
                        child: Text(
                          card['text'] as String,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isMatched ? AppColors.success : AppColors.text1(context),
                            fontSize: card['isTerm'] == true ? 13 : 11,
                            fontWeight: card['isTerm'] == true ? FontWeight.bold : FontWeight.w500,
                            height: 1.25,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              } else {
                cardChild = Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.of(context).withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.auto_awesome_rounded,
                        color: AppColors.of(context),
                        size: 20,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Karta ${idx + 1}',
                      style: TextStyle(color: AppColors.textM(context), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ],
                );
              }

              return InkWell(
                onTap: () => _onMemoryCardTapped(idx),
                borderRadius: BorderRadius.circular(14),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isMatched
                        ? AppColors.success.withOpacity(0.18)
                        : isFlipped
                            ? AppColors.cardBg(context)
                            : AppColors.inputCol(context),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isMatched
                          ? AppColors.success
                          : isFlipped
                              ? AppColors.of(context)
                              : AppColors.borderCol(context),
                      width: isFlipped || isMatched ? 1.8 : 1,
                    ),
                    boxShadow: isMatched
                        ? [
                            BoxShadow(
                              color: AppColors.success.withOpacity(0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: cardChild,
                ),
              ).animate(target: isMatched ? 1 : 0).scale(begin: const Offset(0.95, 0.95), end: const Offset(1.0, 1.0), duration: 250.ms);
            },
          ),
        ),
      ],
    );
  }

  // O'YIN YAKUNI VA NATIJALAR OYNASI
  Widget _buildGameOverView() {
    final isDuel = _currentGameMode == GameMode.duel;
    final isWon = _playerScore >= _opponentScore;

    String rankBadge;
    Color rankColor;
    if (_playerScore >= 140) {
      rankBadge = 'Oltin Bilimdon';
      rankColor = Colors.amber.shade700;
    } else if (_playerScore >= 80) {
      rankBadge = 'Kumush Bilimdon';
      rankColor = const Color(0xFF38BDF8);
    } else {
      rankBadge = 'Faol Tadqiqotchi';
      rankColor = AppColors.of(context);
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 20),
          Container(
            width: 86,
            height: 86,
            decoration: BoxDecoration(
              color: (isDuel ? (isWon ? AppColors.success : Colors.orange) : AppColors.of(context)).withOpacity(0.18),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: (isDuel ? (isWon ? AppColors.success : Colors.orange) : AppColors.of(context)).withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(
              isDuel ? (isWon ? Icons.emoji_events_outlined : Icons.military_tech_outlined) : Icons.celebration_outlined,
              color: isDuel ? (isWon ? AppColors.success : Colors.orange) : AppColors.of(context),
              size: 46,
            ),
          ).animate().scale(duration: 400.ms).shimmer(duration: 1500.ms),
          const SizedBox(height: 18),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
            decoration: BoxDecoration(
              color: rankColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: rankColor.withOpacity(0.4)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.military_tech_rounded, color: rankColor, size: 16),
                const SizedBox(width: 5),
                Text(
                  rankBadge,
                  style: TextStyle(color: rankColor, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ],
            ),
          ).animate(delay: 150.ms).fadeIn().scale(),
          const SizedBox(height: 12),

          Text(
            isDuel ? (isWon ? 'G\'alaba! Tabriklaymiz!' : 'Ajoyib Bellashuv!') : 'Barakalla! Dars mustahkamlandi!',
            style: TextStyle(color: AppColors.text1(context), fontSize: 20, fontWeight: FontWeight.bold),
          ).animate(delay: 200.ms).fadeIn(),
          const SizedBox(height: 8),
          Text(
            isDuel
                ? 'Siz $_opponentName bilan bellashuvda $_playerScore ball to\'pladingiz.'
                : '"${widget.topicTitle}" mavzusi bo\'yicha topshiriqlarni a\'lo darajada bajardingiz.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.text2(context), fontSize: 13, height: 1.4),
          ).animate(delay: 250.ms).fadeIn(),
          const SizedBox(height: 24),

          // Mukofotlar paneli
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardBg(context),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderCol(context)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildAwardItem('To\'plangan ball', '$_playerScore', Icons.stars_rounded, AppColors.of(context)),
                _buildAwardItem('Sarflangan vaqt', '${_secondsElapsed}s', Icons.timer_outlined, Colors.amber),
                _buildAwardItem('Abdora Tanga', '+15', Icons.monetization_on_outlined, AppColors.success),
              ],
            ),
          ).animate(delay: 300.ms).fadeIn().slideY(begin: 0.1, end: 0),
          const SizedBox(height: 28),

          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _initCurrentGame(),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    side: BorderSide(color: AppColors.borderCol(context)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Qayta o\'ynash', style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.of(context),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Tugatish', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ).animate(delay: 350.ms).fadeIn().slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }

  Widget _buildAwardItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 6),
        Text(value, style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(color: AppColors.textM(context), fontSize: 11)),
      ],
    );
  }
}
