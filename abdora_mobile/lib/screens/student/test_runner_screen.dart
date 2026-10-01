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
          backgroundColor: AppColors.cardBg(ctx),
          title: Text('Testni topshirish', style: TextStyle(color: AppColors.text1(ctx))),
          content: Text(
            'Siz ${_answers.length} ta savolga javob berdingiz (${_questions.length} tadan). Testni yakunlaysizmi?',
            style: TextStyle(color: AppColors.text2(ctx)),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text('Davom etish', style: TextStyle(color: AppColors.textM(ctx))),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.of(context)),
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
            backgroundColor: AppColors.cardBg(ctx),
            title: Text('Testdan chiqish', style: TextStyle(color: AppColors.text1(ctx))),
            content: Text(
              'Test jarayonida chiqsangiz, natijangiz saqlanmasligi mumkin. Rostdan ham chiqmoqchimisiz?',
              style: TextStyle(color: AppColors.text2(ctx)),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Qolish', style: TextStyle(color: AppColors.textM(ctx)))),
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
        backgroundColor: AppColors.bg(context),
        appBar: AppBar(
          title: Text(widget.test.title),
          actions: [
            if (_resultData == null && !_isLoading)
              Container(
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (_remainingSeconds < 120 ? AppColors.danger : AppColors.surfaceCol(context)),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderCol(context)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.timer_outlined, size: 16, color: AppColors.text1(context)),
                    const SizedBox(width: 6),
                    Text(
                      _formatTimer(_remainingSeconds),
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.text1(context)),
                    ),
                  ],
                ),
              ),
          ],
        ),
        body: _isLoading
            ? Center(child: CircularProgressIndicator(color: AppColors.of(context)))
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
              style: TextStyle(color: AppColors.text1(context), fontSize: 20, fontWeight: FontWeight.bold),
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
              style: TextStyle(color: AppColors.textM(context), fontSize: 13),
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
      return Center(child: Text('Savollar topilmadi', style: TextStyle(color: AppColors.textM(context))));
    }

    final q = _questions[_currentQuestionIndex];
    final selectedOption = _answers[q.id];

    return Column(
      children: [
        // Savollar raqamlari navigatori
        Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          color: AppColors.cardBg(context),
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
                          ? AppColors.of(context)
                          : isAnswered
                              ? AppColors.of(context).withOpacity(0.2)
                              : AppColors.surfaceCol(context),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isCurrent ? AppColors.of(context) : AppColors.borderCol(context),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          color: isCurrent ? Colors.white : AppColors.text1(context),
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
                  style: TextStyle(color: AppColors.of(context), fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 12),
                Text(
                  q.text,
                  style: TextStyle(
                    color: AppColors.text1(context),
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
                        color: isSelected ? AppColors.of(context) : AppColors.borderCol(context),
                        width: isSelected ? 2 : 1,
                      ),
                      color: isSelected ? AppColors.of(context).withOpacity(0.12) : AppColors.cardBg(context),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.of(context) : AppColors.surfaceCol(context),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                optionLetter,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : AppColors.text2(context),
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
                              style: TextStyle(color: AppColors.text1(context), fontSize: 14),
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
          decoration: BoxDecoration(
            color: AppColors.cardBg(context),
            border: Border(top: BorderSide(color: AppColors.borderCol(context))),
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
