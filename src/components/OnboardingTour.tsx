"use client";

import { useState, useEffect } from "react";
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride";

const STEPS: Step[] = [
  {
    target: "body",
    title: "Добро пожаловать в Hotel CRM!",
    content: "Давайте быстро познакомимся с системой. Это займёт меньше минуты.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: 'a[href="/dashboard"]',
    title: "Дашборд",
    content: "Главная страница: загрузка отеля, активные бронирования и метрики.",
    disableBeacon: true,
  },
  {
    target: 'a[href="/guests"]',
    title: "Гости",
    content: "Карточки гостей, история визитов, сегменты. Поиск по имени, email, телефону.",
    disableBeacon: true,
  },
  {
    target: 'a[href="/bookings"]',
    title: "Бронирования",
    content: "Полный жизненный цикл: pending → confirmed → checked_in → checked_out. Конфликты дат блокируются автоматически.",
    disableBeacon: true,
  },
  {
    target: 'a[href="/campaigns"]',
    title: "Кампании",
    content: "Email-маркетинг по сегментам гостей. Статистика отправок.",
    disableBeacon: true,
  },
  {
    target: 'a[href="/channels"]',
    title: "Каналы",
    content: "Синхронизация с Booking.com и Airbnb. Логи операций и управление синком.",
    disableBeacon: true,
  },
];

const STORAGE_KEY = "hotel_crm_tour_completed";

interface OnboardingTourProps {
  role: string;
}

export function OnboardingTour({ role }: OnboardingTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (role !== "admin") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;
    // Short delay so navigation renders first
    const t = setTimeout(() => setRun(true), 800);
    return () => clearTimeout(t);
  }, [role]);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(STORAGE_KEY, "true");
      setRun(false);
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableScrolling={false}
      callback={handleCallback}
      locale={{
        back: "Назад",
        close: "Закрыть",
        last: "Завершить",
        next: "Далее",
        skip: "Пропустить",
      }}
      styles={{
        options: {
          primaryColor: "#2563EB",
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: "left",
        },
      }}
    />
  );
}
