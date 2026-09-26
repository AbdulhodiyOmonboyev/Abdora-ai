class ShopItemModel {
  final String id;
  final String title;
  final String description;
  final int priceCoins;
  final String? icon;
  final String category;
  final int stock;

  ShopItemModel({
    required this.id,
    required this.title,
    required this.description,
    required this.priceCoins,
    this.icon,
    this.category = 'other',
    this.stock = 99,
  });

  factory ShopItemModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val, [int fallback = 0]) {
      if (val == null) return fallback;
      if (val is int) return val;
      if (val is double) return val.toInt();
      return int.tryParse(val.toString()) ?? fallback;
    }

    return ShopItemModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      priceCoins: parseInt(json['priceCoins'], 0),
      icon: json['icon']?.toString(),
      category: (json['category'] ?? 'other').toString(),
      stock: parseInt(json['stock'], 99),
    );
  }
}
