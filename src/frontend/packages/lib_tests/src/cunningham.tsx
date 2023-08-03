import { screen } from '@testing-library/react';
import userEventInit from '@testing-library/user-event';
import { DateTime } from 'luxon';

/**
 * To simulate a user typing a date in the Cunningham date picker
 * @param startingAt
 * @param userEvent
 */
export const userTypeDatePicker = async (
  datetime: DateTime,
  element: Element,
  userEvent?: ReturnType<typeof userEventInit.setup>,
) => {
  const localUserEvent = userEvent || userEventInit;
  await localUserEvent.click(element);

  const [monthSegment, daySegment, yearSegment] =
    await screen.findAllByRole('spinbutton');

  await localUserEvent.click(monthSegment);
  expect(monthSegment).toHaveFocus();
  await localUserEvent.keyboard(datetime.toFormat('MM'));

  expect(daySegment).toHaveFocus();
  await localUserEvent.keyboard(datetime.toFormat('dd'));

  expect(yearSegment).toHaveFocus();
  await localUserEvent.keyboard(datetime.toFormat('yyyy'));
};
