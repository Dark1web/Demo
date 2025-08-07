import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Earth3D from './Earth3D';
import Robot3D from './Robot3D';
import gsap from 'gsap';

const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.5 });
    
    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.5"
    )
    .fromTo(ctaRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
      "-=0.3"
    );
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,170,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,170,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* 3D Earth */}
      <div className="absolute inset-0">
        <Earth3D />
      </div>
      
      {/* 3D Robot */}
      <div className="absolute right-10 top-1/2 transform -translate-y-1/2 w-64 h-64 hidden lg:block">
        <Robot3D />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 
          ref={titleRef}
          className="text-6xl md:text-8xl font-bold mb-6 text-glow opacity-0"
        >
          DISASTER
          <br />
          <span className="text-accent animate-glow-pulse">WATCH</span>
        </h1>
        
        <p 
          ref={subtitleRef}
          className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl mx-auto opacity-0"
        >
          Real-time global disaster monitoring powered by AI.
          <br />
          Stay informed, stay prepared, stay safe.
        </p>
        
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center opacity-0">
          <Button variant="hero" size="lg">
            Start Monitoring
          </Button>
          <Button variant="hero-secondary" size="lg">
            Learn More
          </Button>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-float opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;