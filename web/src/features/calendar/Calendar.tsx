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
        title: `${e.name.text}|||${e.description.text}|||${e.logo.url}`,
        url: e.url,
      };
    }) as FullCalendar["props"]["events"];
  }, [events]);

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      events={renderedEvents}
      eventContent={(eventInfo) => {
        const [title, description, image] = eventInfo.event.title.split("|||");
        const [tag, name] = title.split(": ");
        return (
          <div
            className="max-w-full text-lg hint--top hint--large bg-purple-400 text-gray-900 p-1"
            aria-label={description}
          >
            <div className="overflow-hidden">
              <p>
                <span>{eventInfo.timeText}</span> •{" "}
                {tag ? <span>{tag}</span> : undefined}
              </p>
              <p>{tag ? <span>{name}</span> : <span>{title}</span>}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="pointer-events-none"
                alt={description}
                src={image}
              />
            </div>
          </div>
        );
      }}
    />
  );
};
