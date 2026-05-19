import { addDays, format, isBefore, isSameDay, startOfDay } from "date-fns";

export function dayStart(value = new Date()) {
  return startOfDay(value);
}

export function tomorrowStart(value = new Date()) {
  return addDays(dayStart(value), 1);
}

export function dayKey(value: Date | string) {
  return format(new Date(value), "yyyy-MM-dd");
}

export function isBeforeToday(value: Date, today = dayStart()) {
  return isBefore(startOfDay(value), today);
}

export function isToday(value: Date, today = dayStart()) {
  return isSameDay(value, today);
}

export function isTomorrow(value: Date, today = dayStart()) {
  return isSameDay(value, addDays(today, 1));
}
