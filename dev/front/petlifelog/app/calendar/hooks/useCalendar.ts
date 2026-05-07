'use client';

import { useState, useCallback } from 'react';

export function useCalendar(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const onPrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const onNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const onToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  const onSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const goToDate = useCallback((year: number, month: number) => {
    // month is 0-indexed (0 = Jan, 11 = Dec)
    setCurrentDate(new Date(year, month, 1));
  }, []);

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
