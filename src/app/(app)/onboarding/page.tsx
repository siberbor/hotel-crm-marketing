"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

const STEPS = [
  {
    id: 1,
    title: "Добро пожаловать!",
    content:
      "Hotel CRM поможет вам эффективно управлять отелем. Этот тур познакомит вас с основными функциями.",
    icon: "👋",
  },
  {
    id: 2,
    title: "Гости",
    content:
      'В разделе "Гости" вы можете добавлять новых гостей, редактировать их профили и просматривать историю бронирований.',
    icon: "👤",
  },
  {
    id: 3,
    title: "Бронирования",
    content:
      "Управляйте бронированиями: создавайте новые, подтверждайте, селите гостей и отслеживайте статусы.",
    icon: "📅",
  },
  {
    id: 4,
    title: "Каналы",
    content:
      "Подключите Booking.com, Airbnb и другие каналы для автоматической синхронизации бронирований.",
    icon: "🔗",
  },
  {
    id: 5,
    title: "Кампании",
    content:
      "Отправляйте email-рассылки гостям: приветственные письма, поздравления, спецпредложения.",
    icon: "📧",
  },
  {
    id: 6,
    title: "Отчёты",
    content:
      'Анализируйте загрузку, выручку и другие метрики в разделе "Отчёты".',
    icon: "📊",
  },
];

async function completeOnboarding() {
  await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
      router.push("/dashboard");
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.push("/dashboard");
  };

  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{step.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {step.title}
          </h1>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
          {step.content}
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep
                  ? "bg-blue-600"
                  : i < currentStep
                    ? "bg-green-500"
                    : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleSkip} className="flex-1">
            Пропустить
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentStep === STEPS.length - 1 ? "Завершить" : "Далее"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
