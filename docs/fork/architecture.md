# Карта кода

Проверено по upstream `cc0425c21ce82cf509c7ce211356b456a8874f35` (2026-10-28).
Это карта существующей реализации. Выбирайте строку по задаче; читать все файлы не требуется.
Планы русского форка находятся в [product.md](product.md) и [roadmap.md](roadmap.md).

## Границы приложения

Next.js App Router + React + TypeScript; серверные маршруты и браузерный интерфейс
живут в одном приложении. `@/` указывает на `src/` (см. `tsconfig.json`).
Главные каталоги upstream сохраняем, чтобы проще получать его исправления.

| Задача | Начать здесь | Затем, если требуется |
| --- | --- | --- |
| Страница и компоновка игрового стола | `src/app/campaigns/[campaignId]/table/page.tsx`, `TableLayout.tsx` в каталоге кампании | `src/app/campaigns/[campaignId]/useCampaignStream.ts`, `src/components/ui/` |
| Создание кампании и настройки | `src/app/create-campaign/`, `src/lib/schemas/game-settings.ts` | `src/lib/schemas/game-settings-options.ts`, `src/lib/db/campaigns.ts` |
| Действие игрока | `src/app/api/campaigns/[campaignId]/actions/route.ts` | `src/lib/dm/intent-logic.ts`, `src/lib/dm/loop.ts` |
| Ход ИИ-мастера, остановка и продолжение | `src/lib/dm/turn.ts`, `src/lib/dm/queue.ts` | `src/lib/db/dm-turns.ts`, `src/lib/dm/job-control.ts` |
| Промпт, выбор памяти и бюджет | `src/lib/dm/prompt.ts`, `src/lib/dm/context-retrieval.ts` | `src/lib/dm/context-budget.ts`, `src/lib/dm/request-fit.ts`, `src/lib/dm/tool-profiles.ts` |
| Память кампании, итоги и факты | `src/lib/dm/memory-index.ts`, `src/lib/dm/recall.ts`, `src/lib/dm/recap.ts` | `src/lib/db/scene-chunks.ts`, `src/lib/db/facts.ts`, `src/lib/embeddings.ts` |
| Вызовы модели и выбор провайдера | `src/lib/dm/model.ts`, `src/lib/model-client.ts` | [text-backends.md](../text-backends.md), `src/lib/model-registry/` |
| CLI-агент как игровой рассказчик | `src/lib/harness/bridge.ts`, `src/lib/harness/adapters/` | [agent-harness.md](../agent-harness.md); `src/lib/agents/` и `src/app/api/mcp/route.ts` для внешнего MCP-клиента |
| Правила, броски, ресурсы персонажа | `src/lib/srd/`, `src/lib/dm/invoke.ts`, `src/lib/dm/invoke-dispatch.ts` | [rules-coverage.md](../rules-coverage.md), [engines.md](../engines.md), `src/lib/dm/*-logic.ts` |
| Сохранение и схема БД | `src/lib/db/core.ts`, `src/lib/db/driver.ts` | профильный файл `src/lib/db/`, [storage.md](../storage.md) |
| Доступ к кампании и секреты мастера | `src/lib/campaign-api.ts`, `src/lib/dm/viewer.ts` | `src/lib/table-delivery.ts`, `src/lib/event-audience.ts` |
| События и переподключение | `src/lib/events.ts`, `src/app/api/campaigns/[campaignId]/events/route.ts` | `src/app/campaigns/[campaignId]/useCampaignStream.ts` |
| Русский текст и морфология | `src/lib/dm/table-language-logic.ts`, `src/lib/language/` | `src/lib/schemas/game-settings-options.ts`, `src/lib/dm/prompt.ts` |
| Диктовка игрока (STT) | `src/app/api/stt/route.ts`, `src/lib/stt-backend.ts`, `src/lib/stt.ts` | `src/lib/stt-builtin.ts`, `src/components/DictateField.tsx` |
| Озвучивание рассказчика (TTS) | `src/lib/tts.ts`, `src/lib/tts-backend.ts`, `src/lib/tts-render.ts` | `src/lib/tts-cast.ts`, `src/app/campaigns/[campaignId]/useNarrationAudio.ts` |
| Голосовая связь между игроками | `src/lib/voice/`, `src/app/campaigns/[campaignId]/useVoiceRoom.ts` | [voice-and-dice.md](../voice-and-dice.md), `src/app/api/campaigns/[campaignId]/voice/` |
| Миры, авторский контент и дополнения | `src/lib/worlds/`, `src/lib/worldforge/`, `src/lib/workshop/`, `src/lib/addons/` | [addons/framework.md](../addons/framework.md), [content.md](../content.md) |
| Картинки и звуки | `src/lib/image-generate.ts`, `src/lib/ambience/`, `public/` | [image-generation.md](../image-generation.md), [media-setup.md](../media-setup.md) |

