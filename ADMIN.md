# Админка меню «Самарканд»

Сайт — статичные файлы на Netlify. Меню, стоп-лист и фото хранятся в Supabase.
Админка открывается по адресу `/admin`. Сайт читает меню из Supabase при каждой загрузке;
если Supabase недоступен, показывает встроенное меню из `assets/menu.js`.

## Роли

- **Владелец** — всё: блюда, цены, фото, названия на трёх языках, метки, категории, стоп-лист.
- **Сотрудник** — только стоп-лист («в наличии / нет»). Ограничение работает в самой базе (RLS + триггер),
  а не только в интерфейсе.

## Первый запуск (один раз)

1. **Supabase → SQL Editor → New query**: вставить `supabase/schema.sql`, нажать Run.
   Затем так же `supabase/seed.sql` — это текущее меню, 63 позиции.
2. **Supabase → Authentication → Users → Add user → Create new user**: почта и пароль владельца,
   включить *Auto Confirm User*.
3. **SQL Editor** — дать этому пользователю роль владельца (подставить почту):
   ```sql
   insert into public.admins (user_id, role)
   select id, 'owner' from auth.users where email = 'owner@example.com';
   ```
   Сотрудник добавляется так же, с ролью `'staff'`.
4. **Netlify → Site configuration → Environment variables → Add a variable**:
   - `SUPABASE_URL` — Supabase → Project Settings → API → Project URL
   - `SUPABASE_ANON_KEY` — там же, ключ **Publishable** (`sb_publishable_…`). Secret key (`sb_secret_…`) и service_role никуда не вставлять
   - `GOOGLE_MAPS_KEY` — браузерный ключ Google, ограниченный доменом сайта
5. **Netlify → Deploys → Trigger deploy → Deploy site**, чтобы переменные подхватились.
6. Открыть `https://<домен>/admin`, войти почтой владельца.

## Как это устроено

| Файл | Что делает |
| --- | --- |
| `netlify/functions/config.js` | Функция Netlify. Отдаёт `/assets/config.js` с адресом Supabase и ключами из переменных окружения |
| `netlify.toml` | Публикует корень репозитория без сборки, направляет `/assets/config.js` на функцию, закрывает `/admin` от поисковиков |
| `index.html` | Сайт. Загружает меню из Supabase (`categories`, `dishes`), скрывает блюда с `visible = false`, помечает `available = false` как «Сегодня нет» |
| `admin/` | Админка. Работает напрямую с Supabase через supabase-js |
| `supabase/schema.sql` | Таблицы, права доступа (RLS), хранилище фото `dishes` |
| `supabase/seed.sql` | Текущее меню. Повторный запуск обновит названия и цены до исходных |
| `assets/config.js` | Только для локального запуска, в git не попадает (см. `assets/config.example.js`) |

Фото из админки сжимаются в браузере до 1000 px (WebP) и попадают в Supabase Storage, бакет `dishes`.
Блюда с меткой «Хит» и фото попадают в блок «Начните с этого» (до 5 штук).
