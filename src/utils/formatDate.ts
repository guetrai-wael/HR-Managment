/**
 * Formats a date string or Date object into a more readable format (e.g., "May 2, 2025").
 * Returns an empty string if the input date is invalid.
 * @param dateInput - The date string or Date object to format.
 * @returns The formatted date string or an empty string.
 */
export const formatDate = (
  dateInput: string | Date | null | undefined
): string => {
  if (!dateInput) {
    return "";
  }

  try {
    const date = new Date(dateInput);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return ""; // Return empty string for invalid dates
    }

    // Format the date (e.g., "May 2, 2025")
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (_error) {
    return ""; // Return empty string on error
  }
};
