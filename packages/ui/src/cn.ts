import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose Tailwind class names safely:
 *  - clsx handles conditional / falsy values
 *  - tailwind-merge resolves conflicting utilities (last wins, by family)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
