import React, { useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { Event } from "./event.d";

export const Calendar = ({ events }: { events: Event[] }) => {
  const calendarRef = useRef<FullCalendar>(null);

  const renderedEvents: FullCalendar["props"]["events"] = useMemo(() => {
    return events.map((e) => {
      return {
        id: e.id,
        date: e.hide_end_date ? undefined : e.start.utc,
        title: e.name.text,
        url: e.url,
      };
    });
  }, [events]);

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin]}
      initialView="dayGridWeek"
      eventDisplay="block"
      events={renderedEvents}
    />
  );
};
