import 'package:flutter/material.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/shop_model.dart';

class ShopProvider extends ChangeNotifier {
  List<ShopItemModel> _items = [];
  bool _isLoading = false;

  List<ShopItemModel> get items => _items;
  bool get isLoading => _isLoading;

  Future<void> fetchItems() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiClient().dio.get(Endpoints.shopItems);
      if (response.statusCode == 200 && response.data['data'] != null) {
        final List list = response.data['data'];
        _items = list.map((item) => ShopItemModel.fromJson(item)).toList();
      }
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> buyItem(String itemId) async {
    try {
      final response = await ApiClient().dio.post(
        Endpoints.buyShopItem,
        data: {'itemId': itemId},
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
