import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import 'manager_crm.dart';
import 'manager_finance.dart';
import '../teacher/teacher_groups.dart';
import '../profile/profile_screen.dart';

class ManagerMainNav extends StatefulWidget {
  const ManagerMainNav({super.key});

  @override
  State<ManagerMainNav> createState() => _ManagerMainNavState();
}

class _ManagerMainNavState extends State<ManagerMainNav> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    ManagerCrmScreen(),
    ManagerFinanceScreen(),
    TeacherGroupsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: AppColors.surface,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.person_add_alt_1_outlined),
              activeIcon: Icon(Icons.person_add_alt_1_rounded),
              label: 'CRM Lidlar',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined),
              activeIcon: Icon(Icons.account_balance_wallet_rounded),
              label: 'Moliya & Kassa',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.groups_outlined),
              activeIcon: Icon(Icons.groups_rounded),
              label: 'Guruhlar',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }
}
