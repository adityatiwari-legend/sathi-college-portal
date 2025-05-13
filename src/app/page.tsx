"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/splash-screen';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2500); // 2.5 seconds delay for splash screen

    return () => clearTimeout(timer);
  }, [router]);

  return <SplashScreen />;
}
