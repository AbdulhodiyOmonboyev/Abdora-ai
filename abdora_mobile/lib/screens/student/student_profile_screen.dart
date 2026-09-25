import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/status_badge.dart';
import '../auth/login_screen.dart';

class StudentProfileScreen extends StatefulWidget {
  const StudentProfileScreen({super.key});

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<StudentProvider>(context, listen: false).fetchAttendance();
    });
  }

  void _showChangePasswordDialog() {
    final currentPassController = TextEditingController();
    final newPassController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Parolni O\'zgartirish', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentPassController,
              obscureText: true,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Hozirgi parol', labelStyle: TextStyle(color: AppColors.textSecondary)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newPassController,
              obscureText: true,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Yangi parol', labelStyle: TextStyle(color: AppColors.textSecondary)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Bekor qilish', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              if (currentPassController.text.isEmpty || newPassController.text.isEmpty) return;
              final auth = Provider.of<AuthProvider>(context, listen: false);
              final ok = await auth.changePassword(currentPassController.text, newPassController.text);
              if (ctx.mounted) Navigator.pop(ctx);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok ? 'Parol muvaffaqiyatli yangilandi' : 'Parolni yangilashda xatolik'),
                    backgroundColor: ok ? AppColors.success : AppColors.danger,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Saqlash', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final student = Provider.of<StudentProvider>(context);
    final isTablet = context.isTablet;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mening Profilim'),
        actions: [
          IconButton(
            icon: const Icon(Icons.lock_reset_rounded, color: AppColors.primaryLight),
            onPressed: _showChangePasswordDialog,
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.symmetric(
          horizontal: isTablet ? 48 : 16,
          vertical: 16,
        ),
        child: Column(
          children: [
            // Avatar va Ism
            Center(
              child: Column(
                children: [
                  Container(
                    width: 76,
                    height: 76,
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
                          fontSize: 30,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? 'O\'quvchi',
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'O\'quvchi • Daraja ${user?.level ?? 1}',
                      style: const TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Ko'rsatkichlar kartasi
            GlassCard(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMetric(Icons.bolt_rounded, '${user?.xp ?? 0}', 'XP Ball', AppColors.primaryLight),
                  _buildMetric(Icons.monetization_on_rounded, '${user?.coins ?? 0}', 'Tangalar', AppColors.coinGold),
                  _buildMetric(Icons.local_fire_department_rounded, 'Kunlik', 'Seriya', AppColors.danger),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Ma'lumotlar bloki
            GlassCard(
              child: Column(
                children: [
                  _buildInfoRow(Icons.person_outline, 'Foydalanuvchi nomi', user?.username ?? '-'),
                  const Divider(color: AppColors.border, height: 20),
                  _buildInfoRow(Icons.phone_outlined, 'Telefon', user?.phone ?? 'Kiritilmagan'),
                  const Divider(color: AppColors.border, height: 20),
                  _buildInfoRow(Icons.school_outlined, 'Ta\'lim yo\'nalishi', 'Biologiya chuqurlashtirilgan'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Davomat Tarixi
            Align(
              alignment: Alignment.centerLeft,
              child: const Text(
                'Davomat Tarixi',
                style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
            const SizedBox(height: 12),

            if (student.isLoadingAttendance)
              const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator(color: AppColors.primary)))
            else if (student.attendanceRecords.isEmpty)
              GlassCard(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: const Text('Davomat ma\'lumotlari hali mavjud emas', style: TextStyle(color: AppColors.textMuted)),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: student.attendanceRecords.length > 5 ? 5 : student.attendanceRecords.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final att = student.attendanceRecords[index];
                  Color statusColor;
                  String statusText;

                  switch (att.status) {
                    case 'present':
                      statusColor = AppColors.success;
                      statusText = 'Qatnashdi';
                      break;
                    case 'late':
                      statusColor = AppColors.warning;
                      statusText = 'Kechikdi';
                      break;
                    default:
                      statusColor = AppColors.danger;
                      statusText = 'Qatnashmadi';
                  }

                  return GlassCard(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${att.date.day}.${att.date.month}.${att.date.year}',
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                        StatusBadge(text: statusText, color: statusColor),
                      ],
                    ),
                  );
                },
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
                  final auth = Provider.of<AuthProvider>(context, listen: false);
                  await auth.logout();
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
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildMetric(IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String title, String value) {
    return Row(
      children: [
        Icon(icon, color: AppColors.textMuted, size: 18),
        const SizedBox(width: 12),
        Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        const Spacer(),
        Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13)),
      ],
    );
  }
}
