class LessonModel {
  final String id;
  final String title;
  final String? content;
  final String? videoUrl;
  final String? audioUrl;
  final String? subject;
  final String? groupName;
  final String? teacherName;
  final int orderIndex;
  final DateTime? createdAt;

  LessonModel({
    required this.id,
    required this.title,
    this.content,
    this.videoUrl,
    this.audioUrl,
    this.subject,
    this.groupName,
    this.teacherName,
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
      subject: json['subject']?.toString(),
      groupName: json['group'] is Map ? json['group']['name']?.toString() : json['groupName']?.toString(),
      teacherName: json['teacher'] is Map ? json['teacher']['name']?.toString() : json['teacherName']?.toString(),
      orderIndex: parseInt(json['orderIndex'] ?? json['order'], 0),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }
}
