import { PropsWithChildren } from 'react';
import ICalendarLink from 'react-icalendar-link';

declare module 'react-icalendar-link' {
  const ICalLink: typeof PropsWithChildren<ICalendarLink>;
  export default ICalLink;
}
