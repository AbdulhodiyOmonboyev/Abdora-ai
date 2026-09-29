import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/responsive.dart';
import 'student_home.dart';
import 'student_lessons.dart';
import 'student_shop_leaderboard_screen.dart';
import 'student_profile_screen.dart';

class StudentMainNav extends StatefulWidget {
  final int initialTab;
  const StudentMainNav({super.key, this.initialTab = 0});

  static _StudentMainNavState? of(BuildContext context) {
    return context.findAncestorStateOfType<_StudentMainNavState>();
  }

  @override
  State<StudentMainNav> createState() => _StudentMainNavState();
}

class _StudentMainNavState extends State<StudentMainNav> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTab.clamp(0, 3);
  }

  void setTab(int index) {
    if (index >= 0 && index < 4) {
      setState(() => _currentIndex = index);
    }
  }

  final List<Widget> _screens = const [
    StudentHomeScreen(),
    StudentLessonsScreen(),
    StudentShopLeaderboardScreen(initialIndex: 1), // Reyting tab
    StudentProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isTablet = context.isTablet;

    // Planshetlar uchun Web Sidebar uslubidagi NavigationRail
    if (isTablet) {
      return Scaffold(
        backgroundColor: AppColors.bg(context),
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) => setState(() => _currentIndex = index),
              backgroundColor: AppColors.navBg(context),
              selectedIconTheme: IconThemeData(color: Theme.of(context).primaryColor),
              unselectedIconTheme: IconThemeData(color: AppColors.textM(context)),
              selectedLabelTextStyle: TextStyle(
                color: Theme.of(context).primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
              unselectedLabelTextStyle: TextStyle(
                color: AppColors.textM(context),
                fontSize: 12,
              ),
              labelType: NavigationRailLabelType.all,
              destinations: const [
                NavigationRailDestination(
                  icon: Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home_rounded),
                  label: Text('Asosiy'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.auto_stories_outlined),
                  selectedIcon: Icon(Icons.auto_stories_rounded),
                  label: Text('O\'qish'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.bar_chart_rounded),
                  selectedIcon: Icon(Icons.leaderboard_rounded),
                  label: Text('Reyting'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.person_outline_rounded),
                  selectedIcon: Icon(Icons.person_rounded),
                  label: Text('Profil'),
                ),
              ],
            ),
            VerticalDivider(width: 1, thickness: 1, color: AppColors.borderCol(context)),
            Expanded(
              child: IndexedStack(
                index: _currentIndex,
                children: _screens,
              ),
            ),
          ],
        ),
      );
    }

    final isDark = AppColors.isDark(context);

    // Smartfonlar uchun zamonaviy 4-tabli panel
    return Scaffold(
      backgroundColor: AppColors.bg(context),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.cardBg(context).withOpacity(0.96),
          border: Border(
            top: BorderSide(color: AppColors.borderCol(context), width: 1),
          ),
          boxShadow: isDark
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: const Color(0xFF64748B).withOpacity(0.08),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (index) => setState(() => _currentIndex = index),
              backgroundColor: Colors.transparent,
              selectedItemColor: Theme.of(context).primaryColor,
              unselectedItemColor: AppColors.textM(context),
              type: BottomNavigationBarType.fixed,
              selectedFontSize: 11,
              unselectedFontSize: 11,
              elevation: 0,
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home_outlined),
                  activeIcon: Icon(Icons.home_rounded),
                  label: 'Asosiy',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.auto_stories_outlined),
                  activeIcon: Icon(Icons.auto_stories_rounded),
                  label: 'O\'qish',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.bar_chart_rounded),
                  activeIcon: Icon(Icons.leaderboard_rounded),
                  label: 'Reyting',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline_rounded),
                  activeIcon: Icon(Icons.person_rounded),
                  label: 'Profil',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
