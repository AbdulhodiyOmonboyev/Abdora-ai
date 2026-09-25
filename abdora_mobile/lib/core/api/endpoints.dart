class Endpoints {
  // Asosiy server manzili (Lokal emulyator yoki server)
  // Android Emulator: http://10.0.2.2:5000/api
  // Haqiqiy qurilma / Production: https://api.abdora.uz/api
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  // Auth
  static const String login = '/auth/login';
  static const String me = '/auth/me';
  static const String changePassword = '/auth/change-password';

  // Darslar va LMS
  static const String lessons = '/lessons';
  static const String studentLessons = '/lessons/student';
  static const String tests = '/tests';

  // O'quvchi do'koni va gamifikatsiya
  static const String shopItems = '/shop/items';
  static const String buyShopItem = '/shop/buy';
  static const String myOrders = '/shop/my-orders';
  static const String leaderboard = '/gamification/leaderboard';

  // CRM Lidlar
  static const String leads = '/leads';
  static const String leadStages = '/leads/stages';

  // Moliya va Kassa
  static const String payments = '/payments';
  static const String cashbox = '/finance/cashbox';
  static const String financeSummary = '/finance/summary';

  // Guruhlar va Davomat
  static const String groups = '/groups';
  static const String attendance = '/attendance';
}
