import 'package:flutter/material.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/lesson_model.dart';
import '../models/student_models.dart';

class StudentProvider extends ChangeNotifier {
  // Darslar
  List<LessonModel> _lessons = [];
  LessonAiContent? _currentLessonAi;
  bool _isLoadingLessons = false;

  // Testlar
  List<TestModel> _tests = [];
  bool _isLoadingTests = false;

  // Uy vazifalari
  List<HomeworkModel> _homeworkList = [];
  bool _isLoadingHomework = false;

  // Peshqadamlar
  List<LeaderboardEntry> _leaderboard = [];
  bool _isLoadingLeaderboard = false;

  // Davomat
  List<AttendanceRecord> _attendanceRecords = [];
  bool _isLoadingAttendance = false;

  // Getters
  List<LessonModel> get lessons => _lessons;
  LessonAiContent? get currentLessonAi => _currentLessonAi;
  bool get isLoadingLessons => _isLoadingLessons;

  List<TestModel> get tests => _tests;
  bool get isLoadingTests => _isLoadingTests;

  List<HomeworkModel> get homeworkList => _homeworkList;
  bool get isLoadingHomework => _isLoadingHomework;

  List<LeaderboardEntry> get leaderboard => _leaderboard;
  bool get isLoadingLeaderboard => _isLoadingLeaderboard;

  List<AttendanceRecord> get attendanceRecords => _attendanceRecords;
  bool get isLoadingAttendance => _isLoadingAttendance;

  // 1. Darslarni yuklash
  Future<void> fetchLessons() async {
    _isLoadingLessons = true;
    notifyListeners();

    try {
      final res = await ApiClient().dio.get(Endpoints.lessons);
      if (res.statusCode == 200 && res.data['data'] != null) {
        final List list = res.data['data'];
        _lessons = list.map((item) => LessonModel.fromJson(item)).toList();
      }
    } catch (_) {}

    _isLoadingLessons = false;
    notifyListeners();
  }

  // Darsning AI kontentini olish
  Future<LessonAiContent?> fetchLessonAi(String lessonId) async {
    try {
      final res = await ApiClient().dio.get(Endpoints.lessonAi(lessonId));
      if (res.statusCode == 200 && res.data['data'] != null) {
        _currentLessonAi = LessonAiContent.fromJson(res.data['data']);
        notifyListeners();
        return _currentLessonAi;
      }
    } catch (_) {}
    return null;
  }

  // 2. Testlarni yuklash
  Future<void> fetchTests() async {
    _isLoadingTests = true;
    notifyListeners();

    try {
      final res = await ApiClient().dio.get(Endpoints.tests);
      if (res.statusCode == 200 && res.data['data'] != null) {
        final List list = res.data['data'];
        _tests = list.map((item) => TestModel.fromJson(item)).toList();
      }
    } catch (_) {}

    _isLoadingTests = false;
    notifyListeners();
  }

  // Test savollarini olish
  Future<List<QuestionModel>> fetchTestQuestions(String testId) async {
    try {
      final res = await ApiClient().dio.get(Endpoints.testDetail(testId));
      if (res.statusCode == 200 && res.data['data'] != null) {
        final questionsRaw = res.data['data']['questions'] as List? ?? [];
        return questionsRaw.map((q) => QuestionModel.fromJson(q)).toList();
      }
    } catch (_) {}
    return [];
  }

  // Testni topshirish
  Future<Map<String, dynamic>?> submitTest(String testId, Map<String, int> answers, int timeTaken) async {
    try {
      final formattedAnswers = answers.entries.map((e) => {
        'questionId': e.key,
        'answer': e.value,
      }).toList();

      final res = await ApiClient().dio.post(
        Endpoints.submitTest(testId),
        data: {
          'answers': formattedAnswers,
          'timeTaken': timeTaken,
        },
      );

      if (res.statusCode == 200 && res.data['data'] != null) {
        await fetchTests(); // Testlar ro'yxatini yangilash
        return res.data['data'];
      }
    } catch (_) {}
    return null;
  }

  // 3. Uy vazifalarini yuklash
  Future<void> fetchHomework() async {
    _isLoadingHomework = true;
    notifyListeners();

    try {
      final res = await ApiClient().dio.get(Endpoints.studentHomework);
      if (res.statusCode == 200 && res.data['data'] != null) {
        final List list = res.data['data'];
        _homeworkList = list.map((item) => HomeworkModel.fromJson(item)).toList();
      }
    } catch (_) {}

    _isLoadingHomework = false;
    notifyListeners();
  }

  // Uy vazifasini topshirish
  Future<bool> submitHomework(String homeworkId, String answerText) async {
    try {
      final res = await ApiClient().dio.post(
        Endpoints.submitHomework(homeworkId),
        data: {'answerText': answerText},
      );
      if (res.statusCode == 200) {
        await fetchHomework();
        return true;
      }
    } catch (_) {}
    return false;
  }

  // 4. Peshqadamlar reytingini olish
  Future<void> fetchLeaderboard() async {
    _isLoadingLeaderboard = true;
    notifyListeners();

    try {
      final res = await ApiClient().dio.get(Endpoints.leaderboard);
      if (res.statusCode == 200 && res.data['data'] != null) {
        final List list = res.data['data'];
        int rank = 1;
        _leaderboard = list.map((item) => LeaderboardEntry.fromJson(item, rank++)).toList();
      }
    } catch (_) {}

    _isLoadingLeaderboard = false;
    notifyListeners();
  }

  // 5. Davomat tarixini yuklash
  Future<void> fetchAttendance() async {
    _isLoadingAttendance = true;
    notifyListeners();

    try {
      final res = await ApiClient().dio.get(Endpoints.attendanceMy);
      if (res.statusCode == 200 && res.data['data'] != null) {
        final List list = res.data['data'];
        _attendanceRecords = list.map((item) => AttendanceRecord.fromJson(item)).toList();
      }
    } catch (_) {}

    _isLoadingAttendance = false;
    notifyListeners();
  }

  // Hammasini yangilash (Pull-to-refresh)
  Future<void> refreshAll() async {
    await Future.wait([
      fetchLessons(),
      fetchTests(),
      fetchHomework(),
      fetchLeaderboard(),
      fetchAttendance(),
    ]);
  }
}
