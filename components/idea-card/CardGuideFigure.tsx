import Image from "next/image";

export function CardGuideFigure({
  src,
  alt,
  eyebrow,
  title,
  description,
}: {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-ink/10 bg-[#EEEAE1]">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 760px"
          className="object-cover"
        />
      </div>
      <figcaption className="border-t border-ink/10 bg-[#FBF9F5] px-4 py-3.5 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-plum">{eyebrow}</p>
        <h3 className="mt-1 text-base font-semibold tracking-tight text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-ink/58">{description}</p>
      </figcaption>
    </figure>
  );
}