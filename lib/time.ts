export const QUARTER_HOUR_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const totalMinutes = index * 15;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  const value = `${hour}:${minute}`;
  return { value, label: value };
});

export const todayIso = () => new Date().toISOString().slice(0, 10);
