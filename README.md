# timberstore.ru — сайт Строительного торгового дома

Статический сайт на HTML/CSS/JS для хостинга Beget.
Структура и палитра — timberstore.ru (#6A7C5C / #454545 / #ffbc2e), каталог товаров — данные kubometr-store.ru.

## Состав

- **43 карточки товаров** в 5 категориях: Пиломатериалы, Кровля, Металлопрокат, Утеплитель и изоляция, Древесные листовые материалы
- **Генератор лидов**: квиз с подбором материалов, форма обратного звонка, быстрый заказ с карточки товара, корзина с оформлением заказа (все заявки → e-mail + CSV-бэкап)
- **SEO**: мета-теги, canonical, Open Graph, Schema.org (LocalBusiness, Product, BreadcrumbList, CollectionPage), sitemap.xml, robots.txt, семантическая разметка, быстрые страницы
- **152-ФЗ**: политика конфиденциальности, согласие на обработку ПД, чекбоксы согласия на всех формах, cookie-уведомление

## Структура файлов

```
public_html/ (или public/)
├── index.html                  — главная
├── catalog/                    — каталог с фильтрами
├── category/<slug>/            — 5 страниц категорий
├── product/<slug>/             — 43 карточки товаров
├── dostavka-i-oplata/          — доставка и оплата
├── novosti/                    — новости
├── kontakty/                   — контакты + карта
├── politika-konfidencialnosti/ — политика (152-ФЗ)
├── soglasie-na-obrabotku-.../  — согласие на обработку ПД
├── cart/                       — корзина (+ /cart/spasibo/)
├── 404.html
├── sitemap.xml
├── robots.txt
├── .htaccess                   — HTTPS-редирект, кэш, deflate
├── mail/send.php               — обработчик лид-форм (PHP mail, Beget)
└── assets/
    ├── css/style.css
    ├── js/app.js
    └── img/ (товары, hero, favicon)
```

## Деплой на Beget

1. Скачайте ZIP-архив релиза.
2. Распакуйте **содержимое** архива в папку сайта: `~/public_html/` (или назначенная папка `public`).
3. Каждый новый архив заменяет прежние файлы: удалите старое содержимое папки и распакуйте новый архив, либо распаковывайте с перезаписью.
4. PHP-обработчик форм работает сразу (`mail/send.php`), ничего дополнительно настраивать не нужно. Заявки приходят на **timberstore.ru@gmail.com**, дублируются в `mail/.leads/leads-ГГГГ-ММ.csv` (папка закрыта .htaccess).

## Обновление цен и товаров

Товары лежат статикой — правки вносятся в соответствующие `product/<slug>/index.html` (блок «Варианты и цены»). Либо сгенерируйте сайт заново из данных-источника.

## GitHub

Клонировать:
```bash
git clone https://github.com/zvbnz88-creator/timberstore.ru.git
```

Забрать изменения на сервере:
```bash
cd ~/timberstore.ru && git pull
```

### Где взять Personal Access Token (PAT)

GitHub → аватар → **Settings** → в левом меню внизу **Developer settings** → **Personal access tokens** → **Fine-grained tokens** (или Tokens classic) → **Generate new token**. Укажите срок действия и права: `Contents: Read and write` (для classic — scope `repo`). Токен показывается один раз — сохраните его.

Push с токеном:
```bash
git remote set-url origin https://<ИМЯ_ПОЛЬЗОВАТЕЛЯ>:<ТОКЕН>@github.com/zvbnz88-creator/timberstore.ru.git
git push origin main
```

## Контакты

ИП Фалин Константин Анатольевич · ИНН 780732413743 · ОГРНИП 320784700201735
Санкт-Петербург, пр. Юрия Гагарина, д. 32, корпус 2, офис №7
+7 999 203-14-61 · timberstore.ru@gmail.com
