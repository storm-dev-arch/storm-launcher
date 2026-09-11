<div align="center">

# ⚡ Storm Launcher

### *Next-Generation Black Glassmorphism Game Launcher & Library Manager for Windows*

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/storm-dev-arch/storm-launcher)
[![Electron](https://img.shields.io/badge/Electron-34-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: Custom](https://img.shields.io/badge/License-Source--Available%20%2F%20Non--Commercial-F59E0B?style=for-the-badge)](LICENSE)

<br/>

**[🇷🇺 Читать на русском](#-storm-launcher-ru)** &nbsp;|&nbsp; **[🇬🇧 Read in English](#-storm-launcher-en)**

</div>

---

<a name="-storm-launcher-ru"></a>
## 🇷🇺 STORM LAUNCHER (RU)

<div align="center">
  <img src="public/icon.png" width="105" alt="Storm Launcher Icon" />
  <p><strong>Современный игровой лаунчер и менеджер библиотеки для Windows в эстетике Black Glassmorphism.</strong></p>
</div>

**Storm Launcher** — это быстрый локальный десктопный игровой центр для Windows, созданный без компромиссов. Он автоматически объединяет игры из **Steam, Epic Games Store, GOG Galaxy и сторонние репаки/портативные версии** в единую стильную экосистему, считывает достижения и скриншоты, транслирует активность в **Discord RPC**, поддерживает поиск обложек в 1 клик через **SteamGridDB** и дарит непревзойденный тактильный звуковой отклик интерфейса.

### 🎯 Философия дизайна
- **Никакого аляпистого RGB и кислотного неона**: строгая благородная палитра обсидиана и глубокого графита (`#030306` – `#0F0F14`).
- **Честный Black Glassmorphism**: полупрозрачные акриловые панели с аппаратным размытием `backdrop-filter: blur(24px)` и тонкими контрастными гранями.
- **Плавность 60 FPS**: оптимизированные переходы и легкие микровзаимодействия без перегрузки процессора и видеокарты.
- **Локальная автономность**: все данные хранятся локально на вашем ПК в `%APPDATA%\storm-play\StormPlay\database\games.json`.

---

### ✨ Ключевые возможности

#### 🎮 1. Мульти-лаунчер автопоиск (Steam, Epic Games, GOG Galaxy)
- **Steam**: сканирование всех библиотек на всех дисках через `libraryfolders.vdf`, парсинг манифестов `appmanifest_*.acf`, вычисление наигранного времени из `localconfig.vdf`.
- **Epic Games Store**: автоматический парсинг манифестов `%ProgramData%\Epic\EpicGamesLauncher\Data\Manifests\*.item` с запуском через протокол `com.epicgames.launcher://apps/...`.
- **GOG Galaxy**: считывание метаданных через реестр Windows (`SOFTWARE\GOG.com\Games`) и конфигурационные файлы `goggame-*.info`.
- Единый список с бейджами источников в сайдбаре и фильтрацией в каталоге.

#### 🔍 2. Глубокий умный сканер дисков (Smart Repack/Portable Finder)
- Сканирование всех подключенных физических накопителей (C:, D:, E:, внешние SSD) в 1 клик.
- Эвристическое обнаружение установленных игр по маркерам (`steam_api64.dll`, игровым движкам Unreal / Unity / Godot / CryEngine и размеру директории > 400 МБ).
- Автоматическая фильтрация установщиков, деинсталляторов, драйверов DirectX/vcredist и служебных утилит.

#### 💬 3. Discord Rich Presence (Discord RPC)
- Нативная интеграция через сокет локального IPC пайпа Discord (`\\?\pipe\discord-ipc-0`) без тяжелых внешних модулей.
- Отображение статуса в Discord:
  - **В игре**: название тайтла, крупный арт лаунчера, таймер текущей сессии («В игре 00:45»).
  - **В лаунчере**: статус «Выбирает во что поиграть» с общим числом игр в библиотеке.
- Включение / выключение в настройках в один клик.

#### 🖼️ 4. SteamGridDB: Поиск обложек и постеров в 1 клик
- Встроенный менеджер артов: постеры (600×900), горизонтальные баннеры (Hero) и логотипы.
- Поиск по официальному API SteamGridDB (при наличии ключа) с автоматическим фоллбэком на ультра-четкие арты Steam CDN.
- Локальное кэширование загруженных изображений и мгновенное применение к карточке игры.

#### 🏆 5. Достижения Steam (Steam Achievements)
- Загрузка полного списка достижений Steam на детальной странице игры.
- Интерактивная шкала прогресса выполнения ачивок и процент разблокировки.
- Отображение иконок, названий и описаний полученных и заблокированных наград.

#### 📸 6. Галерея скриншотов Steam с Lightbox
- Автоматическое считывание локальных скриншотов из кэша Steam (`userdata/<userId>/760/remote/<appId>/screenshots/`).
- Встроенный полноэкранный просмотрщик (Lightbox) в высоком разрешении.
- Кнопка быстрого перехода к исходной папке со снимками в Проводнике Windows.

#### 🔊 7. Тактильный звуковой дизайн (Web Audio API)
- Нативная аудио-система на базе синтеза частот Web Audio API с нулевой задержкой и без внешних звуковых файлов.
- Приятные мягкие клики, переключение вкладок, всплывающие эффекты и фирменный торжественный звуковой аккорд при запуске игры.
- Ползунок громкости и тумблер полного отключения звуков в настройках.

#### 🌌 8. Процедурный бархатный шейдер фона (Ambient Aurora)
- Процедурная симуляция движущихся световых орбов на Canvas 2D в реальном времени.
- Мягкое глубинное свечение (блюр 64px, комфортная яркость 0.35–0.40), дышащее под слоями темного стекла.
- Адаптивные палитры под каждую тему: **Obsidian**, **OLED**, **Crimson**, **Emerald**, **Royal Purple**, **Midnight**, **Graphite**.

#### 🌐 9. Полная поддержка двух языков (RU / EN)
- Мгновенное переключение языка в один клик.
- **Оптическая анимация текста**: при смене языка абсолютно весь видимый текст на экране плавно анимируется через оптический кросс-фейд (`blur(2px) → 0`, `opacity 0.15 → 1`).

#### ⌨️ 10. Управление с клавиатуры и Мини-Режим
- **Командная строка (`Ctrl + K`)**: быстрый поиск по всей библиотеке и мгновенная навигация по разделам.
- **Компактный мини-виджет (`Ctrl + Space`)**: плавающий компактный виджет для быстрого запуска игр.
- **«Во что поиграть?»**: интерактивный генератор случайного выбора с фильтрами по избранным и установленным играм.

---

### 🛠️ Архитектура и стек технологий

```
Storm Launcher/
├── src/
│   ├── main/                    # Ядро Electron (Node.js)
│   │   ├── main.ts              # Управление окнами и IPC
│   │   ├── discordRPC.ts        # Нативный сокет-клиент Discord RPC
│   │   ├── multiLauncherScanner.ts # Сканер Epic Games, GOG, Ubisoft
│   │   ├── deepDiskScanner.ts   # Эвристический сканер всех накопителей
│   │   ├── steamScanner.ts      # Парсер библиотек Steam VDF
│   │   ├── steamGridDB.ts       # Загрузчик постеров SteamGridDB / CDN
│   │   ├── achievementEngine.ts # Менеджер достижений Steam
│   │   ├── screenshotManager.ts # Парсер скриншотов Steam
│   │   ├── gameLauncher.ts      # Запуск, отслеживание PID и сессий
│   │   ├── shortcuts.ts         # Создание ярлыков на Рабочем столе
│   │   └── db.ts                # Локальная база данных (%APPDATA%)
│   ├── preload/                 # Изолированный IPC-мост
│   │   └── preload.ts           # Типизированное API window.stormPlay
│   ├── shared/                  # Общие TypeScript-типы
│   │   └── types.ts             # Интерфейсы Game, Settings, Achievements, etc.
│   └── renderer/                # Интерфейс React 18
│       ├── App.tsx              # Корневой контроллер приложения
│       ├── audio/               # Синтезатор звуков Web Audio API
│       ├── components/          # Стеклянные компоненты и модальные окна
│       ├── pages/               # Страницы (Overview, Library, Details, Stats, Settings)
│       ├── i18n/                # Словари переводов (RU / EN)
│       └── styles/              # Дизайн-система Black Glassmorphism
```

---

### 💻 Установка и запуск

#### Предварительные требования:
- Windows 10 или 11 (64-bit)
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

```bash
# Клонировать репозиторий
git clone https://github.com/storm-dev-arch/storm-launcher.git
cd storm-launcher

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev
```

#### Сборка исполняемых файлов (.exe):
```bash
npm run build:win
```
Готовые файлы создаются в папке `release/`:
- `Storm-Launcher-Portable.exe` (портативная версия без установки)
- `Storm-Launcher-Setup.exe` (Windows-установщик)

<br/>
<br/>

---

<a name="-storm-launcher-en"></a>
## 🇬🇧 STORM LAUNCHER (EN)

<div align="center">
  <img src="public/icon.png" width="105" alt="Storm Launcher Icon" />
  <p><strong>Next-Generation Black Glassmorphism Game Launcher & Library Manager for Windows.</strong></p>
</div>

**Storm Launcher** is an ultra-fast, local-first Windows game hub built without compromises. It unifies games from **Steam, Epic Games Store, GOG Galaxy, and standalone repacks/portable installations** into a single cohesive ecosystem, tracks achievements and screenshots, syncs game presence to **Discord RPC**, fetches 1-click box art from **SteamGridDB**, and provides tactile sound design.

### 🎯 Design Philosophy
- **Zero RGB Neon Clutter**: Curated palette of obsidian, carbon, and brushed graphite (`#030306` to `#0F0F14`).
- **Pure Black Glassmorphism**: Translucent acrylic surfaces with hardware-accelerated `backdrop-filter: blur(24px)` and subtle highlights.
- **Fluid 60 FPS Typography & Motion**: Ultra-smooth micro-interactions without high CPU or GPU consumption.
- **Local-First Autonomy**: All data is saved on your PC under `%APPDATA%\storm-play\StormPlay\database\games.json`.

---

### ✨ Features Breakdown

#### 🎮 1. Multi-Launcher Auto-Detection (Steam, Epic, GOG)
- **Steam**: Multi-drive library auto-discovery via `libraryfolders.vdf`, `appmanifest_*.acf` parsing, authentic playtime from `localconfig.vdf`.
- **Epic Games Store**: Manifest reader for `%ProgramData%\Epic\EpicGamesLauncher\Data\Manifests\*.item` with `com.epicgames.launcher://` protocol launches.
- **GOG Galaxy**: Windows Registry scanning (`SOFTWARE\GOG.com\Games`) and `goggame-*.info` metadata integration.
- Dedicated source filter tabs and badges in the sidebar and catalog.

#### 🔍 2. Deep Multi-Drive Game Scanner (Smart Repack/Portable Finder)
- 1-Click recursive scan across all physical drives and partitions (C:, D:, E:, external SSDs).
- Heuristic game discovery using engine markers (`steam_api64.dll`, Unreal / Unity / Godot / CryEngine binaries, folder size > 400 MB).
- Automatic rejection of installers, crash reporters, redistributables, and diagnostic tools.

#### 💬 3. Discord Rich Presence (Discord RPC)
- Native IPC socket client (`\\?\pipe\discord-ipc-0`) communicating directly with Discord without third-party dependencies.
- Displays rich player status:
  - **In Game**: Title name, launcher key art, session elapsed timer ("Playing for 00:45").
  - **In Launcher**: "Choosing what to play" with total library title count.
- One-click toggle in Settings.

#### 🖼️ 4. SteamGridDB 1-Click Artwork Picker
- In-app artwork search modal for covers (600×900), wide hero banners, and logos.
- Official SteamGridDB API integration with automatic fallback to high-res Steam CDN assets.
- Instant local caching and artwork application.

#### 🏆 5. Steam Achievements Showcase
- Complete Steam achievements showcase directly on the game details page.
- Progress bar and unlocked percentage tracking.
- Icons, titles, and descriptions for both unlocked and locked milestones.

#### 📸 6. Local Steam Screenshot Gallery & Lightbox
- Reads local Steam captures from `userdata/<userId>/760/remote/<appId>/screenshots/`.
- Full-screen high-res Lightbox modal viewer.
- Shortcut to reveal the screenshot folder in Windows File Explorer.

#### 🔊 7. Tactile UI Audio Sound Design (Web Audio API)
- Ultra-responsive, zero-latency Web Audio API synthesizer (no external audio files required).
- Subtle tactile clicks, pop sounds, navigation tabs, and a signature game launch chime.
- Master volume slider and audio mute toggle in Settings.

#### 🌌 8. Procedural Ambient Aurora Shader
- Real-time procedural Canvas 2D fluid simulation running in the background.
- Soft, atmospheric glow (`blur(64px)`, comfortable alpha 0.35–0.40) breathing behind dark translucent glass.
- Adaptive palettes: **Obsidian**, **OLED**, **Crimson**, **Emerald**, **Royal Purple**, **Midnight**, **Graphite**.

#### 🌐 9. Full Dual-Language Support (RU / EN)
- Instant one-click language toggle.
- **Fluid Typography Transition**: Optical cross-fade (`blur(2px) → 0`, `opacity 0.15 → 1`) animating all text in unison.

#### ⌨️ 10. Keyboard-First Navigation & Mini Mode
- **Command Palette (`Ctrl + K`)**: Instantly search games, jump between views, and trigger quick actions.
- **Mini Mode Widget (`Ctrl + Space`)**: Floating quick-launch widget.
- **"What Should I Play?" Picker**: Intelligent random selector with filters.

---

### 💻 Getting Started

#### Prerequisites:
- Windows 10 or 11 (64-bit)
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

```bash
# Clone the repository
git clone https://github.com/storm-dev-arch/storm-launcher.git
cd storm-launcher

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Packaging Windows Binaries:
```bash
npm run build:win
```
The output files will be created in the `release/` folder:
- `Storm-Launcher-Portable.exe` (Standalone portable executable)
- `Storm-Launcher-Setup.exe` (Full Windows installer)

---

## 📜 License

This project is governed by the **STORM SOURCE-AVAILABLE & NON-COMMERCIAL LICENSE** — see the full text in the [LICENSE](LICENSE) file.

- **Non-Commercial Use**: Free for personal, inspection, security auditing, and educational use.
- **No Theft / Rebranding**: Rebranding, claiming authorship, or commercial redistribution without prior written consent from the author is strictly prohibited.

Developed with passion by [Storm (storm-dev-arch)](https://github.com/storm-dev-arch).
