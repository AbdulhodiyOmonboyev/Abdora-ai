import 'package:flutter/material.dart';

class AppColors {
  // Qorong'u rejim (Dark theme) ranglari - Obsidian & Navy Charcoal
  static const Color darkBackground = Color(0xFF080D17);
  static const Color darkSecondaryBackground = Color(0xFF141E2D);
  static const Color darkSurface = Color(0xFF141E2D);
  static const Color darkCard = Color(0xFF101827);
  static const Color darkBorder = Color(0xFF223047);
  static const Color darkDivider = Color(0xFF1E2D42);
  static const Color darkInputBg = Color(0xFF0B111D);
  static const Color darkNavbarBg = Color(0xFF0B111D);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextMuted = Color(0xFF64748B);

  // Yorug' rejim (Light theme) ranglari - Clean Modern Slate & Pure White
  static const Color lightBackground = Color(0xFFF6F8FC);
  static const Color lightSecondaryBackground = Color(0xFFEEF2F6);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightDivider = Color(0xFFE2E8F0);
  static const Color lightInputBg = Color(0xFFF1F5F9);
  static const Color lightNavbarBg = Color(0xFFFFFFFF);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF475569);
  static const Color lightTextMuted = Color(0xFF94A3B8);

  // Standart doimiy ranglar (Barcha mavjud const ifodalar uchun to'liq moslik)
  static const Color background = darkBackground;
  static const Color secondaryBackground = darkSecondaryBackground;
  static const Color surface = darkSurface;
  static const Color card = darkCard;
  static const Color border = darkBorder;
  static const Color divider = darkDivider;
  static const Color inputBg = darkInputBg;
  static const Color navbarBackground = darkNavbarBg;
  static const Color textPrimary = darkTextPrimary;
  static const Color textSecondary = darkTextSecondary;
  static const Color textMuted = darkTextMuted;

  // Web brend rangi: Vibrant Electric Orange (static const)
  static const Color primary = Color(0xFFFF6A00);
  static const Color primaryDark = Color(0xFFD9530B);
  static const Color primaryLight = Color(0xFFFFA269);
  static const Color primary50 = Color(0xFFFFF2E9);

  // Dinamik mavzuli yordamchi usullar (Context orqali Dark / Light rejimga mos ranglar)
  static bool isDark(BuildContext context) => Theme.of(context).brightness == Brightness.dark;
  static Color of(BuildContext context) => Theme.of(context).primaryColor;
  static Color bg(BuildContext context) => isDark(context) ? darkBackground : lightBackground;
  static Color cardBg(BuildContext context) => isDark(context) ? darkCard : lightCard;
  static Color surfaceCol(BuildContext context) => isDark(context) ? darkSurface : lightSurface;
  static Color borderCol(BuildContext context) => isDark(context) ? darkBorder : lightBorder;
  static Color dividerCol(BuildContext context) => isDark(context) ? darkDivider : lightDivider;
  static Color inputCol(BuildContext context) => isDark(context) ? darkInputBg : lightInputBg;
  static Color navBg(BuildContext context) => isDark(context) ? darkNavbarBg : lightNavbarBg;
  static Color text1(BuildContext context) => isDark(context) ? darkTextPrimary : lightTextPrimary;
  static Color text2(BuildContext context) => isDark(context) ? darkTextSecondary : lightTextSecondary;
  static Color textM(BuildContext context) => isDark(context) ? darkTextMuted : lightTextMuted;

  // Ikkilamchi rang: Royal Electric Blue
  static const Color secondary = Color(0xFF4D8DFF);
  static const Color secondaryDark = Color(0xFF1D4ED8);
  static const Color secondaryLight = Color(0xFF93C5FD);

  // Aksent ranglar
  static const Color accent = Color(0xFF9A72FF);
  static const Color accentPurple = Color(0xFF7C3AED);
  static const Color coinGold = Color(0xFFF59E0B);
  static const Color coinGoldLight = Color(0xFFFBBF24);

  // Semantik holat ranglari
  static const Color success = Color(0xFF25C58A);
  static const Color successBg = Color(0x1A25C58A);
  static const Color warning = Color(0xFFD97706);
  static const Color warningBg = Color(0x1AD97706);
  static const Color danger = Color(0xFFDC2626);
  static const Color error = Color(0xFFDC2626);
  static const Color info = Color(0xFF2563EB);
}
