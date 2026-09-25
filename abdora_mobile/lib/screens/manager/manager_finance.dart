import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/payment_provider.dart';
import '../../widgets/glass_card.dart';

class ManagerFinanceScreen extends StatefulWidget {
  const ManagerFinanceScreen({super.key});

  @override
  State<ManagerFinanceScreen> createState() => _ManagerFinanceScreenState();
}

class _ManagerFinanceScreenState extends State<ManagerFinanceScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<PaymentProvider>(context, listen: false).fetchPayments();
    });
  }

  @override
  Widget build(BuildContext context) {
    final paymentProvider = Provider.of<PaymentProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Moliya & Kassa'),
      ),
      body: RefreshIndicator(
        onRefresh: () => paymentProvider.fetchPayments(),
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Kassa balansi kartasi
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Kassadagi jami tushum', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                    const SizedBox(height: 8),
                    Text(
                      '${paymentProvider.todayCash.toStringAsFixed(0)} UZS',
                      style: const TextStyle(
                        color: AppColors.primaryLight,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          '${paymentProvider.payments.length} ta operatsiya',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'So\'nggi to\'lovlar',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              if (paymentProvider.isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: AppColors.primary)))
              else if (paymentProvider.payments.isEmpty)
                const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('To\'lovlar mavjud emas', style: TextStyle(color: AppColors.textMuted))))
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: paymentProvider.payments.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final p = paymentProvider.payments[index];
                    final isIncome = p.type == 'income';

                    return GlassCard(
                      child: Row(
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: (isIncome ? AppColors.success : AppColors.danger).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              isIncome ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                              color: isIncome ? AppColors.success : AppColors.danger,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.studentName ?? p.description ?? 'Noma\'lum to\'lov',
                                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Usul: ${p.method.toUpperCase()}',
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '${isIncome ? '+' : '-'}${p.amount.toStringAsFixed(0)} UZS',
                            style: TextStyle(
                              color: isIncome ? AppColors.success : AppColors.danger,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
