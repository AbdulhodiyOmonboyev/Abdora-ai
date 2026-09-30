import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageOption {
  final String code;
  final String name;
  final String localName;
  final String badge;

  const LanguageOption({
    required this.code,
    required this.name,
    required this.localName,
    required this.badge,
  });
}

class LocaleProvider extends ChangeNotifier {
  static const String _storageKey = 'selected_app_language_code';

  final List<LanguageOption> supportedLanguages = const [
    LanguageOption(
      code: 'uz',
      name: 'O\'zbekcha',
      localName: 'O\'zbek tili',
      badge: 'UZ',
    ),
    LanguageOption(
      code: 'ru',
      name: 'Русский',
      localName: 'Русский язык',
      badge: 'RU',
    ),
    LanguageOption(
      code: 'en',
      name: 'English',
      localName: 'English language',
      badge: 'EN',
    ),
  ];

  String _currentLanguageCode = 'uz';

  String get currentLanguageCode => _currentLanguageCode;

  LanguageOption get currentLanguage => supportedLanguages.firstWhere(
        (lang) => lang.code == _currentLanguageCode,
        orElse: () => supportedLanguages.first,
      );

  LocaleProvider() {
    _loadSavedLanguage();
  }

  Future<void> _loadSavedLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedCode = prefs.getString(_storageKey);
      if (savedCode != null && supportedLanguages.any((l) => l.code == savedCode)) {
        _currentLanguageCode = savedCode;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> setLanguage(String code) async {
    if (_currentLanguageCode == code) return;
    if (!supportedLanguages.any((l) => l.code == code)) return;

    _currentLanguageCode = code;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, code);
    } catch (_) {}
  }

  // Umumiy atamalar tarjimasi
  String translate(String key) {
    final translations = _dictionary[_currentLanguageCode] ?? _dictionary['uz']!;
    return translations[key] ?? key;
  }

  static const Map<String, Map<String, String>> _dictionary = {
    'uz': {
      'lessons': 'Darslar',
      'homework': 'Uyga vazifa',
      'exams': 'Imtihonlar',
      'ratings': 'Reyting',
      'profile': 'Profil',
      'useful': 'Foydali',
      'shop': 'Do\'kon',
      'settings': 'Sozlamalar',
      'theme': 'Mavzu',
      'language': 'Til sozlamalari',
      'logout': 'Chiqish',
      'search': 'Qidirish',
      'refresh': 'Yangilash',
    },
    'ru': {
      'lessons': 'Уроки',
      'homework': 'Домашние задания',
      'exams': 'Экзамены',
      'ratings': 'Рейтинг',
      'profile': 'Профиль',
      'useful': 'Полезное',
      'shop': 'Магазин',
      'settings': 'Настройки',
      'theme': 'Тема',
      'language': 'Настройки языка',
      'logout': 'Выйти',
      'search': 'Поиск',
      'refresh': 'Обновить',
    },
    'en': {
      'lessons': 'Lessons',
      'homework': 'Homework',
      'exams': 'Exams',
      'ratings': 'Leaderboard',
      'profile': 'Profile',
      'useful': 'Useful',
      'shop': 'Shop',
      'settings': 'Settings',
      'theme': 'Theme',
      'language': 'Language settings',
      'logout': 'Log out',
      'search': 'Search',
      'refresh': 'Refresh',
    },
  };
}
