class PaymentModel {
  final String id;
  final double amount;
  final String type; // income, expense
  final String method; // cash, click, payme, bank
  final String? studentName;
  final String? description;
  final DateTime? date;

  PaymentModel({
    required this.id,
    required this.amount,
    required this.type,
    required this.method,
    this.studentName,
    this.description,
    this.date,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'] ?? '',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      type: json['type'] ?? 'income',
      method: json['method'] ?? 'cash',
      studentName: json['student'] != null ? json['student']['name'] : json['studentName'],
      description: json['description'],
      date: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : DateTime.now(),
    );
  }
}
