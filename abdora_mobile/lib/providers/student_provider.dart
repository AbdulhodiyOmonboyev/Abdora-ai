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
  List<HomeworkModel> get homework => _homeworkList;
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
        final fetched = list.map((item) => LessonModel.fromJson(item)).toList();
        if (fetched.isNotEmpty) {
          _lessons = fetched;
        } else if (_lessons.isEmpty) {
          _lessons = _getFallbackLessons();
        }
      } else if (_lessons.isEmpty) {
        _lessons = _getFallbackLessons();
      }
    } catch (_) {
      if (_lessons.isEmpty) {
        _lessons = _getFallbackLessons();
      }
    }

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

    _currentLessonAi ??= LessonAiContent();
    notifyListeners();
    return _currentLessonAi;
  }

  List<LessonModel> _getFallbackLessons() {
    return [
      LessonModel(
        id: 'lesson_bio_1',
        title: '1-Dars: Sitologiya — Hujayra tuzilishi va organoidlari',
        content: 'Hujayra barcha tirik organizmlarning eng kichik tuzilish va funksional birligidir. Prokariot va eukariot hujayralarning asosiy farqlari, membrana tuzilishi va organoidlar funksiyasi.',
        orderIndex: 1,
      ),
      LessonModel(
        id: 'lesson_bio_2',
        title: '2-Dars: Moddalar almashinuvi va ATF sintezi (Metabolizm)',
        content: 'Anabolizm va katabolizm jarayonlari. Hujayrada energiya almashinuvi bosqichlari: tayyorgarlik, glikoliz va kislorodli parchalanish (mitoxondriyada ATF hosil bo\'lishi).',
        orderIndex: 2,
      ),
      LessonModel(
        id: 'lesson_bio_3',
        title: '3-Dars: Fotosintez va xemosintez mexanizmlari',
        content: 'Xloroplastlar tuzilishi, xlorofill pigmenti, fotosintezning yorug\'lik va qorong\'ilik bosqichlari. Kalvin sikli va xemosintez qiluvchi bakteriyalar.',
        orderIndex: 3,
      ),
      LessonModel(
        id: 'lesson_bio_4',
        title: '4-Dars: Genetika qonuniyatlari va irsiy belgilar',
        content: 'Mendel qonunlari: dominantlik, ajralish va mustaqil taqsimlanish qonuni. Monogibrid va digibrid chatishtirish masalalari tahlili.',
        orderIndex: 4,
      ),
      LessonModel(
        id: 'lesson_bio_5',
        title: '5-Dars: Seleksiya va biotexnologiya asoslari',
        content: 'O\'simlik va hayvonlar seleksiyasi usullari, sun\'iy tanlash, geterozis hodisasi, poliploidiya hamda gen va hujayra muhandisligi yutuqlari.',
        orderIndex: 5,
      ),
    ];
  }

  // 2. Testlar (Mobil ilovadan chiqarib tashlangan)
  Future<void> fetchTests() async {
    _tests = [];
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
      fetchHomework(),
      fetchLeaderboard(),
      fetchAttendance(),
    ]);
  }
}
