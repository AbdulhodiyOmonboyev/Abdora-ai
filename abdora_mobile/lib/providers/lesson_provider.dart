import 'package:flutter/material.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/lesson_model.dart';

class LessonProvider extends ChangeNotifier {
  List<LessonModel> _lessons = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<LessonModel> get lessons => _lessons;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchLessons() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient().dio.get(Endpoints.lessons);
      if (response.statusCode == 200 && response.data['data'] != null) {
        final List list = response.data['data'];
        _lessons = list.map((item) => LessonModel.fromJson(item)).toList();
      }
    } catch (e) {
      _errorMessage = 'Darslarni yuklashda xatolik yuz berdi';
    }

    _isLoading = false;
    notifyListeners();
  }
}
