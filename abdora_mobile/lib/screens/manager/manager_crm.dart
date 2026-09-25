import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/lead_provider.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/status_badge.dart';

class ManagerCrmScreen extends StatefulWidget {
  const ManagerCrmScreen({super.key});

  @override
  State<ManagerCrmScreen> createState() => _ManagerCrmScreenState();
}

class _ManagerCrmScreenState extends State<ManagerCrmScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<LeadProvider>(context, listen: false).fetchLeads();
    });
  }

  void _showAddLeadDialog() {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Yangi Lid Qo\'shish', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Ismi', labelStyle: TextStyle(color: AppColors.textSecondary)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Telefon raqami', labelStyle: TextStyle(color: AppColors.textSecondary)),
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
              if (nameController.text.trim().isEmpty || phoneController.text.trim().isEmpty) return;
              final leadProvider = Provider.of<LeadProvider>(context, listen: false);
              final ok = await leadProvider.createLead(nameController.text, phoneController.text);
              if (ctx.mounted) Navigator.pop(ctx);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok ? 'Lid muvaffaqiyatli qo\'shildi' : 'Xatolik yuz berdi'),
                    backgroundColor: ok ? AppColors.success : AppColors.danger,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Qo\'shish', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final leadProvider = Provider.of<LeadProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('CRM — Lidlar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_rounded, color: AppColors.primary),
            onPressed: _showAddLeadDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => leadProvider.fetchLeads(),
        color: AppColors.primary,
        child: leadProvider.isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : leadProvider.leads.isEmpty
                ? const Center(child: Text('Lidlar topilmadi', style: TextStyle(color: AppColors.textMuted)))
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: leadProvider.leads.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final lead = leadProvider.leads[index];
                      Color statusColor;
                      String statusText;

                      switch (lead.status) {
                        case 'new':
                          statusColor = AppColors.info;
                          statusText = 'Yangi';
                          break;
                        case 'contacted':
                          statusColor = AppColors.warning;
                          statusText = 'Bog\'lanildi';
                          break;
                        case 'trial':
                          statusColor = AppColors.accentPurple;
                          statusText = 'Sinov darsi';
                          break;
                        case 'enrolled':
                          statusColor = AppColors.success;
                          statusText = 'Yozildi';
                          break;
                        default:
                          statusColor = AppColors.textMuted;
                          statusText = lead.status;
                      }

                      return GlassCard(
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: statusColor.withOpacity(0.15),
                              child: Icon(Icons.person_outline, color: statusColor, size: 20),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    lead.name,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    lead.phone,
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            StatusBadge(text: statusText, color: statusColor),
                          ],
                        ),
                      );
                    },
                  ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: _showAddLeadDialog,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
