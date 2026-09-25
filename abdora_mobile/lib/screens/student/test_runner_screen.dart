import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/student_models.dart';
import '../../providers/student_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/glass_card.dart';

class TestRunnerScreen extends StatefulWidget {
  final TestModel test;

  const TestRunnerScreen({super.key, required this.test});

  @override
  State<TestRunnerScreen> createState() => _TestRunnerScreenState();
}

class _TestRunnerScreenState extends State<TestRunnerScreen> {
  List<QuestionModel> _questions = [];
  bool _isLoading = true;
  int _currentQuestionIndex = 0;
  final Map<String, int> _answers = {};

  Timer? _timer;
  int _remainingSeconds = 0;
  int _timeTaken = 0;
  bool _isSubmitting = false;

  Map<String, dynamic>? _resultData;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.test.timeLimit * 60;
    _loadQuestions();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadQuestions() async {
    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final questions = await studentProvider.fetchTestQuestions(widget.test.id);

    if (mounted) {
      setState(() {
        _questions = questions;
        _isLoading = false;
      });
      _startTimer();
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
          _timeTaken++;
        });
      } else {
        _timer?.cancel();
        _submitTest(autoSubmit: true);
      }
    });
  }

  String _formatTimer(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _submitTest({bool autoSubmit = false}) async {
    if (_isSubmitting) return;

    if (!autoSubmit) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.card,
          title: const Text('Testni topshirish', style: TextStyle(color: AppColors.textPrimary)),
          content: Text(
            'Siz ${_answers.length} ta savolga javob berdingiz (${_questions.length} tadan). Testni yakunlaysizmi?',
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Davom etish', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Topshirish', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );

      if (confirm != true) return;
    }

    _timer?.cancel();
    setState(() => _isSubmitting = true);

    final studentProvider = Provider.of<StudentProvider>(context, listen: false);
    final res = await studentProvider.submitTest(widget.test.id, _answers, _timeTaken);

    if (mounted) {
      setState(() {
        _isSubmitting = false;
        _resultData = res ?? {
          'percentage': ((_answers.length / (_questions.isEmpty ? 1 : _questions.length)) * 100).toInt(),
          'passed': true,
          'score': _answers.length * 10,
        };
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _resultData != null,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldPop = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.card,
            title: const Text('Testdan chiqish', style: TextStyle(color: AppColors.textPrimary)),
            content: const Text(
              'Test jarayonida chiqsangiz, natijangiz saqlanmasligi mumkin. Rostdan ham chiqmoqchimisiz?',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Qolish')),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                child: const Text('Chiqish', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
        if (shouldPop == true && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(widget.test.title),
          actions: [
            if (_resultData == null && !_isLoading)
              Container(
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (_remainingSeconds < 120 ? AppColors.danger : AppColors.surface),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.timer_outlined, size: 16, color: Colors.white),
                    const SizedBox(width: 6),
                    Text(
                      _formatTimer(_remainingSeconds),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                    ),
                  ],
                ),
              ),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _resultData != null
                ? _buildResultView()
                : _buildExamView(),
      ),
    );
  }

  Widget _buildResultView() {
    final percentage = _resultData?['percentage'] ?? 0;
    final passed = _resultData?['passed'] == true;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              passed ? Icons.emoji_events_rounded : Icons.highlight_off_rounded,
              size: 80,
              color: passed ? AppColors.coinGold : AppColors.danger,
            ),
            const SizedBox(height: 20),
            Text(
              passed ? 'Tabriklaymiz, testdan o\'tdingiz!' : 'Afsuski, testdan o\'ta olmadingiz',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'To\'plangan ball: $percentage%',
              style: TextStyle(
                color: passed ? AppColors.success : AppColors.danger,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Sarflangan vaqt: ${_formatTimer(_timeTaken)}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 36),
            CustomButton(
              text: 'Natijani yakunlash',
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExamView() {
    if (_questions.isEmpty) {
      return const Center(child: Text('Savollar topilmadi', style: TextStyle(color: AppColors.textMuted)));
    }

    final q = _questions[_currentQuestionIndex];
    final selectedOption = _answers[q.id];

    return Column(
      children: [
        // Savollar raqamlari navigatori
        Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          color: AppColors.surface,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _questions.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final isAnswered = _answers.containsKey(_questions[index].id);
              final isCurrent = _currentQuestionIndex == index;

              return Center(
                child: InkWell(
                  onTap: () => setState(() => _currentQuestionIndex = index),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? AppColors.primary
                          : isAnswered
                              ? AppColors.primary.withOpacity(0.2)
                              : AppColors.card,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isCurrent ? AppColors.primary : AppColors.border,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          color: isCurrent ? Colors.white : AppColors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        // Savol va variantlar
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Savol ${_currentQuestionIndex + 1} / ${_questions.length}',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 12),
                Text(
                  q.text,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 24),
                ...List.generate(q.options.length, (optIndex) {
                  final isSelected = selectedOption == optIndex;
                  final optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: GlassCard(
                      onTap: () {
                        setState(() {
                          _answers[q.id] = optIndex;
                        });
                      },
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.border,
                        width: isSelected ? 2 : 1,
                      ),
                      color: isSelected ? AppColors.primary.withOpacity(0.12) : AppColors.card,
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primary : AppColors.surface,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                optionLetter,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : AppColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              q.options[optIndex],
                              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),

        // Pastki boshqaruv tugmalari
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              if (_currentQuestionIndex > 0)
                Expanded(
                  child: CustomButton(
                    text: 'Oldingisi',
                    isOutlined: true,
                    onPressed: () => setState(() => _currentQuestionIndex--),
                  ),
                ),
              if (_currentQuestionIndex > 0) const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _currentQuestionIndex < _questions.length - 1
                    ? CustomButton(
                        text: 'Keyingisi',
                        onPressed: () => setState(() => _currentQuestionIndex++),
                      )
                    : CustomButton(
                        text: 'Testni topshirish',
                        isLoading: _isSubmitting,
                        onPressed: () => _submitTest(autoSubmit: false),
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
