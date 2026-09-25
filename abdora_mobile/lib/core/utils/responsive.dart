import 'package:flutter/material.dart';

class Responsive {
  static const double smallMobileBreakpoint = 360;
  static const double tabletBreakpoint = 600;
  static const double desktopBreakpoint = 1024;

  static bool isSmallMobile(BuildContext context) =>
      MediaQuery.sizeOf(context).width < smallMobileBreakpoint;

  static bool isMobile(BuildContext context) =>
      MediaQuery.sizeOf(context).width < tabletBreakpoint;

  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= tabletBreakpoint &&
      MediaQuery.sizeOf(context).width < desktopBreakpoint;

  static bool isDesktop(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= desktopBreakpoint;
}

extension ResponsiveExtension on BuildContext {
  double get screenWidth => MediaQuery.sizeOf(this).width;
  double get screenHeight => MediaQuery.sizeOf(this).height;

  bool get isSmallMobile => screenWidth < Responsive.smallMobileBreakpoint;
  bool get isMobile => screenWidth < Responsive.tabletBreakpoint;
  bool get isTablet => screenWidth >= Responsive.tabletBreakpoint;

  double get bottomSafeArea => MediaQuery.paddingOf(this).bottom;
  double get topSafeArea => MediaQuery.paddingOf(this).top;

  T responsive<T>({
    required T mobile,
    T? smallMobile,
    T? tablet,
  }) {
    if (isTablet && tablet != null) return tablet;
    if (isSmallMobile && smallMobile != null) return smallMobile;
    return mobile;
  }
}

class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? smallMobile;
  final Widget? tablet;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.smallMobile,
    this.tablet,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= Responsive.tabletBreakpoint && tablet != null) {
          return tablet!;
        }
        if (constraints.maxWidth < Responsive.smallMobileBreakpoint && smallMobile != null) {
          return smallMobile!;
        }
        return mobile;
      },
    );
  }
}
