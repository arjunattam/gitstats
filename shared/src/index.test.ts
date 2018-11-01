import { durationInWords } from "./index";

test("duration in words", () => {
  const ONE_HOUR = 3600;

  // less than an hour
  expect(durationInWords(ONE_HOUR * 0.5)).toBe("30 minutes");

  // rounding
  expect(durationInWords(ONE_HOUR * 1.1)).toBe("1 hour");

  // plural
  expect(durationInWords(ONE_HOUR * 2)).toBe("2 hours");

  // with minutes
  expect(durationInWords(ONE_HOUR * 3.5)).toBe("4 hours");

  // more than a day
  expect(durationInWords(ONE_HOUR * 27)).toBe("1 day, 3 hours");

  // more than a week
  expect(durationInWords(ONE_HOUR * 24 * 9)).toBe("1 week, 2 days");
});
