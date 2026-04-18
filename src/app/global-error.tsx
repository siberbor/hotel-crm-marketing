"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Что-то пошло не так</h2>
          <p className="text-gray-400">Ошибка зафиксирована. Попробуйте снова.</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Повторить
          </button>
        </div>
      </body>
    </html>
  );
}
