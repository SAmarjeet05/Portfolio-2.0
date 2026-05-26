/**
 * Parse timeline string to extract started date and duration
 * Expected format: "Month Year - Month Year" or "Month Year - Present"
 * Example: "January 2024 - April 2024" or "May 2024 - Present"
 */

interface TimelineData {
  startedDate: string;
  duration: string;
}

const monthMap: { [key: string]: number } = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export const parseTimeline = (timeline: string): TimelineData => {
  if (!timeline) {
    return { startedDate: 'N/A', duration: 'N/A' };
  }

  try {
    const parts = timeline.split(' - ').map((part) => part.trim());
    if (parts.length !== 2) {
      return { startedDate: 'N/A', duration: 'N/A' };
    }

    const [startStr, endStr] = parts;
    
    // Parse start date (e.g., "January 2024")
    const startParts = startStr.split(' ');
    if (startParts.length !== 2) {
      return { startedDate: 'N/A', duration: 'N/A' };
    }
    
    const startMonth = startParts[0];
    const startYear = parseInt(startParts[1], 10);

    // Extract started date (e.g., "Jan 2024")
    const startedDate = `${startMonth.substring(0, 3)} ${startYear}`;

    // Calculate duration
    let duration = 'N/A';
    
    if (endStr.toLowerCase() === 'present') {
      duration = 'Ongoing';
    } else {
      const endParts = endStr.split(' ');
      if (endParts.length === 2) {
        const endMonth = endParts[0].toLowerCase();
        const endYear = parseInt(endParts[1], 10);
        const startMonthNum = monthMap[startMonth.toLowerCase()];
        const endMonthNum = monthMap[endMonth];

        if (startMonthNum && endMonthNum) {
          const totalMonths =
            (endYear - startYear) * 12 + (endMonthNum - startMonthNum);
          
          if (totalMonths === 0) {
            duration = '1 month';
          } else if (totalMonths === 1) {
            duration = '1 month';
          } else if (totalMonths < 12) {
            duration = `${totalMonths} months`;
          } else {
            const years = Math.floor(totalMonths / 12);
            const months = totalMonths % 12;
            if (months === 0) {
              duration = `${years} year${years > 1 ? 's' : ''}`;
            } else {
              duration = `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
            }
          }
        }
      }
    }

    return { startedDate, duration };
  } catch (error) {
    return { startedDate: 'N/A', duration: 'N/A' };
  }
};
