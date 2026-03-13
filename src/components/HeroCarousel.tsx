import { useState, useEffect } from "react";
import heroSchool from "@/assets/hero-school.jpg";
import heroLab from "@/assets/hero-lab.jpg";
import heroSports from "@/assets/hero-sports.jpg";

const slides = [
  { src: heroSchool, alt: "Adam's Junior Academy campus" },
  { src: heroLab, alt: "Students in science laboratory" },
  { src: heroSports, alt: "Students playing sports" },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {slides.map((slide, i) => (
        <img
          key={i}
          src={slide.src}
          alt={slide.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-foreground/50" />

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-card" : "w-2 bg-card/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
