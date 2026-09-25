import 'package:flutter/material.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/lead_model.dart';

class LeadProvider extends ChangeNotifier {
  List<LeadModel> _leads = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<LeadModel> get leads => _leads;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchLeads() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient().dio.get(Endpoints.leads);
      if (response.statusCode == 200 && response.data['data'] != null) {
        final List list = response.data['data'];
        _leads = list.map((item) => LeadModel.fromJson(item)).toList();
      }
    } catch (e) {
      _errorMessage = 'Lidlarni yuklashda xatolik yuz berdi';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createLead(String name, String phone, {String? source, String? note}) async {
    try {
      final response = await ApiClient().dio.post(
        Endpoints.leads,
        data: {
          'name': name.trim(),
          'phone': phone.trim(),
          'source': source ?? 'mobile',
          'note': note,
        },
      );
      if (response.statusCode == 201 && response.data['data'] != null) {
        _leads.insert(0, LeadModel.fromJson(response.data['data']));
        notifyListeners();
        return true;
      }
    } catch (_) {}
    return false;
  }
}
