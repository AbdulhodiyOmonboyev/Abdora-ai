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
    return ShopItemModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      priceCoins: json['priceCoins'] ?? 0,
      icon: json['icon'],
      category: json['category'] ?? 'other',
      stock: json['stock'] ?? 99,
    );
  }
}
