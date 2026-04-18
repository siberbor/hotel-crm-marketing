"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { qk } from "@/lib/query-keys";

export interface CurrentUser {
  id: number;
  name: string;
  role: string;
  email: string;
}

async function fetchMe(): Promise<CurrentUser> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Unauthorized");
  const data = await res.json();
  return data.data?.user;
}

export function useCurrentUser() {
  const router = useRouter();
  const query = useQuery({
    queryKey: qk.auth.me(),
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000, // 5min — auth doesn't change often
    retry: false,
  });

  useEffect(() => {
    if (query.isError) router.push("/login");
  }, [query.isError, router]);

  return query;
}
