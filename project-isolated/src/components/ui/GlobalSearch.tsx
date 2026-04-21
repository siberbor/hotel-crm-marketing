"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input, Card } from "@/components/ui";

interface SearchResult {
  guests: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
  }[];
  bookings: { id: number; status: string; totalPrice: string }[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.data) {
          setResults(data.data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (type: string, _id: number) => {
    setIsOpen(false);
    setQuery("");
    if (type === "guest") router.push(`/guests`);
    if (type === "booking") router.push(`/bookings`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <Input
        placeholder="Поиск гостей, бронирований..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        className="w-full"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {isOpen && results && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <Card padding="sm">
            {results.guests?.length === 0 && results.bookings?.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">Ничего не найдено</p>
            ) : (
              <>
                {results.guests && results.guests.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs text-gray-500 mb-2 px-2">Гости</p>
                    {results.guests.map((guest) => (
                      <div
                        key={guest.id}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => goTo("guest", guest.id)}
                      >
                        <p className="text-sm font-medium">
                          {guest.firstName} {guest.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {guest.email || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {results.bookings && results.bookings.length > 0 && (
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 mb-2 px-2">
                      Бронирования
                    </p>
                    {results.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => goTo("booking", booking.id)}
                      >
                        <p className="text-sm font-medium">
                          Бронирование #{booking.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₽{booking.totalPrice} • {booking.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
