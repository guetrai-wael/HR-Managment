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

/**
 * Format bytes into human readable string, e.g. 1024 -> "1.00 KB".
 * Returns empty string for missing/invalid input.
 */
export const formatBytes = (bytes?: number | null): string => {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return "";
  const b = Number(bytes);
  if (!isFinite(b) || b <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  const value = b / Math.pow(1024, i);
  return `${value.toFixed(2)} ${units[i]}`;
};

/**
 * Format seconds into HH:MM:SS (e.g., 3661 -> "01:01:01"). Returns '—' for invalid/null.
 */
export const formatSeconds = (secs?: number | null | undefined): string => {
  if (secs === null || secs === undefined || Number.isNaN(secs)) return "—";
  const s = Math.max(0, Math.floor(Number(secs)));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
};
