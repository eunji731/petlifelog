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
    setCurrentDate(now);
    setSelectedDate(now);
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
