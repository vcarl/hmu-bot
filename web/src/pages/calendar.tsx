import React from "react";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { Calendar } from "@/features/calendar/Calendar";
import { Event } from "@/features/calendar/event";

async function getEvents() {
  const res = await fetch(
    "https://www.eventbrite.com/org/69189357793/showmore/?page_size=1000&type=future&page=1",
  );
  return (
    (await res.json()) as {
      data: { events: Event[] };
      success: boolean;
    }
  ).data.events;
}

export const getStaticProps = (async () => {
  return { props: { events: await getEvents() } };
}) satisfies GetStaticProps<{ events: Event[] }>;

const EventCalendarPage = ({
  events,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return <Calendar events={events} />;
};

export default EventCalendarPage;
