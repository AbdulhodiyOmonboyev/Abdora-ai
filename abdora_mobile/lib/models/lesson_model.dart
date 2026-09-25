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
    return LessonModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'],
      videoUrl: json['videoUrl'],
      audioUrl: json['audioUrl'],
      orderIndex: json['orderIndex'] ?? 0,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}
