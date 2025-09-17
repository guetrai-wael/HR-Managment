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

/**
 * Formats a date string or Date object into a compact numeric format (e.g., "02/05/2025").
 * Returns an empty string if the input date is invalid.
 * @param dateInput - The date string or Date object to format.
 * @returns The formatted date string in DD/MM/YYYY format or an empty string.
 */
export const formatDateNumeric = (
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

    // Format the date (e.g., "02/05/2025" for DD/MM/YYYY)
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (_error) {
    return ""; // Return empty string on error
  }
};
