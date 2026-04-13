import { useState, useEffect } from "react";
import { useSiteContent, HeroSlide } from "@/hooks/useSiteContent";
import heroSchool from "@/assets/hero-school.jpg";
import heroLab from "@/assets/hero-lab.jpg";
import heroSports from "@/assets/hero-sports.jpg";

const defaultSlides: HeroSlide[] = [
  { src: heroSchool, alt: "Adam's Junior Academy campus" },
  { src: heroLab, alt: "Students in science laboratory" },
  { src: heroSports, alt: "Students playing sports" },
];

const HeroCarousel = () => {
  const { data: slides } = useSiteContent<HeroSlide[]>("hero", defaultSlides);
  const current = slides ?? defaultSlides;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (current.length === 0) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % current.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current.length]);

  // Reset index if slides change
  useEffect(() => { setIdx(0); }, [current.length]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {current.map((slide, i) => (
        <img
          key={i}
          src={slide.src}
          alt={slide.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-foreground/50" />

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {current.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${
              i === idx ? "w-6 bg-card" : "w-2 bg-card/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
