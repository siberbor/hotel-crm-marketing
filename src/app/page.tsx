import Link from "next/link";

export default function Home() {
  const features = [
    {
      icon: "👥",
      title: "Управление гостями",
      desc: "Полная база гостей с историей посещений, предпочтениями и тегами",
    },
    {
      icon: "📅",
      title: "Бронирования",
      desc: "Полный цикл бронирования: от создания до выселения",
    },
    {
      icon: "📧",
      title: "Email-маркетинг",
      desc: "Создавайте кампании и отправляйте письма гостям",
    },
    {
      icon: "📊",
      title: "Аналитика",
      desc: "Отчёты о загрузке, выручке и эффективности",
    },
    {
      icon: "🔗",
      title: "Интеграции",
      desc: "Синхронизация с Booking.com, Airbnb и другими каналами",
    },
    {
      icon: "🔔",
      title: "Уведомления",
      desc: "Real-time уведомления о новых бронированиях и событиях",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏨</span>
            <span className="text-xl font-bold text-gray-900">Hotel CRM</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Возможности
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Тарифы
            </a>
            <a
              href="#contacts"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Контакты
            </a>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Вход в систему
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            CRM для современного <span className="text-blue-600">отеля</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Управляйте гостями, бронированиями и маркетингом в одном месте.
            Автоматизация, аналитика и интеграции с каналами продаж.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Простые тарифы
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Платите только за то, что используете
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Старт
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">
                ₽0
                <span className="text-sm font-normal text-gray-500">/мес</span>
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>✓ До 5 пользователей</li>
                <li>✓ 100 гостей</li>
                <li>✓ Базовая аналитика</li>
              </ul>
              <Link
                href="/login"
                className="block w-full py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Начать
              </Link>
            </div>

            <div className="bg-blue-600 p-6 rounded-xl shadow-lg">
              <div className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full mb-4">
                Популярный
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Бизнес</h3>
              <p className="text-3xl font-bold text-white mb-4">
                ₽9,900
                <span className="text-sm font-normal text-blue-200">/мес</span>
              </p>
              <ul className="space-y-2 text-blue-100 mb-6">
                <li>✓ До 20 пользователей</li>
                <li>✓ Безлимитные гости</li>
                <li>✓ Все интеграции</li>
                <li>✓ Email-рассылки</li>
                <li>✓ Приоритетная поддержка</li>
              </ul>
              <Link
                href="/login"
                className="block w-full py-2 text-center bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Попробовать
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Премиум
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">
                ₽24,900
                <span className="text-sm font-normal text-gray-500">/мес</span>
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>✓ Безлимит пользователей</li>
                <li>✓ Персональный менеджер</li>
                <li>✓ SLA 99.9%</li>
                <li>✓ Индивидуальная интеграция</li>
              </ul>
              <Link
                href="/login"
                className="block w-full py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Связаться
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Готовы улучшить управление отелем?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Начните бесплатно уже сегодня. Настройка занимает 5 минут.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-medium rounded-xl hover:bg-blue-50 transition-colors"
          >
            Попробовать бесплатно
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacts" className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏨</span>
                <span className="text-xl font-bold text-white">Hotel CRM</span>
              </div>
              <p className="text-sm">
                Современная CRM система для управления отелем любого размера.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Возможности
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Тарифы
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Интеграции
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Компания</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    О нас
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Блог
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Контакты
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Контакты</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 info@hotelcrm.ru</li>
                <li>📞 +7 (999) 000-00-00</li>
                <li>📍 Москва, ул. Примерная 1</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-sm text-center">
            © 2024 Hotel CRM. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}
