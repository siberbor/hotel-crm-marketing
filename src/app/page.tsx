import Link from "next/link";
import * as roomService from "@/services/room.service";
import "@/styles/tokens-green.css";

export const dynamic = "force-dynamic";

const ROOM_TYPE_LABELS: Record<string, string> = {
  suite: "Сюит",
  junior_suite: "Джуниор сюит",
  family: "Фемили сюит",
  standard: "Стандарт",
  deluxe: "Делюкс",
};

const AMENITY_ICONS: Record<string, string> = {
  wifi: "Wi-Fi",
  tv: "ТВ",
  minibar: "Мини-бар",
  jacuzzi: "Джакузи",
  balcony: "Балкон",
  ac: "Кондиционер",
  safe: "Сейф",
  bathrobes: "Халаты",
};

export default async function HotelHomePage() {
  const rooms = await roomService.getAllRooms();

  return (
    <div className="green-theme" style={{ background: "var(--g-bg)", color: "var(--g-text)", fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh" }}>

      {/* HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--g-header-bg)",
        color: "var(--g-header-text)",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "var(--g-primary)", letterSpacing: "-0.5px" }}>
            MarkG
          </span>
          <span style={{ fontSize: 22, fontWeight: 300, color: "#fff" }}>Hotel</span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#rooms" style={{ color: "var(--g-header-sub)", fontSize: 14, textDecoration: "none", transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--g-header-sub)")}>
            Номера
          </a>
          <a href="#amenities" style={{ color: "var(--g-header-sub)", fontSize: 14, textDecoration: "none" }}>
            Услуги
          </a>
          <a href="#contacts" style={{ color: "var(--g-header-sub)", fontSize: 14, textDecoration: "none" }}>
            Контакты
          </a>
          <Link href="/guest/login" style={{
            background: "var(--g-primary)", color: "#fff",
            padding: "8px 18px", borderRadius: "var(--g-radius-md)",
            fontSize: 14, fontWeight: 600, textDecoration: "none",
            transition: "background .15s",
          }}>
            Личный кабинет
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section style={{
        position: "relative",
        minHeight: 540,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "80px 24px",
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d3a1a 50%, #1a2a0a 100%)",
        overflow: "hidden",
      }}>
        {/* Decorative overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(124,179,66,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 640 }}>
          <div style={{
            display: "inline-block",
            background: "rgba(124,179,66,0.2)", border: "1px solid rgba(124,179,66,0.4)",
            color: "var(--g-primary-light)", borderRadius: "var(--g-radius-pill)",
            padding: "4px 16px", fontSize: 13, marginBottom: 24,
          }}>
            Добро пожаловать
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 700,
            color: "#ffffff", lineHeight: 1.2, marginBottom: 20,
          }}>
            Отдых, который<br />
            <span style={{ color: "var(--g-primary)" }}>вы заслужили</span>
          </h1>

          <p style={{
            fontSize: 18, color: "rgba(255,255,255,0.7)",
            lineHeight: 1.6, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px",
          }}>
            Уютные номера, спа-зона и первоклассный сервис для вашего незабываемого отдыха.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#rooms" style={{
              background: "var(--g-primary)", color: "#fff",
              padding: "14px 32px", borderRadius: "var(--g-radius-md)",
              fontWeight: 600, fontSize: 16, textDecoration: "none",
              transition: "background .15s",
            }}>
              Смотреть номера
            </a>
            <Link href="/guest/login" style={{
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.3)",
              color: "#fff", padding: "14px 32px",
              borderRadius: "var(--g-radius-md)",
              fontWeight: 500, fontSize: 16, textDecoration: "none",
            }}>
              Личный кабинет
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{
        background: "var(--g-header-bg)", color: "#fff",
        padding: "32px 24px",
        display: "flex", justifyContent: "center", gap: 64,
        flexWrap: "wrap",
      }}>
        {[
          { value: rooms.length, label: "Номеров" },
          { value: "5★", label: "Категория" },
          { value: "24/7", label: "Сервис" },
          { value: "SPA", label: "Комплекс" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--g-primary)" }}>{s.value}</div>
            <div style={{ fontSize: 14, color: "var(--g-header-sub)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ROOMS */}
      <section id="rooms" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Наши номера</h2>
        <p style={{ color: "var(--g-text-secondary)", textAlign: "center", marginBottom: 48 }}>
          Каждый номер — это пространство для вашего комфорта
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}>
          {rooms.map((room) => (
            <div key={room.id} className="g-card" style={{ overflow: "hidden", transition: "box-shadow .2s" }}>
              {/* Room image placeholder */}
              <div style={{
                height: 180,
                background: `linear-gradient(135deg, #2d3a1a, #1a2a0a)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(ellipse at center, rgba(124,179,66,0.2) 0%, transparent 70%)",
                }} />
                <span style={{ fontSize: 48, opacity: 0.6 }}>🛏</span>
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "var(--g-primary)", color: "#fff",
                  padding: "4px 10px", borderRadius: "var(--g-radius-pill)",
                  fontSize: 12, fontWeight: 600,
                }}>
                  №{room.number}
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    {ROOM_TYPE_LABELS[room.type] ?? room.type}
                  </h3>
                  <span style={{ color: "var(--g-primary)", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>
                    {Number(room.pricePerNight).toLocaleString("ru-RU")} ₽<span style={{ fontWeight: 400, fontSize: 12, color: "var(--g-text-secondary)" }}>/ночь</span>
                  </span>
                </div>

                <div style={{ display: "flex", gap: 16, marginBottom: 12, color: "var(--g-text-secondary)", fontSize: 13 }}>
                  <span>👥 до {room.capacity} гостей</span>
                  <span>🏢 {room.floor} этаж</span>
                </div>

                {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {(room.amenities as string[]).slice(0, 4).map((a) => (
                      <span key={a} style={{
                        background: "var(--g-primary-bg)", color: "var(--g-primary-hover)",
                        borderRadius: "var(--g-radius-pill)",
                        padding: "2px 10px", fontSize: 12,
                      }}>
                        {AMENITY_ICONS[a] ?? a}
                      </span>
                    ))}
                  </div>
                )}

                <Link href="/guest/login" style={{
                  display: "block", width: "100%", textAlign: "center",
                  background: "var(--g-primary)", color: "#fff",
                  padding: "10px", borderRadius: "var(--g-radius-md)",
                  fontWeight: 600, fontSize: 14, textDecoration: "none",
                  transition: "background .15s",
                }}>
                  Забронировать
                </Link>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--g-text-secondary)", padding: 40 }}>
            Номера загружаются...
          </p>
        )}
      </section>

      {/* AMENITIES */}
      <section id="amenities" style={{ background: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Услуги отеля</h2>
          <p style={{ color: "var(--g-text-secondary)", textAlign: "center", marginBottom: 48 }}>
            Всё для вашего комфорта и отдыха
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 24,
          }}>
            {[
              { icon: "🏊", title: "Бассейн", desc: "Открытый и закрытый" },
              { icon: "💆", title: "СПА-центр", desc: "Массаж и процедуры" },
              { icon: "🍽", title: "Ресторан", desc: "Европейская кухня" },
              { icon: "🏋", title: "Фитнес", desc: "Современное оборудование" },
              { icon: "🧖", title: "Сауна", desc: "Русская баня и хаммам" },
              { icon: "🎱", title: "Бильярд", desc: "Два стола" },
              { icon: "🚗", title: "Парковка", desc: "Бесплатно для гостей" },
              { icon: "📶", title: "Wi-Fi", desc: "Везде и бесплатно" },
            ].map((s) => (
              <div key={s.title} style={{
                padding: 24, borderRadius: "var(--g-radius-md)",
                border: "1px solid var(--g-border)",
                transition: "border-color .2s, box-shadow .2s",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--g-text-secondary)", margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: "var(--g-header-bg)", padding: "80px 24px", textAlign: "center",
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          Уже бронировали у нас?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 32, fontSize: 16 }}>
          Войдите в личный кабинет, чтобы управлять бронированием и заказывать услуги
        </p>
        <Link href="/guest/login" style={{
          display: "inline-block",
          background: "var(--g-primary)", color: "#fff",
          padding: "16px 40px", borderRadius: "var(--g-radius-md)",
          fontWeight: 700, fontSize: 16, textDecoration: "none",
        }}>
          Войти в личный кабинет
        </Link>
      </section>

      {/* FOOTER */}
      <footer id="contacts" style={{
        background: "#111", color: "rgba(255,255,255,0.5)",
        padding: "48px 24px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--g-primary)" }}>MarkG</span>
                <span style={{ fontSize: 18, color: "#fff" }}>Hotel</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                Место, где каждая деталь создана для вашего комфорта.
              </p>
            </div>

            <div>
              <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Контакты</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, lineHeight: 2 }}>
                <li>📞 +7 (999) 000-00-00</li>
                <li>📧 info@markghotel.ru</li>
                <li>📍 ул. Примерная, 1</li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Гостям</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, lineHeight: 2 }}>
                <li><a href="#rooms" style={{ color: "inherit", textDecoration: "none" }}>Номера</a></li>
                <li><a href="#amenities" style={{ color: "inherit", textDecoration: "none" }}>Услуги</a></li>
                <li>
                  <Link href="/guest/login" style={{ color: "var(--g-primary)", textDecoration: "none" }}>
                    Личный кабинет
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Персонал</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, lineHeight: 2 }}>
                <li>
                  <Link href="/staff/login" style={{ color: "inherit", textDecoration: "none" }}>
                    Портал сотрудника
                  </Link>
                </li>
                <li>
                  <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>
                    CRM система
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 24, textAlign: "center", fontSize: 12,
          }}>
            © {new Date().getFullYear()} MarkG Hotel. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}
