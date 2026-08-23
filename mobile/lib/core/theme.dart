import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Riverpod provider for managing ThemeMode
final themeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);

class UsalamaTheme {
  // A punchier, high-contrast Pro Red
  static const Color primaryRed = Color(0xFFEF4444);
  
  // Dark Theme Colors
  static const Color backgroundDark = Color(0xFF080A0F);
  static const Color surfaceDark = Color(0xFF0F1115);
  static const Color surfaceRaisedDark = Color(0xFF161B24);
  static const Color textHighContrastDark = Color(0xFFF0F2F7);
  static const Color textSecondaryDark = Color(0xFF9CA3AF);
  static const Color textMutedDark = Color(0xFF4B5563);

  // Light Theme Colors
  static const Color backgroundLight = Color(0xFFF7F7F9);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color textHighContrastLight = Color(0xFF1A1A1A);
  static const Color textSecondaryLight = Color(0xFF6E6E73);

  // Common Typography for "Pro UI/UX"
  static TextTheme _buildTextTheme(Color textColor, Color secondaryColor) {
    return TextTheme(
      displayLarge: TextStyle(color: textColor, fontWeight: FontWeight.w900, letterSpacing: -1.0),
      displayMedium: TextStyle(color: textColor, fontWeight: FontWeight.w800, letterSpacing: -0.8),
      displaySmall: TextStyle(color: textColor, fontWeight: FontWeight.w700, letterSpacing: -0.5),
      headlineMedium: TextStyle(color: textColor, fontWeight: FontWeight.w700, letterSpacing: -0.5),
      titleLarge: TextStyle(color: textColor, fontWeight: FontWeight.w700, letterSpacing: -0.3, fontSize: 20),
      titleMedium: TextStyle(color: textColor, fontWeight: FontWeight.w600, letterSpacing: -0.2, fontSize: 16),
      bodyLarge: TextStyle(color: textColor, fontWeight: FontWeight.w500, fontSize: 15),
      bodyMedium: TextStyle(color: textColor, fontWeight: FontWeight.w400, fontSize: 14),
      labelLarge: TextStyle(color: secondaryColor, fontWeight: FontWeight.w600, fontSize: 12, letterSpacing: 0.5),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData.light().copyWith(
      scaffoldBackgroundColor: backgroundLight,
      primaryColor: primaryRed,
      colorScheme: const ColorScheme.light(
        primary: primaryRed,
        surface: surfaceLight,
        onSurface: textHighContrastLight,
        secondary: primaryRed,
      ),
      textTheme: _buildTextTheme(textHighContrastLight, textSecondaryLight),
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundLight,
        foregroundColor: textHighContrastLight,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textHighContrastLight,
          fontSize: 22,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceLight,
        selectedItemColor: primaryRed,
        unselectedItemColor: textSecondaryLight,
        elevation: 10,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
      ),
      cardTheme: CardThemeData(
        color: surfaceLight,
        elevation: 0,
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.black.withValues(alpha: 0.05)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryRed,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 0.2),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.black.withValues(alpha: 0.03),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.05)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryRed, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData.dark().copyWith(
      scaffoldBackgroundColor: backgroundDark,
      primaryColor: primaryRed,
      colorScheme: const ColorScheme.dark(
        primary: primaryRed,
        surface: surfaceDark,
        onSurface: textHighContrastDark,
        secondary: primaryRed,
      ),
      textTheme: _buildTextTheme(textHighContrastDark, textSecondaryDark),
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundDark,
        foregroundColor: textHighContrastDark,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textHighContrastDark,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceDark,
        selectedItemColor: primaryRed,
        unselectedItemColor: textSecondaryDark,
        elevation: 10,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
      ),
      cardTheme: CardThemeData(
        color: surfaceDark,
        elevation: 0,
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.white.withOpacity(0.06)),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: Colors.white.withOpacity(0.06),
        thickness: 1,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryRed,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, letterSpacing: 0.2),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceRaisedDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryRed, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        hintStyle: const TextStyle(color: textMutedDark, fontSize: 14),
      ),
    );
  }

  static Color getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return Colors.teal;
      case 'IN_PROGRESS':
        return Colors.orange;
      case 'REVIEW':
        return Colors.purple;
      case 'RESOLVED':
        return Colors.green;
      case 'CLOSED':
        return Colors.grey;
      default:
        return Colors.grey.shade400;
    }
  }

  static Color getPriorityColor(String priority) {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        return Colors.redAccent;
      case 'HIGH':
        return Colors.orangeAccent;
      case 'MEDIUM':
        return Colors.amber;
      case 'LOW':
        return Colors.teal;
      default:
        return Colors.grey.shade400;
    }
  }
}
