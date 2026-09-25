import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import toast from 'react-hot-toast';

export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Mobil qurilma bosilganda yengil tebranish berish
 */
export const triggerHaptic = async (style = ImpactStyle.Light) => {
  if (isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch {
      // Haptics mavjud bo'lmasa xatolik bermaydi
    }
  }
};

/**
 * Mobil ilova xizmatlarini ishga tushirish (Splash, Status bar, Back button, Network)
 */
export const initMobileService = (navigate) => {
  if (!isNativePlatform()) return;

  // 1. Splash screenni yashirish
  SplashScreen.hide().catch(() => {});

  // 2. Status bar sozlamalari
  try {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#0F172A' }).catch(() => {});
  } catch {
    // Platformaga bog'liq xatolar
  }

  // 3. Android Hardware Back Button nazorati
  let lastBackPressTime = 0;
  CapApp.addListener('backButton', ({ canGoBack }) => {
    // Agar modal yoki orqaga qaytish imkoni bo'lsa
    if (window.history.length > 1 && canGoBack) {
      if (navigate) {
        navigate(-1);
      } else {
        window.history.back();
      }
    } else {
      // Asosiy sahifada bo'lsa, chiqish uchun ikki marta bosishni so'rash
      const currentTime = new Date().getTime();
      if (currentTime - lastBackPressTime < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPressTime = currentTime;
        toast("Chiqish uchun yana bir marta 'Orqaga' tugmasini bosing", {
          id: 'exit-app-toast',
          duration: 2000,
        });
      }
    }
  });

  // 4. Tarmoq holati monitoringi
  Network.addListener('networkStatusChange', (status) => {
    if (!status.connected) {
      toast.error("Internet bilan aloqa uzildi. Iltimos, ulanishni tekshiring.", {
        id: 'network-offline-toast',
        duration: 4000,
      });
    } else {
      toast.success("Internet aloqasi tiklandi", {
        id: 'network-online-toast',
        duration: 3000,
      });
    }
  });
};