## Путь действия игрока

1. Стол отправляет действие в `POST /api/campaigns/[campaignId]/actions`.
   Маршрут проверяет участника, право говорить, персонажа, форму запроса и состояние игры.
2. Действие сохраняется. `requestDmTurn` в `dm/loop.ts` объединяет близкие запросы
   и ставит ход в очередь кампании; карточки действий могут обращаться к движку напрямую.
3. `dm/turn.ts` ведет сохраняемый автомат хода: собирает контекст, вызывает модель
   через `dm/model.ts`, исполняет инструменты и умеет ждать физических бросков.
4. Серверный движок проверяет изменения состояния. Рассказ модели не является
   источником числовых результатов; состояние и история хранятся в SQLite.
5. `events.ts` доставляет события через SSE с фильтрацией для конкретного участника;
   клиент обновляет стол. Озвучивание рассказа обслуживает отдельный TTS-путь.

## Что уже есть, а что предстоит проверить для русского форка

- Upstream уже принимает `tableLanguage: "russian"`; по умолчанию стоит `"english"`.
  `languageDirective` задает язык рассказа и нового текста, сохраняя точные ключи,
  перечисления и имена, которые движок сопоставляет. Это не перевод интерфейса.
- Есть русский Snowball-стеммер и список стоп-слов. Не заменять их ASCII-регулярками
  или самодельными словарями без проверки поиска русских имен и склонений.
- Интерфейс содержит английские строки непосредственно в TSX и ответах API;
  `src/app/layout.tsx` задает `lang="en"`. Цельная UI-локализация еще требует реализации.
- В `layout.tsx` локальные шрифты описаны как Latin subsets: покрытие кириллицы
  и выбранный fallback следует проверить визуально при локализации.
- STT, TTS и голосовая связь — разные подсистемы. Наличие русского рассказа не
  доказывает качество русской речи: выбранный backend нужно проверять отдельно.
- Контекст уже ограничивается, память извлекается выборочно. Базовая оценка
  `CHARS_PER_TOKEN = 4` — приближение; для русского текста проверять фактическое
  потребление модели и существующую калибровку в `src/lib/dm/token-calibration.ts`.

## Ограничения, влияющие на архитектуру

- Поддерживается один процесс Next.js на одну БД. Очередь ходов, шина событий
  и голосовые комнаты также находятся в памяти процесса. Второй экземпляр
  с той же БД не превращает приложение в горизонтально масштабируемое.
- Схема и обновления БД сейчас находятся в `src/lib/db/core.ts`; отдельной
  новой системы миграций в форке пока нет. Проверять открытие существующей БД.
- Права лидера, ведущего и игрока различаются. Секреты фильтруются на сервере
  и при первоначальном чтении, и в live/replay-событиях.
- Агент-разработчик с `AGENTS.md` и игровой CLI-рассказчик из `src/lib/harness/`
  имеют разные контексты и полномочия. Не передавать инструкции разработчика в игру.

## Как найти проверку

Тесты upstream — исполняемые `scripts/test-*.mjs`; Vitest запускает их по
`vitest.config.mts`. Фильтр должен действительно выбрать тесты.

| Изменение | Пример целевой проверки после установки зависимостей |
| --- | --- |
| Язык рассказа / морфология | `npm test -- scripts/test-table-language.mjs scripts/test-table-language-calls.mjs scripts/test-language.mjs` |
| Контекст и память | `npm test -- scripts/test-context-budget.mjs scripts/test-context-probe.mjs scripts/test-prompt-window.mjs` |
| Доступ и события | `npm test -- scripts/test-delivery.mjs scripts/test-event-audience.mjs scripts/test-table-privacy.mjs` |
| Озвучивание | `npm test -- scripts/test-tts-backend.mjs scripts/test-tts-render.mjs scripts/test-tts-segments.mjs` |
| UI | После `npm run build`: `node scripts/browser/run.mjs --only 32-builder-a11y --viewports desktop,phone` |

Browser harness требует Chromium и создает тестовую БД; параметры описаны в
начале `scripts/browser/run.mjs`. Новые тесты размещать рядом с существующими
по предмету проверки, а не создавать дублирующий каталог тестов для форка.
