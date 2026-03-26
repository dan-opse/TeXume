"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export interface HeroSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  animatedTexts: string[];
  subtitle: string;
  infoBadgeText: string;
  ctaButtonText: string;
  socialProofText: string;
  avatars: {
    src: string;
    alt: string;
    fallback: string;
  }[];
}

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  ({ className, title, animatedTexts, subtitle, infoBadgeText, ctaButtonText, socialProofText, avatars, ...props }, ref) => {
    const [textIndex, setTextIndex] = React.useState(0);
    const [displayText, setDisplayText] = React.useState("");
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Effect for the typewriter animation
    React.useEffect(() => {
      const fullText = animatedTexts[textIndex];

      const handleTyping = () => {
        if (isDeleting) {
          setDisplayText((prev) => prev.substring(0, prev.length - 1));
        } else {
          setDisplayText((prev) => fullText.substring(0, prev.length + 1));
        }
      };

      const typingSpeed = isDeleting ? 75 : 150;
      const typeInterval = setInterval(handleTyping, typingSpeed);

      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === "") {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % animatedTexts.length);
      }

      return () => clearInterval(typeInterval);
    }, [displayText, isDeleting, textIndex, animatedTexts]);

    return (
      <section
        className={cn("container mx-auto flex flex-col items-center justify-center text-center py-20 px-6", className)}
        ref={ref}
        {...props}
      >
        <div className="max-w-4xl">
          {/* Main Heading */}
          <h1 className="text-4xl font-extralight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[5rem] leading-[1.1]">
            {title}
            <span className="relative mt-2 block w-fit mx-auto font-medium">
              <span className="absolute inset-0 -z-10 -m-2">
                <span className="absolute inset-0 border-2 border-dashed border-primary/40 rounded-2xl"></span>
              </span>
              <span className="text-primary min-h-[1.2em] inline-block">
                {displayText}
                <span className="animate-pulse">|</span>
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-8 text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto font-light">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
          {/* Info Badge */}
          <div className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-4 py-1.5 text-xs font-semibold tracking-widest uppercase">
            {infoBadgeText}
          </div>

          {/* CTA Button */}
          <Link href="/build">
            <Button size="lg" className="px-10 py-7 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              {ctaButtonText}
            </Button>
          </Link>

          {/* Social Proof */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex -space-x-4">
              {avatars.map((avatar, index) => (
                <Avatar key={index} className="border-2 border-background w-10 h-10">
                  <AvatarImage src={avatar.src} alt={avatar.alt} />
                  <AvatarFallback>{avatar.fallback}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {socialProofText}
            </p>
          </div>
        </div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";

export { HeroSection };
