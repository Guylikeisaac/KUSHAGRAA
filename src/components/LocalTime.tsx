"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/data";

/** Live clock in Kushagra's timezone (IST). */
export default function LocalTime({ seconds = false }: { seconds?: boolean }) {
  const [now, setNow] = useState<string>("--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: seconds ? "2-digit" : undefined,
      hour12: false,
      timeZone: profile.timezone,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return (
    <time suppressHydrationWarning>
      {now} IST
    </time>
  );
}
