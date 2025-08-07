import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Shield, Zap, Brain, Satellite, AlertTriangle } from 'lucide-react';
import gsap from 'gsap';

const features = [
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Monitor disasters worldwide with real-time satellite imagery and ground reports.",
    badge: "24/7 Active"
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning algorithms detect and predict natural disasters.",
    badge: "Smart AI"
  },
  {
    icon: AlertTriangle,
    title: "Instant Alerts",
    description: "Get notified immediately when disasters occur in your areas of interest.",
    badge: "Real-time"
  },
  {
    icon: Satellite,
    title: "Satellite Integration",
    description: "Access to multiple satellite feeds for comprehensive disaster monitoring.",
    badge: "Multi-source"
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Evaluate potential risks and prepare for incoming threats.",
    badge: "Predictive"
  },
  {
    icon: Zap,
    title: "Rapid Response",
    description: "Connect with emergency services and coordinate relief efforts.",
    badge: "Emergency"
  }
];

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(cardsRef.current,
              { opacity: 0, y: 50, scale: 0.8 },
              { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.7)"
              }
            );
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-glow">
            Advanced <span className="text-accent">Monitoring</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Cutting-edge technology meets disaster preparedness. Our platform combines AI, 
            satellite data, and real-time analysis to keep you informed and protected.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 group hover:shadow-cyber"
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-cyber rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-foreground" />
                    </div>
                  </div>
                  <div className="flex justify-center mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;