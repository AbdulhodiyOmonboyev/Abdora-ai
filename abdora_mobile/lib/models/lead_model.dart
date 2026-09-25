class LeadModel {
  final String id;
  final String name;
  final String phone;
  final String status; // new, contacted, trial, enrolled, lost
  final String? source;
  final String? note;
  final DateTime? createdAt;

  LeadModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.status,
    this.source,
    this.note,
    this.createdAt,
  });

  factory LeadModel.fromJson(Map<String, dynamic> json) {
    return LeadModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      status: json['status'] ?? 'new',
      source: json['source'],
      note: json['note'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}
