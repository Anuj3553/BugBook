import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNowStrict } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(from: Date | string) {
  // Convert from to a Date object if it is a string
  const dateFrom = new Date(from);

  // Check if the date conversion was successful
  if (isNaN(dateFrom.getTime())) {
    throw new Error("Invalid date passed to formatRelativeDate.");
  }

  const currentDate = new Date();

  if (currentDate.getTime() - dateFrom.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(dateFrom, { addSuffix: true });
  } else {
    if (currentDate.getFullYear() === dateFrom.getFullYear()) {
      return format(dateFrom, "MMM d");
    } else {
      return format(dateFrom, "MMM d, yyyy");
    }
  }
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
}