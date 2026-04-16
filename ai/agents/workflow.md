## Task Execution Flow

1. Planner agent:
   - разбивает задачу
   - определяет зависимости

2. Worker agents:
   - реализуют части задачи

3. Review agent:
   - проверяет код
   - валидирует against AGENTS.md

4. QA agent:
   - пишет и запускает тесты

5. Merge:
   - только после review + tests

## Task Prompt Template (Unified)

Каждая задача должна генерировать промпт:

- роль агента
- цель
- ограничения
- файлы
- acceptance criteria
- чеклист перед завершением