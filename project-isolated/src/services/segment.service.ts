export type Segment = {
  id: number;
  name: string;
  type: "manual" | "auto";
  criteria: Record<string, unknown> | null;
  guestCount: number;
  createdAt: Date;
};

const DEMO_SEGMENTS: Segment[] = [
  {
    id: 1,
    name: "VIP гости",
    type: "auto",
    criteria: { minVisits: 5, minSpent: 50000 },
    guestCount: 1,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    name: "Дни рождения",
    type: "auto",
    criteria: { birthdayThisMonth: true },
    guestCount: 0,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 3,
    name: "Постоянные гости",
    type: "auto",
    criteria: { minVisits: 3 },
    guestCount: 1,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 4,
    name: "Новые гости",
    type: "auto",
    criteria: { maxVisits: 1 },
    guestCount: 2,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: 5,
    name: "Ключевые клиенты",
    type: "manual",
    criteria: null,
    guestCount: 0,
    createdAt: new Date("2024-02-01"),
  },
];

const segments = [...DEMO_SEGMENTS];
let nextId = 6;

export async function getAllSegments() {
  return segments;
}

export async function getSegmentById(id: number) {
  return segments.find((s) => s.id === id) || null;
}

export async function createSegment(
  name: string,
  type: "manual" | "auto" = "manual",
  criteria: Record<string, unknown> | null = null,
) {
  const segment: Segment = {
    id: nextId++,
    name,
    type,
    criteria,
    guestCount: 0,
    createdAt: new Date(),
  };
  segments.push(segment);
  return segment;
}

export async function deleteSegment(id: number) {
  const index = segments.findIndex((s) => s.id === id);
  if (index === -1) return false;
  segments.splice(index, 1);
  return true;
}
