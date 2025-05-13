"use client"; // If using hooks like useEffect for animations, otherwise can be server. For simplicity, make client if unsure.

import { ShieldCheck } from 'lucide-react'; // Using ShieldCheck for AccessPoint theme

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
      <ShieldCheck className="h-28 w-28 text-primary mb-6" strokeWidth={1.5} />
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
