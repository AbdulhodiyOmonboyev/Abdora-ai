import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import 'teacher_groups.dart';
import 'teacher_attendance.dart';
import '../student/student_lessons.dart';
import '../profile/profile_screen.dart';

class TeacherMainNav extends StatefulWidget {
  const TeacherMainNav({super.key});

  @override
  State<TeacherMainNav> createState() => _TeacherMainNavState();
}

class _TeacherMainNavState extends State<TeacherMainNav> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    TeacherGroupsScreen(),
    TeacherAttendanceScreen(),
    StudentLessonsScreen(),
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
              icon: Icon(Icons.groups_outlined),
              activeIcon: Icon(Icons.groups_rounded),
              label: 'Guruhlar',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.how_to_reg_outlined),
              activeIcon: Icon(Icons.how_to_reg_rounded),
              label: 'Davomat',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.menu_book_outlined),
              activeIcon: Icon(Icons.menu_book_rounded),
              label: 'Darslar',
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
