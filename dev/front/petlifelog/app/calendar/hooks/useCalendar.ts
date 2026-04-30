'use client';

import { useState } from 'react';

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const onPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const onNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const onToday = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const onSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const goToDate = (year: number, month: number) => {
    // month is 0-indexed (0 = Jan, 11 = Dec)
    setCurrentDate(new Date(year, month, 1));
  };

  return {
    currentDate,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    onToday,
    onSelectDate,
    goToDate,
  };
}
