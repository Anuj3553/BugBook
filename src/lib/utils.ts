import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNowStrict } from "date-fns"

// Add the following functions to the file
export function cn(...inputs: ClassValue[]) { // create a new function called cn
  return twMerge(clsx(inputs)) // merge the class names
}

export function formatRelativeDate(from: Date | string) {
  // Convert from to a Date object if it is a string
  const dateFrom = new Date(from);

  // Check if the date conversion was successful
  if (isNaN(dateFrom.getTime())) {
    throw new Error("Invalid date passed to formatRelativeDate.");
  }

  const currentDate = new Date(); // current date

  // Check if the date is within the last 24 hours
  if (currentDate.getTime() - dateFrom.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(dateFrom, { addSuffix: true }); // format the distance to now
  } else {
    // Check if the date is within the current year
    if (currentDate.getFullYear() === dateFrom.getFullYear()) {
      // Format the date
      return format(dateFrom, "MMM d");
    } else {
      // Format the date
      return format(dateFrom, "MMM d, yyyy");
    }
  }
}

// Add the following functions to the file
export function formatNumber(n: number): string { //
  return Intl.NumberFormat("en-US", { // format the number
    notation: "compact", // compact notation
    maximumFractionDigits: 1, // maximum fraction digits
  }).format(n) // format the number
}

// Add the following functions to the file
export function slugify(input: string): string {
  return input // return the input
    .toLowerCase() // convert to lowercase
    .replace(/ /g, "-") // replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, ""); // remove non-alphanumeric characters
}