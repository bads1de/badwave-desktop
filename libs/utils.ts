import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getRandomColor = () => {
  const colors = [
    "#00ff87",
    "#60efff",
    "#0061ff",
    "#ff00a0",
    "#ff1700",
    "#fff700",
    "#a6ff00",
    "#00ffa3",
    "#00ffff",
    "#ff00ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const splitTags = (tagString?: string): string[] => {
  return tagString?.split(/\s*,\s*/).map(tag => tag.trim()).filter(Boolean) || [];
};
