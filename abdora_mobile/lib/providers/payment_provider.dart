import 'package:flutter/material.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/payment_model.dart';

class PaymentProvider extends ChangeNotifier {
  List<PaymentModel> _payments = [];
  bool _isLoading = false;
  double _todayCash = 0.0;

  List<PaymentModel> get payments => _payments;
  bool get isLoading => _isLoading;
  double get todayCash => _todayCash;

  Future<void> fetchPayments() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiClient().dio.get(Endpoints.payments);
      if (response.statusCode == 200 && response.data['data'] != null) {
        final List list = response.data['data'];
        _payments = list.map((item) => PaymentModel.fromJson(item)).toList();
        
        // Bugungi kassa tushumini hisoblash
        _todayCash = _payments
            .where((p) => p.type == 'income')
            .fold(0.0, (sum, p) => sum + p.amount);
      }
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }
}
