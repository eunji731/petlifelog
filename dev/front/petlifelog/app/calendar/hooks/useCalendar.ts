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
    // Reset time components to ensure date-only comparison is clean
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const onSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  return {
    currentDate,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    onToday,
    onSelectDate,
  };
}
