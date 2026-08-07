import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** The business name captured during account creation, if any — never a fabricated default. */
export function getBusinessName(): string | null {
  return localStorage.getItem('vanta_business_name');
}
