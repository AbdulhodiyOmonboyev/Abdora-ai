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
    return UserModel(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'student',
      coins: json['coins'] is int ? json['coins'] : int.tryParse(json['coins']?.toString() ?? '0') ?? 0,
      xp: json['xp'] is int ? json['xp'] : int.tryParse(json['xp']?.toString() ?? '0') ?? 0,
      level: json['level'] is int ? json['level'] : int.tryParse(json['level']?.toString() ?? '1') ?? 1,
      centerId: json['centerId'],
      branchId: json['branchId'],
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
