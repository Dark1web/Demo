import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const stats = [
  {
    number: 847,
    label: "Active Monitors",
    suffix: "",
    description: "Global monitoring stations"
  },
  {
    number: 156,
    label: "Countries Covered",
    suffix: "",
    description: "Worldwide coverage"
  },
  {
    number: 99.8,
    label: "Uptime",
    suffix: "%",
    description: "System reliability"
  },
  {
    number: 24,
    label: "Response Time",
    suffix: "sec",
    description: "Average alert speed"
  }
];

const AnimatedCounter = ({ number, suffix }: { number: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to({ count: 0 }, {
              count: number,
              duration: 2,
              ease: "power2.out",
              onUpdate: function() {
                setCount(Math.round(this.targets()[0].count));
              }
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [number]);

  return (
    <span ref={countRef} className="text-4xl md:text-6xl font-bold text-glow">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const StatsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="py-24 px-4 bg-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Trusted <span className="text-accent animate-glow-pulse">Globally</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our disaster monitoring system is trusted by governments, organizations, 
            and millions of users worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-card/30 backdrop-blur-sm rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
            >
              <div className="mb-4">
                <AnimatedCounter number={stat.number} suffix={stat.suffix} />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-primary">
                {stat.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-64 h-64 bg-gradient-cyber opacity-5 rounded-full blur-3xl animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 6}s`
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;