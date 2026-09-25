// Darsning AI tahlil va o'rganish kontenti
class LessonAiContent {
  final String status;
  final String simpleExplanation;
  final String mnemonics;
  final String storyMode;
  final List<String> summary;
  final List<Map<String, String>> realLifeExamples;
  final List<FlashcardItem> flashcards;
  final List<QuizQuestionItem> quizQuestions;
  final Map<String, dynamic>? mindMapData;

  LessonAiContent({
    this.status = 'none',
    this.simpleExplanation = '',
    this.mnemonics = '',
    this.storyMode = '',
    this.summary = const [],
    this.realLifeExamples = const [],
    this.flashcards = const [],
    this.quizQuestions = const [],
    this.mindMapData,
  });

  factory LessonAiContent.fromJson(Map<String, dynamic>? json) {
    if (json == null) return LessonAiContent();

    final rawFlashcards = json['flashcards'] as List? ?? [];
    final rawQuiz = json['quizQuestions'] as List? ?? [];
    final rawSummary = json['summary'];
    final rawExamples = json['realLifeExamples'] as List? ?? [];

    List<String> parsedSummary = [];
    if (rawSummary is List) {
      parsedSummary = rawSummary.map((e) => e.toString()).toList();
    } else if (rawSummary is String && rawSummary.isNotEmpty) {
      parsedSummary = [rawSummary];
    }

    return LessonAiContent(
      status: json['status'] ?? 'done',
      simpleExplanation: json['simpleExplanation'] ?? '',
      mnemonics: json['mnemonics'] ?? '',
      storyMode: json['storyMode'] ?? '',
      summary: parsedSummary,
      realLifeExamples: rawExamples.map((e) {
        if (e is Map) {
          return {
            'title': e['category']?.toString() ?? e['title']?.toString() ?? 'Misol',
            'desc': e['example']?.toString() ?? e['desc']?.toString() ?? '',
          };
        }
        return {'title': 'Misol', 'desc': e.toString()};
      }).toList(),
      flashcards: rawFlashcards.map((f) => FlashcardItem.fromJson(f)).toList(),
      quizQuestions: rawQuiz.map((q) => QuizQuestionItem.fromJson(q)).toList(),
      mindMapData: json['mindMapData'] is Map<String, dynamic> ? json['mindMapData'] : null,
    );
  }
}

class FlashcardItem {
  final String front;
  final String back;

  FlashcardItem({required this.front, required this.back});

  factory FlashcardItem.fromJson(dynamic json) {
    if (json is Map) {
      return FlashcardItem(
        front: json['question'] ?? json['front'] ?? '',
        back: json['answer'] ?? json['back'] ?? '',
      );
    }
    return FlashcardItem(front: '', back: '');
  }
}

class QuizQuestionItem {
  final String question;
  final List<String> options;
  final int correctIndex;
  final String explanation;

  QuizQuestionItem({
    required this.question,
    required this.options,
    required this.correctIndex,
    required this.explanation,
  });

  factory QuizQuestionItem.fromJson(dynamic json) {
    if (json is! Map) {
      return QuizQuestionItem(question: '', options: [], correctIndex: 0, explanation: '');
    }

    List<String> opts = [];
    int correctIdx = 0;

    if (json['options'] is List) {
      final rawOpts = json['options'] as List;
      for (int i = 0; i < rawOpts.length; i++) {
        final opt = rawOpts[i];
        if (opt is Map) {
          opts.add(opt['text']?.toString() ?? '');
          if (opt['isCorrect'] == true) correctIdx = i;
        } else {
          opts.add(opt.toString());
        }
      }
    }

    return QuizQuestionItem(
      question: json['question'] ?? json['text'] ?? '',
      options: opts,
      correctIndex: correctIdx,
      explanation: json['explanation'] ?? '',
    );
  }
}

// Test va Savollar modeli
class TestModel {
  final String id;
  final String title;
  final int timeLimit; // daqiqa
  final int passingScore;
  final int totalPoints;
  final int questionCount;
  final bool isCompleted;
  final int? lastScore;
  final bool? lastPassed;

  TestModel({
    required this.id,
    required this.title,
    required this.timeLimit,
    required this.passingScore,
    required this.totalPoints,
    required this.questionCount,
    this.isCompleted = false,
    this.lastScore,
    this.lastPassed,
  });

  factory TestModel.fromJson(Map<String, dynamic> json) {
    final count = json['_count']?['questions'] ?? json['questions']?.length ?? 10;
    return TestModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      timeLimit: json['timeLimit'] ?? 20,
      passingScore: json['passingScore'] ?? 60,
      totalPoints: json['totalPoints'] ?? 100,
      questionCount: count,
      isCompleted: json['result'] != null || json['isCompleted'] == true,
      lastScore: json['result']?['percentage'],
      lastPassed: json['result']?['passed'],
    );
  }
}

class QuestionModel {
  final String id;
  final String text;
  final List<String> options;
  final int points;

  QuestionModel({
    required this.id,
    required this.text,
    required this.options,
    required this.points,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    List<String> opts = [];
    if (json['options'] is List) {
      for (var o in (json['options'] as List)) {
        if (o is Map) {
          opts.add(o['text']?.toString() ?? '');
        } else {
          opts.add(o.toString());
        }
      }
    }
    return QuestionModel(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      options: opts,
      points: json['points'] ?? 1,
    );
  }
}

// Uy vazifasi modeli
class HomeworkModel {
  final String id;
  final String title;
  final String description;
  final DateTime? dueDate;
  final int maxScore;
  final bool isSubmitted;
  final String status; // 'none', 'submitted', 'ai_graded', 'graded'
  final int? finalScore;
  final String? feedback;

  HomeworkModel({
    required this.id,
    required this.title,
    required this.description,
    this.dueDate,
    required this.maxScore,
    this.isSubmitted = false,
    this.status = 'none',
    this.finalScore,
    this.feedback,
  });

  factory HomeworkModel.fromJson(Map<String, dynamic> json) {
    final submissions = json['submissions'] as List? ?? [];
    final sub = submissions.isNotEmpty ? submissions.first : null;

    return HomeworkModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate']) : null,
      maxScore: json['maxScore'] ?? 100,
      isSubmitted: sub != null,
      status: sub?['status'] ?? 'none',
      finalScore: sub?['finalScore'],
      feedback: sub?['teacherGrade']?['feedback'] ?? sub?['aiGrade']?['feedback'],
    );
  }
}

// Peshqadamlar reytingi modeli
class LeaderboardEntry {
  final String id;
  final String name;
  final String username;
  final int xp;
  final int level;
  final int coins;
  final int streak;
  final int rank;

  LeaderboardEntry({
    required this.id,
    required this.name,
    required this.username,
    required this.xp,
    required this.level,
    required this.coins,
    required this.streak,
    required this.rank,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json, int rankIndex) {
    return LeaderboardEntry(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      xp: json['xp'] ?? 0,
      level: json['level'] ?? 1,
      coins: json['coins'] ?? 0,
      streak: json['streakCurrent'] ?? 0,
      rank: rankIndex,
    );
  }
}

// Davomat yozuvi modeli
class AttendanceRecord {
  final DateTime date;
  final String status; // 'present', 'absent', 'late', 'excused'
  final String? note;

  AttendanceRecord({
    required this.date,
    required this.status,
    this.note,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      date: json['date'] != null ? DateTime.tryParse(json['date']) ?? DateTime.now() : DateTime.now(),
      status: json['status'] ?? 'present',
      note: json['note'],
    );
  }
}
