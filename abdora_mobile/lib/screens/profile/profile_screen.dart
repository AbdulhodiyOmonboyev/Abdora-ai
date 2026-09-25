import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/glass_card.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    String roleTitle;
    switch (user?.role) {
      case 'student':
        roleTitle = 'O\'quvchi';
        break;
      case 'teacher':
        roleTitle = 'O\'qituvchi';
        break;
      case 'manager':
        roleTitle = 'Menejer';
        break;
      case 'reception':
        roleTitle = 'Qabulxona xodimi';
        break;
      case 'admin':
        roleTitle = 'Administrator';
        break;
      default:
        roleTitle = 'Foydalanuvchi';
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mening Profilim'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Foydalanuvchi avatar va ism
            Center(
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.15),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary, width: 2),
                    ),
                    child: Center(
                      child: Text(
                        (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    user?.name ?? 'Foydalanuvchi',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      roleTitle,
                      style: const TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Ma'lumotlar bloki
            GlassCard(
              child: Column(
                children: [
                  _buildProfileRow(Icons.person_outline, 'Login', user?.username ?? '-'),
                  const Divider(color: AppColors.border, height: 24),
                  _buildProfileRow(Icons.phone_outlined, 'Telefon', user?.phone ?? 'Kiritilmagan'),
                  if (user?.role == 'student') ...[
                    const Divider(color: AppColors.border, height: 24),
                    _buildProfileRow(Icons.monetization_on_outlined, 'Tangalar', '${user?.coins ?? 0} tanga'),
                    const Divider(color: AppColors.border, height: 24),
                    _buildProfileRow(Icons.bolt_outlined, 'Tajriba (XP)', '${user?.xp ?? 0} XP'),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Chiqish tugmasi
            GlassCard(
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppColors.card,
                    title: const Text('Hisobdan chiqish', style: TextStyle(color: AppColors.textPrimary)),
                    content: const Text('Rostdan ham hisobdan chiqmoqchimisiz?', style: TextStyle(color: AppColors.textSecondary)),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                        child: const Text('Chiqish', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                );

                if (confirm == true) {
                  await authProvider.logout();
                  if (context.mounted) {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  }
                }
              },
              child: Row(
                children: const [
                  Icon(Icons.logout_rounded, color: AppColors.danger, size: 20),
                  SizedBox(width: 14),
                  Text(
                    'Hisobdan chiqish',
                    style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  Spacer(),
                  Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String title, String value) {
    return Row(
      children: [
        Icon(icon, color: AppColors.textMuted, size: 20),
        const SizedBox(width: 14),
        Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        const Spacer(),
        Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13)),
      ],
    );
  }
}
