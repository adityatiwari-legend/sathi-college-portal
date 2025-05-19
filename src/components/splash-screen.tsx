
"use client"; 

import Image from 'next/image';

const SplashScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-background animate-fadeIn">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out;
        }
      `}</style>
      <Image 
        src="https://icon2.cleanpng.com/20180627/vy/aayjnkno0.webp" 
        alt="Sathi College Portal Logo" 
        width={112} 
        height={112} 
        className="mb-6"
        priority // Preload logo on splash screen
        data-ai-hint="university logo"
      />
      <h1 className="text-5xl md:text-6xl font-bold text-primary tracking-tight">
        Saathi
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mt-3">
        Secure. Reliable. Accessible.
      </p>
    </div>
  );
};

export default SplashScreen;
