class LessonModel {
  final String id;
  final String title;
  final String? content;
  final String? videoUrl;
  final String? audioUrl;
  final int orderIndex;
  final DateTime? createdAt;

  LessonModel({
    required this.id,
    required this.title,
    this.content,
    this.videoUrl,
    this.audioUrl,
    this.orderIndex = 0,
    this.createdAt,
  });

  factory LessonModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val, [int fallback = 0]) {
      if (val == null) return fallback;
      if (val is int) return val;
      if (val is double) return val.toInt();
      return int.tryParse(val.toString()) ?? fallback;
    }

    return LessonModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      content: json['content']?.toString(),
      videoUrl: json['videoUrl']?.toString(),
      audioUrl: json['audioUrl']?.toString(),
      orderIndex: parseInt(json['orderIndex'], 0),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }
}
