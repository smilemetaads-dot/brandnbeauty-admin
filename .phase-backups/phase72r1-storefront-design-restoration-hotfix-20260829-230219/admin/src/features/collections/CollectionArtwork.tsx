"use client";

import Image, { type ImageLoaderProps } from "next/image";

const passthroughLoader = ({ src }: ImageLoaderProps) => src;

export function CollectionArtwork({ alt, className = "", priority = false, src, sizes }: { alt: string; className?: string; priority?: boolean; src: string; sizes: string }) {
  return <Image alt={alt} className={className} fill loader={passthroughLoader} priority={priority} sizes={sizes} src={src} unoptimized/>;
}
