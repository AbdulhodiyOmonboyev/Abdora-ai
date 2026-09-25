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
      if (response.statusCode == 200 && response.data['data'] != null) {
        _user = UserModel.fromJson(response.data['data']);
        await TokenStorage.saveUserJson(jsonEncode(_user!.toJson()));
        notifyListeners();
        return true;
      }
    } catch (_) {
      final cachedUser = await TokenStorage.getUserJson();
      if (cachedUser != null) {
        _user = UserModel.fromJson(jsonDecode(cachedUser));
        notifyListeners();
        return true;
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

      if (response.statusCode == 200 && response.data['data'] != null) {
        final data = response.data['data'];
        final token = data['token'];
        _user = UserModel.fromJson(data['user']);

        await TokenStorage.saveToken(token);
        await TokenStorage.saveUserJson(jsonEncode(_user!.toJson()));

        _isLoading = false;
        notifyListeners();
        return true;
      }
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        _errorMessage = e.response?.data['message'] ?? 'Login yoki parol xato';
      } else {
        _errorMessage = 'Serverga ulanishda xatolik yuz berdi';
      }
    } catch (e) {
      _errorMessage = 'Noma\'lum xatolik yuz berdi';
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
