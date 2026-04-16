export type Notification = {
  id: string;
  type: "booking" | "check_in" | "check_out" | "complaint" | "campaign";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

let notifications: Notification[] = [
  {
    id: "1",
    type: "booking",
    title: "Новое бронирование",
    message: "Иван Петров забронировал номер 101",
    read: false,
    createdAt: new Date(),
  },
  {
    id: "2",
    type: "check_in",
    title: "Заселение",
    message: "Анна Сидорова заселилась в номер 202",
    read: false,
    createdAt: new Date(),
  },
  {
    id: "3",
    type: "complaint",
    title: "Жалоба",
    message: "Поступила жалоба от гостя",
    read: true,
    createdAt: new Date(),
  },
];

export async function getNotifications(userId?: number) {
  return notifications.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function getUnreadCount(userId?: number) {
  return notifications.filter((n) => !n.read).length;
}

export async function addNotification(
  notification: Omit<Notification, "id" | "createdAt">,
) {
  const newNotification: Notification = {
    ...notification,
    id: String(Date.now()),
    createdAt: new Date(),
  };
  notifications.unshift(newNotification);
  return newNotification;
}

export async function markAsRead(id: string) {
  const notification = notifications.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
    return true;
  }
  return false;
}

export async function markAllAsRead() {
  notifications.forEach((n) => (n.read = true));
  return true;
}
