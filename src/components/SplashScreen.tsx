import React, { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 1000);
    const timer2 = setTimeout(() => setCurrentStep(2), 2500);
    const timer3 = setTimeout(() => onComplete(), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center z-50">
      <div className="text-center text-white px-6">
        {/* Logo Animation */}
        <div className={`mb-8 transition-all duration-1000 ${currentStep >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative">
            <MapPin className="w-20 h-20 mx-auto mb-4 animate-bounce" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <Navigation className="w-4 h-4 text-blue-800" />
            </div>
          </div>
        </div>

        {/* Title Animation */}
        <div className={`transition-all duration-1000 delay-500 ${currentStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl font-bold mb-2">Navigation Bot</h1>
          <p className="text-xl text-blue-200 mb-8">Arunai Engineering College</p>
        </div>

        {/* Loading Animation */}
        <div className={`transition-all duration-1000 delay-1000 ${currentStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex justify-center space-x-2 mb-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-white rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <p className="text-blue-200">வழிகாட்டி தயாராகிறது...</p>
        </div>
      </div>
    </div>
  );
};