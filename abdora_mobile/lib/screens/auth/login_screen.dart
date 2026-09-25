import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/storage/token_storage.dart';
import '../../core/utils/phone_formatter.dart';
import '../../core/utils/responsive.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../student/student_main_nav.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController(text: '+998 ');
  final _passwordController = TextEditingController();
  final _passwordFocusNode = FocusNode();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _loadSavedCredentials();
  }

  Future<void> _loadSavedCredentials() async {
    final savedUsername = await TokenStorage.getLastUsername();
    if (savedUsername != null && savedUsername.trim().isNotEmpty) {
      setState(() {
        _usernameController.text = UzPhoneFormatter.format(savedUsername);
        _usernameController.selection = TextSelection.collapsed(offset: _usernameController.text.length);
      });
      // Agar telefon avval kiritilgan bo'lsa, avtomatik parol maydoniga fokus beramiz
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) _passwordFocusNode.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final rawLogin = _usernameController.text.trim();
    // Agar telefon raqam bo'lsa, probellarni olib tashlaymiz
    final cleanedLogin = rawLogin.startsWith('+') ? UzPhoneFormatter.clean(rawLogin) : rawLogin;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(
      cleanedLogin,
      _passwordController.text,
    );

    if (!mounted) return;

    if (success && authProvider.user != null) {
      // Keyingi safar avtomatik tanlanib turishi uchun saqlab qolamiz
      await TokenStorage.saveLastUsername(cleanedLogin);

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const StudentMainNav()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'Login yoki parol noto\'g\'ri'),
          backgroundColor: AppColors.danger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isTablet = context.isTablet;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: EdgeInsets.symmetric(
              horizontal: isTablet ? 80 : 24,
              vertical: 24,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Rasmiy Abdora AI logotipi
                    Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.3),
                              blurRadius: 22,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(40),
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.school_rounded, color: AppColors.primary, size: 40),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                        ),
                        child: const Text(
                          'Abdora AI',
                          style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'O\'quvchi Tizimiga Kirish',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Telefon raqamingiz va parolingiz orqali shaxsiy kabinetga kiring',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Telefon raqami (+998 avtomatik va tanlangan holda)
                    CustomTextField(
                      controller: _usernameController,
                      label: 'Telefon raqam yoki login',
                      hint: '+998 (90) 123-45-67',
                      keyboardType: TextInputType.phone,
                      prefixIcon: Icons.phone_iphone_rounded,
                      inputFormatters: [UzPhoneFormatter()],
                      onChanged: (val) {
                        // Agar to'liq 9 ta raqam kiritilsa (+998 XX XXX XX XX = 17 belgi), avtomatik parolga o'tish
                        if (val.length >= 17) {
                          _passwordFocusNode.requestFocus();
                        }
                      },
                      validator: (v) {
                        if (v == null || v.trim().isEmpty || v.trim() == '+998') {
                          return 'Telefon raqamingizni kiriting';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Parol
                    CustomTextField(
                      controller: _passwordController,
                      focusNode: _passwordFocusNode,
                      label: 'Parol / Kirish kodi',
                      hint: '••••••••',
                      obscureText: _obscurePassword,
                      prefixIcon: Icons.lock_outline_rounded,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: AppColors.textMuted,
                          size: 20,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Parolni kiriting' : null,
                      onSubmitted: (_) => _handleLogin(),
                    ),
                    const SizedBox(height: 24),

                    // Kirish tugmasi
                    CustomButton(
                      text: 'Tizimga kirish',
                      isLoading: authProvider.isLoading,
                      onPressed: _handleLogin,
                    ),
                    const SizedBox(height: 24),

                    // Eslatma
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.info_outline_rounded, color: AppColors.textMuted, size: 16),
                            SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                'Login ma\'lumotlarini o\'quv markazingizdan olishingiz mumkin',
                                style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
