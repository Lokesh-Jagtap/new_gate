export const formatSapDate = (sapDateStr) => {
  if (!sapDateStr || !sapDateStr.startsWith("/Date(")) return sapDateStr;
  const timestamp = parseInt(sapDateStr.replace(/[^0-9]/g, ""), 10);
  const date = new Date(timestamp);
  return `${String(date.getDate()).padStart(2,"0")}-${String(date.getMonth()+1).padStart(2,"0")}-${date.getFullYear()}`;
};

export const formatSapDuration = (duration) => {
  if (!duration) return "";
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  return `${(match[1]||"0").padStart(2,"0")}:${(match[2]||"0").padStart(2,"0")}:${(match[3]||"0").padStart(2,"0")}`;
};
