import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../core/storage/token_storage.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get errorMessage => _errorMessage;

  // Ilova ochilganda sessiyani tekshirish
  Future<bool> tryAutoLogin() async {
    final token = await TokenStorage.getToken();
    if (token == null || token.isEmpty) return false;

    try {
      final response = await ApiClient().dio.get(Endpoints.me);
      if (response.statusCode == 200 && response.data != null) {
        final userData = response.data['data'] ?? response.data['user'] ?? response.data;
        if (userData is Map<String, dynamic>) {
          _user = UserModel.fromJson(userData);
          await TokenStorage.saveUserJson(jsonEncode(_user!.toJson()));
          notifyListeners();
          return true;
        }
      }
    } catch (e) {
      debugPrint('AutoLogin API xatolik: $e, keshdan tekshirilmoqda');
      final cachedUser = await TokenStorage.getUserJson();
      if (cachedUser != null) {
        try {
          _user = UserModel.fromJson(jsonDecode(cachedUser));
          notifyListeners();
          return true;
        } catch (_) {}
      }
    }
    return false;
  }

  // Tizimga kirish
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient().dio.post(
        Endpoints.login,
        data: {
          'username': username.trim(),
          'password': password.trim(),
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] ?? response.data;
        // Backend 'accessToken' yoki 'token' qaytaradi
        final rawToken = data['accessToken'] ?? data['token'];
        final token = rawToken != null ? rawToken.toString() : '';

        if (data['user'] != null && data['user'] is Map<String, dynamic>) {
          _user = UserModel.fromJson(data['user']);
        }

        if (token.isNotEmpty) {
          await TokenStorage.saveToken(token);
        }

        if (_user != null) {
          await TokenStorage.saveUserJson(jsonEncode(_user!.toJson()));
        }

        _isLoading = false;
        notifyListeners();
        return true;
      }
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        final resData = e.response?.data;
        _errorMessage = resData['message'] ?? 'Login yoki parol xato';
      } else {
        _errorMessage = 'Serverga ulanishda xatolik yuz berdi';
      }
    } catch (e, stack) {
      debugPrint('Auth login error: $e\n$stack');
      _errorMessage = 'Xatolik yuz berdi: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Parolni o'zgartirish
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      final res = await ApiClient().dio.post(
        Endpoints.changePassword,
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Profilni yangilash
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      final res = await ApiClient().dio.put(
        Endpoints.updateProfile,
        data: data,
      );
      if (res.statusCode == 200 && res.data['data'] != null) {
        _user = UserModel.fromJson(res.data['data']);
        await TokenStorage.saveUserJson(jsonEncode(_user!.toJson()));
        notifyListeners();
        return true;
      }
    } catch (_) {}
    return false;
  }

  // Tizimdan chiqish
  Future<void> logout() async {
    try {
      await ApiClient().dio.post('/auth/logout');
    } catch (_) {}
    _user = null;
    await TokenStorage.clearAll();
    notifyListeners();
  }
}
