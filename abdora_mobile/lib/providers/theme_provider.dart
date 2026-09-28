import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';
import '../core/theme/app_theme.dart';

class ThemeColorOption {
  final String name;
  final Color primary;
  final Color dark;
  final Color light;

  const ThemeColorOption({
    required this.name,
    required this.primary,
    required this.dark,
    required this.light,
  });
}

class ThemeProvider extends ChangeNotifier {
  static const String _keyThemeIndex = 'selected_theme_color_index';

  final List<ThemeColorOption> availableColors = const [
    ThemeColorOption(
      name: 'To\'q sariq (Asl brend)',
      primary: Color(0xFFFF6A00),
      dark: Color(0xFFD9530B),
      light: Color(0xFFFFA269),
    ),
    ThemeColorOption(
      name: 'Qirollik ko\'k',
      primary: Color(0xFF3B82F6),
      dark: Color(0xFF1D4ED8),
      light: Color(0xFF93C5FD),
    ),
    ThemeColorOption(
      name: 'Zumrad yashil',
      primary: Color(0xFF10B981),
      dark: Color(0xFF047857),
      light: Color(0xFF6EE7B7),
    ),
    ThemeColorOption(
      name: 'Siyohrang',
      primary: Color(0xFF8B5CF6),
      dark: Color(0xFF6D28D9),
      light: Color(0xFFC4B5FD),
    ),
    ThemeColorOption(
      name: 'Yoqut qizil',
      primary: Color(0xFFEF4444),
      dark: Color(0xFFB91C1C),
      light: Color(0xFFFCA5A5),
    ),
    ThemeColorOption(
      name: 'Oltin sariq',
      primary: Color(0xFFF59E0B),
      dark: Color(0xFFB45309),
      light: Color(0xFFFDE68A),
    ),
    ThemeColorOption(
      name: 'Moviy feruza',
      primary: Color(0xFF06B6D4),
      dark: Color(0xFF0E7490),
      light: Color(0xFF67E8F9),
    ),
  ];

  int _selectedIndex = 0;

  int get selectedIndex => _selectedIndex;
  ThemeColorOption get currentColor => availableColors[_selectedIndex];
  Color get primaryColor => currentColor.primary;

  ThemeData get currentTheme => AppTheme.getTheme(primary: currentColor.primary);

  ThemeProvider() {
    _loadSavedTheme();
  }

  Future<void> _loadSavedTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedIndex = prefs.getInt(_keyThemeIndex);
      if (savedIndex != null && savedIndex >= 0 && savedIndex < availableColors.length) {
        _selectedIndex = savedIndex;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> setThemeColor(int index) async {
    if (index < 0 || index >= availableColors.length) return;
    _selectedIndex = index;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_keyThemeIndex, index);
    } catch (_) {}
  }
}
