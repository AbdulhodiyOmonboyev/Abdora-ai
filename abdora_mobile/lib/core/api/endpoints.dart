class Endpoints {
  // Asosiy server manzili (Emulyator: 10.0.2.2, Jonli server: Render / Domeningiz)
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  // Autentifikatsiya va Profil
  static const String login = '/auth/login';
  static const String me = '/auth/me';
  static const String refresh = '/auth/refresh';
  static const String updateProfile = '/users/profile';
  static const String changePassword = '/users/change-password';
  static String studentHistory(String id) => '/users/$id/history';

  // Darslar va Multimodal AI
  static const String lessons = '/lessons';
  static String lessonDetail(String id) => '/lessons/$id';
  static String lessonAi(String id) => '/lessons/$id/ai';
  static String lessonAiChat(String id) => '/lessons/$id/ai-chat';
  static String lessonAiChatHistory(String id) => '/lessons/$id/ai-chat/history';
  static String lessonStoryAudio(String id) => '/lessons/$id/ai/story-audio';
  static String lessonVoiceAudio(String id) => '/lessons/$id/ai/voice-audio';

  // Topshiriqlar va Testlar
  static const String tests = '/tests';
  static String testDetail(String id) => '/tests/$id';
  static String submitTest(String id) => '/tests/$id/submit';
  static const String testResults = '/tests/results';

  // Uy vazifalari
  static const String studentHomework = '/homework/student';
  static String submitHomework(String id) => '/homework/$id/submit';

  // O'quvchi Do'koni (Tangalar iqtisodiyoti)
  static const String shopItems = '/shop/items';
  static const String purchaseShopItem = '/shop/purchase';
  static const String myOrders = '/shop/orders';

  // Gamifikatsiya, Reyting va Davomat
  static const String leaderboard = '/analytics/leaderboard';
  static const String studentProgress = '/student/progress';
  static const String attendanceMy = '/attendance/my';
  static const String certificates = '/student/certificates';
  static const String notifications = '/analytics/notifications';
  static const String markNotificationsRead = '/analytics/notifications/read';
}
