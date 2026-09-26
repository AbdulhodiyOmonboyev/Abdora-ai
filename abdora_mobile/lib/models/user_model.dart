class UserModel {
  final String id;
  final String username;
  final String name;
  final String? phone;
  final String role; // student, teacher, manager, reception, admin
  final int coins;
  final int xp;
  final int level;
  final String? centerId;
  final String? branchId;

  UserModel({
    required this.id,
    required this.username,
    required this.name,
    this.phone,
    required this.role,
    this.coins = 0,
    this.xp = 0,
    this.level = 1,
    this.centerId,
    this.branchId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val, [int fallback = 0]) {
      if (val == null) return fallback;
      if (val is int) return val;
      if (val is double) return val.toInt();
      return int.tryParse(val.toString()) ?? fallback;
    }

    return UserModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      phone: json['phone']?.toString(),
      role: (json['role'] ?? 'student').toString(),
      coins: parseInt(json['coins'], 0),
      xp: parseInt(json['xp'], 0),
      level: parseInt(json['level'], 1),
      centerId: json['centerId']?.toString(),
      branchId: json['branchId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'name': name,
      'phone': phone,
      'role': role,
      'coins': coins,
      'xp': xp,
      'level': level,
      'centerId': centerId,
      'branchId': branchId,
    };
  }
}
