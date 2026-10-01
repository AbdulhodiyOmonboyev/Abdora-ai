import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';

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
    NotificationCategory cat = NotificationCategory.lesson;
    final rawCat = (json['type'] ?? json['category'] ?? '').toString().toLowerCase();
    if (rawCat.contains('home') || rawCat.contains('vazifa')) {
      cat = NotificationCategory.homework;
    } else if (rawCat.contains('exam') || rawCat.contains('test')) {
      cat = NotificationCategory.exam;
    } else if (rawCat.contains('coin') || rawCat.contains('achieve') || rawCat.contains('bonus')) {
      cat = NotificationCategory.coin;
    } else if (rawCat.contains('chal') || rawCat.contains('game') || rawCat.contains('duel')) {
      cat = NotificationCategory.challenge;
    } else if (rawCat.contains('group')) {
      cat = NotificationCategory.group;
    } else {
      cat = NotificationCategory.lesson;
    }

    return AppNotification(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Bildirishnoma',
      description: json['message']?.toString() ?? json['description']?.toString() ?? '',
      time: DateTime.tryParse(json['createdAt']?.toString() ?? json['time']?.toString() ?? '') ?? DateTime.now(),
      category: cat,
      route: json['link']?.toString() ?? json['route']?.toString(),
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}

class NotificationProvider extends ChangeNotifier {
  static const String _storageKey = 'abdora_notifications_cache';

  List<AppNotification> _notifications = [];
  bool _isLoading = false;

  List<AppNotification> get notifications => List.unmodifiable(_notifications);
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;
  bool get hasUnread => unreadCount > 0;

  NotificationProvider() {
    _init();
  }

  Future<void> _init() async {
    await _loadFromStorage();
    await fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    try {
      final res = await ApiClient().dio.get(Endpoints.notifications);
      if (res.statusCode == 200 && res.data != null) {
        final raw = res.data['data'] ?? res.data;
        if (raw is List) {
          _notifications = raw
              .map((it) => AppNotification.fromJson(it as Map<String, dynamic>))
              .toList();
          await _saveToStorage();
          notifyListeners();
        }
      }
    } catch (_) {
      // Xatolik yoki oflayn holatda keshdagi ma'lumot qoladi
    }
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString(_storageKey);
      if (data != null && data.isNotEmpty) {
        final List decoded = jsonDecode(data);
        // Eski soxta mock bildirishnomalarni tozalash
        final isMock = decoded.any((it) => it['id'] == 'notif_1' || it['id'] == 'notif_2');
        if (isMock) {
          _notifications = [];
          await prefs.remove(_storageKey);
        } else {
          _notifications = decoded
              .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
              .toList();
        }
      } else {
        _notifications = [];
      }
    } catch (_) {
      _notifications = [];
    }
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

  Future<void> markAllAsRead() async {
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
    try {
      await ApiClient().dio.put(Endpoints.markNotificationsRead);
    } catch (_) {}
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
}
