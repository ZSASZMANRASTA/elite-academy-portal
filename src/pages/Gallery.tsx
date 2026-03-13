import heroSchool from "@/assets/hero-school.jpg";
import heroLab from "@/assets/hero-lab.jpg";
import heroSports from "@/assets/hero-sports.jpg";

const photos = [
  { src: heroSchool, alt: "School campus", label: "Campus" },
  { src: heroLab, alt: "Science lab", label: "Science Lab" },
  { src: heroSports, alt: "Sports field", label: "Sports" },
  { src: heroSchool, alt: "Assembly hall", label: "Assembly" },
  { src: heroLab, alt: "Practical session", label: "Practicals" },
  { src: heroSports, alt: "Athletics", label: "Athletics" },
];

const Gallery = () => {
  return (
    <div className="container py-16">
      <h1 className="font-display text-4xl font-bold">Gallery</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        A glimpse into life at Rongai Elite Academy.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, i) => (
          <div key={i} className="group relative overflow-hidden rounded-lg shadow-sm">
            <img
              src={photo.src}
              alt={photo.alt}
              className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="font-display font-semibold text-card">{photo.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
