import 'package:flutter/services.dart';

class UzPhoneFormatter extends TextInputFormatter {
  static String format(String input) {
    if (input.isEmpty) return '+998 ';

    String digits = input.replaceAll(RegExp(r'\D'), '');

    if (digits.startsWith('998')) {
      digits = digits.substring(3);
    }

    if (digits.length > 9) {
      digits = digits.substring(0, 9);
    }

    if (digits.isEmpty) return '+998 ';

    String res = '+998 ';
    if (digits.isNotEmpty) {
      res += digits.substring(0, digits.length.clamp(0, 2));
    }
    if (digits.length > 2) {
      res += ' ${digits.substring(2, digits.length.clamp(2, 5))}';
    }
    if (digits.length > 5) {
      res += ' ${digits.substring(5, digits.length.clamp(5, 7))}';
    }
    if (digits.length > 7) {
      res += ' ${digits.substring(7, digits.length.clamp(7, 9))}';
    }

    return res;
  }

  static String clean(String input) {
    return input.replaceAll(RegExp(r'\s+'), '').trim();
  }

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Agar foydalanuvchi oddiy username (harf) yozayotgan bo'lsa, erkin qoldiramiz
    if (newValue.text.isNotEmpty && !newValue.text.startsWith('+') && !RegExp(r'^\d').hasMatch(newValue.text)) {
      return newValue;
    }

    final formatted = format(newValue.text);
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
