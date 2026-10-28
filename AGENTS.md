# Dungeon Master — инструкции для агентов

Цель форка Open Game Master: живой голосовой D&D-мастер на русском для компании с телевизором и телефонами.
Исходный движок уже существует; развиваем его небольшими проверяемыми изменениями.
Обсуждения и новая документация — на русском; имена API, схем и игровых ID сохраняем.

## Выбирай контекст по задаче

Не читай всю документацию на старте. Открой нужную строку таблицы и соответствующий код.
Перед изменением каталога найди и прочитай вложенные `AGENTS.md` по его пути:
не каждый клиент автоматически загружает их при работе из корня.

| Задача | Точка входа |
| --- | --- |
| Найти код, границы подсистем | [Карта архитектуры](docs/fork/architecture.md) |
| Уточнить цель, выбрать следующую задачу | [Продукт](docs/fork/product.md), [план](docs/fork/roadmap.md) |
| Поведение мастера, голос и правила стола | [Требования](docs/fork/requirements.md) |
| Запуск, проверки, передача работы | [Разработка](docs/fork/development.md) |
| Обновить форк из оригинала | [Upstream](docs/fork/upstream.md) |
| Поменять организацию проекта | [Решение 0001](docs/fork/decisions/0001-repository-structure.md) |

## Инварианты

- Сервер владеет бросками, HP, ресурсами и правами доступа; LLM предлагает действия через проверяемые tools.
- Игроки упрощают игру отключением механик; новые механики и формулы вне объёма. Мастер предупреждает о рисках, выбор остаётся за группой (R8).
- Политику upstream возврата к исходному сюжету пока сохраняем; смена главной ветки отложена (R5).
- Русский текст — слой представления. Не переводи ключи JSON, tool names и канонические идентификаторы.
- Сохраняй совместимость кампаний и миграций, границу server/client и изоляцию секретов мастера от игроков.
- Сохраняй структуру upstream; переноси модули только для конкретной задачи с проверкой импортов.
- Не коммить ключи, `.env` с секретами, базы кампаний, логи диалогов и скачанные модели.
- Новое поведение сопровождай подходящей проверкой; фиксируй реальные результаты и непроверенные части.

## Команды

- Документация и навигация без установки пакетов: `node scripts/check-agent-context.mjs` и `git diff --check`.
- Зависимости: `npm ci`; на PowerShell при ограничениях execution policy используй `npm.cmd`.
- Точечный тест: `npm test -- scripts/test-language.mjs` (подставь файл своей подсистемы).
- Изменения приложения: `npm run lint`, `npx tsc --noEmit`, подходящие тесты; сборка при изменении интеграции.
- Условия полного набора тестов и запуска: [development.md](docs/fork/development.md).

## Унаследованные правила по области

- Новый UI control: [правила интерфейса](docs/fork/ui-controls.md).
- Арт токенов: [читаемость](docs/art/token-readability.md); существа и image prompts: [источники и анатомия](docs/art/creature-art-guidance.md).
- `src/lib/addons/`, addon routes, board bridge: [framework](docs/addons/framework.md); после изменения manifest schema — `node scripts/build-addon-schema.mjs`.
- Релизы: [releases](docs/releases.md) и [особенности форка](docs/fork/upstream.md); публикация и promotion — только в рамках запроса владельца.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
