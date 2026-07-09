import { useEffect, useState } from 'react';

const getCurrentHour = () => new Date().getHours();

const msUntilNextHourBoundary = () => {
  const now = new Date();
  return (
    (59 - now.getMinutes()) * 60 * 1000 +
    (59 - now.getSeconds()) * 1000 +
    (1000 - now.getMilliseconds())
  );
};

export const useHourlyTick = () => {
  const [hour, setHour] = useState(getCurrentHour);

  useEffect(() => {
    const syncHour = () => {
      const nextHour = getCurrentHour();
      setHour((prev) => (prev === nextHour ? prev : nextHour));
    };

    let hourlyInterval;
    const boundaryTimeout = setTimeout(() => {
      syncHour();
      hourlyInterval = setInterval(syncHour, 60 * 60 * 1000);
    }, msUntilNextHourBoundary());

    return () => {
      clearTimeout(boundaryTimeout);
      if (hourlyInterval) clearInterval(hourlyInterval);
    };
  }, []);

  return hour;
};

export default useHourlyTick;