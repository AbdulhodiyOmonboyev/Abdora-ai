import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum NotificationCategory {
  lesson,
  homework,
  exam,
  coin,
  group,
  challenge,
}

class AppNotification {
  final String id;
  final String title;
  final String description;
  final DateTime time;
  final NotificationCategory category;
  final String? route;
  bool isRead;

  AppNotification({
    required this.id,
    required this.title,
    required this.description,
    required this.time,
    required this.category,
    this.route,
    this.isRead = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'time': time.toIso8601String(),
        'category': category.name,
        'route': route,
        'isRead': isRead,
      };

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      time: DateTime.tryParse(json['time'] as String? ?? '') ?? DateTime.now(),
      category: NotificationCategory.values.firstWhere(
        (c) => c.name == json['category'],
        orElse: () => NotificationCategory.lesson,
      ),
      route: json['route'] as String?,
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}

class NotificationProvider extends ChangeNotifier {
  static const String _storageKey = 'abdora_notifications_cache';

  List<AppNotification> _notifications = [];
  bool _isInitialized = false;

  List<AppNotification> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  bool get hasUnread => unreadCount > 0;

  NotificationProvider() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString(_storageKey);
      if (data != null && data.isNotEmpty) {
        final List decoded = jsonDecode(data);
        _notifications = decoded
            .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        _notifications = _generateInitialNotifications();
        await _saveToStorage();
      }
    } catch (_) {
      _notifications = _generateInitialNotifications();
    }
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> _saveToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(_notifications.map((n) => n.toJson()).toList());
      await prefs.setString(_storageKey, encoded);
    } catch (_) {}
  }

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index].isRead = true;
      _saveToStorage();
      notifyListeners();
    }
  }

  void markAllAsRead() {
    bool changed = false;
    for (var n in _notifications) {
      if (!n.isRead) {
        n.isRead = true;
        changed = true;
      }
    }
    if (changed) {
      _saveToStorage();
      notifyListeners();
    }
  }

  void deleteNotification(String id) {
    _notifications.removeWhere((n) => n.id == id);
    _saveToStorage();
    notifyListeners();
  }

  void clearAll() {
    _notifications.clear();
    _saveToStorage();
    notifyListeners();
  }

  void addNotification({
    required String title,
    required String description,
    required NotificationCategory category,
    String? route,
  }) {
    final newNotif = AppNotification(
      id: 'notif_${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      description: description,
      time: DateTime.now(),
      category: category,
      route: route,
      isRead: false,
    );
    _notifications.insert(0, newNotif);
    _saveToStorage();
    notifyListeners();
  }

  List<AppNotification> _generateInitialNotifications() {
    final now = DateTime.now();
    return [
      AppNotification(
        id: 'notif_1',
        title: 'Yangi interaktiv dars qo\'shildi',
        description: 'Lam va Lan farqi arab tili mavzusidagi yangi dars ochildi. AI o\'yinlar bilan sinab ko\'ring.',
        time: now.subtract(const Duration(minutes: 15)),
        category: NotificationCategory.lesson,
        route: 'lessons',
        isRead: false,
      ),
      AppNotification(
        id: 'notif_2',
        title: 'Uyga vazifa baholandi',
        description: 'Arab tili grammatikasi bo\'yicha topshirgan amaliy vazifangiz 95 ball bilan qabul qilindi.',
        time: now.subtract(const Duration(hours: 2)),
        category: NotificationCategory.homework,
        route: 'homework',
        isRead: false,
      ),
      AppNotification(
        id: 'notif_3',
        title: 'Guruhdoshdan duel taklifi',
        description: 'Shukrona sizni "Lam va Lan" mavzusi bo\'yicha blitz o\'yiniga chaqirdi.',
        time: now.subtract(const Duration(hours: 5)),
        category: NotificationCategory.challenge,
        route: 'challenge',
        isRead: false,
      ),
      AppNotification(
        id: 'notif_4',
        title: 'Tangalar mukofoti',
        description: 'Darslarni muvaffaqiyatli yakunlaganingiz uchun hisobingizga +30 ta oltin tanga qo\'shildi.',
        time: now.subtract(const Duration(days: 1)),
        category: NotificationCategory.coin,
        route: 'shop',
        isRead: true,
      ),
      AppNotification(
        id: 'notif_5',
        title: 'Oraliq imtihon e\'loni',
        description: 'Juma kuni soat 14:00 da oraliq nazorat testi bo\'lib o\'tadi. Tayyorgarlik ko\'rishni unutmang.',
        time: now.subtract(const Duration(days: 2)),
        category: NotificationCategory.exam,
        route: 'exams',
        isRead: true,
      ),
    ];
  }
}
