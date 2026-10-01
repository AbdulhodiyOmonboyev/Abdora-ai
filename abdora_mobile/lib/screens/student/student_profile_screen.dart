import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/api/endpoints.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/locale_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/status_badge.dart';
import '../auth/login_screen.dart';
import 'stats_history_sheet.dart';

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

  Widget _buildAvatarImage(UserModel? user) {
    final avatar = user?.avatar;
    final displayName = user?.name ?? 'O\'quvchi';

    if (avatar != null && avatar.trim().isNotEmpty) {
      final trimmed = avatar.trim();
      if (trimmed.startsWith('data:image')) {
        try {
          final commaIndex = trimmed.indexOf(',');
          final base64Str = commaIndex != -1 ? trimmed.substring(commaIndex + 1) : trimmed;
          return Image.memory(
            base64Decode(base64Str),
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildAvatarInitial(displayName, 32),
          );
        } catch (_) {}
      } else {
        final fullUrl = trimmed.startsWith('http')
            ? trimmed
            : '${Endpoints.baseUrl.replaceAll('/api', '')}$trimmed';
        return CachedNetworkImage(
          imageUrl: fullUrl,
          fit: BoxFit.cover,
          placeholder: (_, __) => const Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
            ),
          ),
          errorWidget: (_, __, ___) => _buildAvatarInitial(displayName, 32),
        );
      }
    }
    return _buildAvatarInitial(displayName, 32);
  }

  Widget _buildAvatarInitial(String name, double fontSize) {
    return Center(
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : 'U',
        style: TextStyle(
          color: AppColors.primary,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Future<void> _pickAndUploadImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (picked == null) return;

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Rasm yuklanmoqda...'),
          duration: Duration(seconds: 2),
        ),
      );

      final auth = Provider.of<AuthProvider>(context, listen: false);
      final ok = await auth.uploadAvatarFile(picked.path, picked.name);

      if (!mounted) return;
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profil rasmi muvaffaqiyatli yuklandi!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        final bytes = await picked.readAsBytes();
        final base64String = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        final fallbackOk = await auth.updateAvatar(base64String);
        if (!mounted) return;
        if (fallbackOk) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profil rasmi muvaffaqiyatli yuklandi!'),
              backgroundColor: AppColors.success,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Rasmni yuklashda xatolik yuz berdi'),
              backgroundColor: AppColors.danger,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Xatolik: ${e.toString()}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  void _showImageUrlDialog() {
    final urlController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBg(context),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Rasm havolasini kiritish',
          style: TextStyle(color: AppColors.text1(context), fontSize: 18, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Internetdagi rasm to\'g\'ridan-to\'g\'ri havolasini (URL) kiriting:',
              style: TextStyle(color: AppColors.text2(context), fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlController,
              style: TextStyle(color: AppColors.text1(context)),
              decoration: InputDecoration(
                hintText: 'https://example.com/avatar.jpg',
                hintStyle: TextStyle(color: AppColors.textM(context)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                prefixIcon: const Icon(Icons.link_rounded),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Bekor qilish', style: TextStyle(color: AppColors.textM(context))),
          ),
          ElevatedButton(
            onPressed: () async {
              final url = urlController.text.trim();
              if (url.isEmpty) return;
              Navigator.pop(ctx);
              final auth = Provider.of<AuthProvider>(context, listen: false);
              final ok = await auth.updateAvatar(url);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok ? 'Profil rasmi saqlandi!' : 'Rasmni saqlashda xatolik'),
                    backgroundColor: ok ? AppColors.success : AppColors.danger,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.of(context)),
            child: const Text('Saqlash', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showAvatarPresetsDialog() {
    final List<String> presetUrls = [
      'https://api.dicebear.com/7.x/bottts/png?seed=Alex',
      'https://api.dicebear.com/7.x/bottts/png?seed=Oliver',
      'https://api.dicebear.com/7.x/bottts/png?seed=Luna',
      'https://api.dicebear.com/7.x/bottts/png?seed=Milo',
      'https://api.dicebear.com/7.x/bottts/png?seed=Leo',
      'https://api.dicebear.com/7.x/bottts/png?seed=Sam',
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.cardBg(context),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tayyor avatarlardan tanlash',
              style: TextStyle(
                color: AppColors.text1(context),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: presetUrls.map((url) {
                return InkWell(
                  onTap: () async {
                    Navigator.pop(ctx);
                    final auth = Provider.of<AuthProvider>(context, listen: false);
                    final ok = await auth.updateAvatar(url);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(ok ? 'Avatar tanlandi!' : 'Xatolik yuz berdi'),
                          backgroundColor: ok ? AppColors.success : AppColors.danger,
                        ),
                      );
                    }
                  },
                  borderRadius: BorderRadius.circular(36),
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.borderCol(context), width: 1.5),
                    ),
                    child: ClipOval(
                      child: CachedNetworkImage(
                        imageUrl: url,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  void _showAvatarPickerSheet() {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final hasAvatar = user?.avatar != null && user!.avatar!.isNotEmpty;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.cardBg(context),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderCol(context),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Profil rasmini tanlash',
                style: TextStyle(
                  color: AppColors.text1(context),
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.photo_library_rounded, color: AppColors.primary),
                title: Text('Galereyadan tanlash', style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.w600)),
                subtitle: Text('Telefon xotirasidagi rasmni yuklash', style: TextStyle(color: AppColors.textM(context), fontSize: 12)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndUploadImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_rounded, color: AppColors.primary),
                title: Text('Kameradan rasmga olish', style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.w600)),
                subtitle: Text('Kamera orqali yangi rasm tushirish', style: TextStyle(color: AppColors.textM(context), fontSize: 12)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndUploadImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.link_rounded, color: AppColors.primary),
                title: Text('Havola (URL) orqali kiritish', style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.w600)),
                subtitle: Text('Internetdagi rasm manzilini ulash', style: TextStyle(color: AppColors.textM(context), fontSize: 12)),
                onTap: () {
                  Navigator.pop(ctx);
                  _showImageUrlDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.face_rounded, color: AppColors.primary),
                title: Text('Tayyor avatarlardan tanlash', style: TextStyle(color: AppColors.text1(context), fontWeight: FontWeight.w600)),
                subtitle: Text('Qulay va zamonaviy o\'quvchi avatarlari', style: TextStyle(color: AppColors.textM(context), fontSize: 12)),
                onTap: () {
                  Navigator.pop(ctx);
                  _showAvatarPresetsDialog();
                },
              ),
              if (hasAvatar)
                ListTile(
                  leading: const Icon(Icons.delete_outline_rounded, color: AppColors.danger),
                  title: const Text('Rasmni o\'chirish', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final auth = Provider.of<AuthProvider>(context, listen: false);
                    final ok = await auth.updateAvatar('');
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(ok ? 'Profil rasmi o\'chirildi' : 'Xatolik yuz berdi'),
                          backgroundColor: ok ? AppColors.success : AppColors.danger,
                        ),
                      );
                    }
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final student = Provider.of<StudentProvider>(context);
    final isTablet = context.isTablet;

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        backgroundColor: AppColors.cardBg(context),
        elevation: 0,
        title: Text(
          'Mening Profilim',
          style: TextStyle(
            color: AppColors.text1(context),
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.lock_reset_rounded, color: AppColors.of(context)),
            onPressed: _showChangePasswordDialog,
            tooltip: 'Parolni o\'zgartirish',
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
                  GestureDetector(
                    onTap: _showAvatarPickerSheet,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 88,
                          height: 88,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.15),
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.primary, width: 2.5),
                          ),
                          child: ClipOval(
                            child: _buildAvatarImage(user),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.cardBg(context), width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 16),
                          ),
                        ),
                      ],
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
                      style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.w600),
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
                  _buildMetric(
                    Icons.bolt_rounded,
                    '${user?.xp ?? 0}',
                    'XP Ball',
                    AppColors.primaryLight,
                    onTap: () => StatsHistorySheet.showExpHistory(context, user: user),
                  ),
                  _buildMetric(
                    Icons.monetization_on_rounded,
                    '${user?.coins ?? 0}',
                    'Tangalar',
                    AppColors.coinGold,
                    onTap: () => StatsHistorySheet.showCoinHistory(context, user: user),
                  ),
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
            const SizedBox(height: 20),

            // Ilova mavzusi va rangi (Rang tanlash)
            Consumer<ThemeProvider>(
              builder: (context, themeProvider, _) {
                return GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.of(context).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(Icons.palette_outlined, color: AppColors.of(context), size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Ilova mavzusi va ko\'rinishi',
                                  style: TextStyle(
                                    color: AppColors.text1(context),
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  themeProvider.currentColor.name,
                                  style: TextStyle(
                                    color: AppColors.of(context),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Rejim tanlash (Dark / Light / Tizim)
                      Text(
                        'Ko\'rinish rejimi:',
                        style: TextStyle(color: AppColors.text2(context), fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.inputCol(context),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.borderCol(context)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                onTap: () => themeProvider.setThemeMode(ThemeMode.dark),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: themeProvider.themeMode == ThemeMode.dark ? AppColors.of(context) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.dark_mode_rounded,
                                        size: 15,
                                        color: themeProvider.themeMode == ThemeMode.dark ? Colors.white : AppColors.text2(context),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Qorong\'u',
                                        style: TextStyle(
                                          color: themeProvider.themeMode == ThemeMode.dark ? Colors.white : AppColors.text2(context),
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: InkWell(
                                onTap: () => themeProvider.setThemeMode(ThemeMode.light),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: themeProvider.themeMode == ThemeMode.light ? AppColors.of(context) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.light_mode_rounded,
                                        size: 15,
                                        color: themeProvider.themeMode == ThemeMode.light ? Colors.white : AppColors.text2(context),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Yorug\'',
                                        style: TextStyle(
                                          color: themeProvider.themeMode == ThemeMode.light ? Colors.white : AppColors.text2(context),
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: InkWell(
                                onTap: () => themeProvider.setThemeMode(ThemeMode.system),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: themeProvider.themeMode == ThemeMode.system ? AppColors.of(context) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.brightness_auto_rounded,
                                        size: 15,
                                        color: themeProvider.themeMode == ThemeMode.system ? Colors.white : AppColors.text2(context),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Tizim',
                                        style: TextStyle(
                                          color: themeProvider.themeMode == ThemeMode.system ? Colors.white : AppColors.text2(context),
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      Text(
                        'Sevimli rangingizni tanlang:',
                        style: TextStyle(color: AppColors.text2(context), fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 48,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          itemCount: themeProvider.availableColors.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 10),
                          itemBuilder: (context, index) {
                            final option = themeProvider.availableColors[index];
                            final isSelected = themeProvider.selectedIndex == index;

                            return InkWell(
                              onTap: () => themeProvider.setThemeColor(index),
                              borderRadius: BorderRadius.circular(24),
                              child: Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: option.primary,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected ? Colors.white : Colors.transparent,
                                    width: isSelected ? 3 : 1,
                                  ),
                                  boxShadow: [
                                    if (isSelected)
                                      BoxShadow(
                                        color: option.primary.withOpacity(0.5),
                                        blurRadius: 8,
                                        spreadRadius: 2,
                                      ),
                                  ],
                                ),
                                child: isSelected
                                    ? const Center(
                                        child: Icon(Icons.check_rounded, color: Colors.white, size: 22),
                                      )
                                    : null,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 20),

            // Til sozlamalari (Ilova tili)
            Consumer<LocaleProvider>(
              builder: (context, localeProvider, _) {
                return GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.of(context).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(Icons.language_rounded, color: AppColors.of(context), size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Ilova tili',
                                  style: TextStyle(
                                    color: AppColors.text1(context),
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  localeProvider.currentLanguage.localName,
                                  style: TextStyle(
                                    color: AppColors.of(context),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'O\'zingizga qulay tilni tanlang:',
                        style: TextStyle(color: AppColors.text2(context), fontSize: 12),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: localeProvider.supportedLanguages.map((lang) {
                          final isSelected = localeProvider.currentLanguageCode == lang.code;
                          return Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 3),
                              child: InkWell(
                                onTap: () {
                                  localeProvider.setLanguage(lang.code);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: AppColors.cardBg(context),
                                      duration: const Duration(seconds: 1),
                                      behavior: SnackBarBehavior.floating,
                                      content: Text(
                                        '${lang.name} tili tanlandi',
                                        style: TextStyle(color: AppColors.text1(context), fontSize: 12.5),
                                      ),
                                    ),
                                  );
                                },
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? AppColors.of(context).withOpacity(0.12) : AppColors.inputCol(context),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isSelected ? AppColors.of(context) : AppColors.borderCol(context),
                                      width: isSelected ? 1.5 : 1,
                                    ),
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isSelected ? AppColors.of(context) : AppColors.borderCol(context),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          lang.badge,
                                          style: TextStyle(
                                            color: isSelected ? Colors.white : AppColors.text2(context),
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        lang.name,
                                        style: TextStyle(
                                          color: isSelected ? AppColors.of(context) : AppColors.text1(context),
                                          fontSize: 12,
                                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                );
              },
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
              Center(child: Padding(padding: const EdgeInsets.all(24), child: CircularProgressIndicator(color: AppColors.primary)))
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

  Widget _buildMetric(IconData icon, String value, String label, Color color, {VoidCallback? onTap}) {
    final content = Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            if (onTap != null) ...[
              const SizedBox(width: 2),
              const Icon(Icons.chevron_right_rounded, size: 12, color: AppColors.textMuted),
            ],
          ],
        ),
      ],
    );

    if (onTap == null) return content;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: content,
      ),
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
