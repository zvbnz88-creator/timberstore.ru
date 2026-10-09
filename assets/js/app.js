/* Строительный торговый дом — timberstore.ru
   Лид-генератор: обратный звонок, быстрый заказ, квиз, корзина.
   Все формы отправляются на /mail/send.php (Beget, PHP mail). */
'use strict';

var TSD = {
  phone: '+7 999 203-14-61',
  email: 'timberstore.ru@gmail.com'
};

/* ================= Cookie ================= */
function initCookie() {
  var banner = document.getElementById('cookieBanner');
  if (!banner) return;
  if (!localStorage.getItem('tsd_cookie_ok')) {
    setTimeout(function () { banner.classList.add('is-open'); }, 900);
  }
  var btn = document.getElementById('cookieOk');
  if (btn) btn.addEventListener('click', function () {
    localStorage.setItem('tsd_cookie_ok', '1');
    banner.classList.remove('is-open');
  });
}

/* ================= Мобильное меню ================= */
function initNav() {
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('is-open');
      burger.classList.toggle('is-active');
    });
  }
  document.querySelectorAll('.nav__list > li.has-sub > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.innerWidth <= 680) {
        var li = a.parentElement;
        if (li.classList.contains('has-sub') && !li.dataset.navLinked) {
          e.preventDefault();
          li.classList.toggle('is-open');
        }
      }
    });
  });
}

/* ================= Модалки ================= */
function openModal(id) {
  var m = document.getElementById(id);
  if (m) {
    m.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(m) {
  m.classList.remove('is-open');
  document.body.style.overflow = '';
}
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var id = btn.getAttribute('data-modal-open');
      var product = btn.getAttribute('data-product') || '';
      var price = btn.getAttribute('data-price') || '';
      var input = document.querySelector('#' + id + ' [name="product"]');
      if (input) input.value = product + (price ? ' — ' + price : '');
      var hidden = document.querySelector('#' + id + ' [name="product_hidden"]');
      if (hidden) hidden.value = product;
      openModal(id);
    });
  });
  document.querySelectorAll('.modal').forEach(function (m) {
    m.querySelector('.modal__overlay') && m.querySelector('.modal__overlay').addEventListener('click', function () { closeModal(m); });
    m.querySelector('.modal__close') && m.querySelector('.modal__close').addEventListener('click', function () { closeModal(m); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.modal.is-open').forEach(closeModal);
  });
}

/* ================= Отправка форм ================= */
function sendForm(form, onOk) {
  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type="submit"]');
  var data = new FormData(form);
  data.append('page', location.pathname);

  // honeypot
  if (data.get('website')) { return; }
  // consent
  var consent = form.querySelector('input[name="consent"]');
  if (consent && !consent.checked) {
    if (status) { status.className = 'form-status err'; status.textContent = 'Требуется согласие на обработку персональных данных.'; }
    return;
  }
  var phone = (data.get('phone') || '').trim();
  if (phone.replace(/\D/g, '').length < 10) {
    if (status) { status.className = 'form-status err'; status.textContent = 'Укажите корректный номер телефона.'; }
    return;
  }

  if (btn) { btn.disabled = true; btn.dataset.txt = btn.textContent; btn.textContent = 'Отправляем…'; }

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/mail/send.php', true);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onload = function () {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.txt; }
    var ok = false, msg = 'Не удалось отправить. Позвоните нам: ' + TSD.phone;
    try {
      var res = JSON.parse(xhr.responseText);
      ok = !!res.ok;
      if (res.message) msg = res.message;
    } catch (e) { ok = xhr.status === 200; }
    if (ok) {
      if (status) { status.className = 'form-status ok'; status.textContent = msg; }
      form.reset();
      if (onOk) onOk();
      else setTimeout(function () {
        var mm = form.closest('.modal');
        if (mm) { closeModal(mm); if (status) { status.className = 'form-status'; status.textContent = ''; } }
      }, 2600);
      if (typeof ym !== 'undefined') { try { ym(0, 'reachGoal', 'lead'); } catch (e) {} }
    } else {
      if (status) { status.className = 'form-status err'; status.textContent = msg; }
    }
  };
  xhr.onerror = function () {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.txt; }
    if (status) { status.className = 'form-status err'; status.textContent = 'Ошибка соединения. Позвоните нам: ' + TSD.phone; }
  };
  xhr.send(data);
}
function initForms() {
  document.querySelectorAll('form[data-lead]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      sendForm(f);
    });
  });
}

/* ================= Квиз (лид-генератор) ================= */
var QUIZ_STEPS = [
  {
    q: 'Какой объект вы строите или ремонтируете?',
    opts: ['Дом / дача', 'Баня', 'Гараж / хозблок', 'Кровля / крыша', 'Ограждение / забор', 'Внутренняя отделка']
  },
  {
    q: 'На каком этапе работы?',
    opts: ['Только планирую', 'Фундамент / каркас', 'Кровельные работы', 'Утепление', 'Отделка', 'Другое']
  },
  {
    q: 'Как удобнее получить расчёт?',
    opts: ['Звонок', 'WhatsApp / Telegram', 'E-mail']
  }
];
var quizState = { step: 0, answers: [] };
function renderQuizStep() {
  var box = document.getElementById('quizBody');
  var bar = document.getElementById('quizBar');
  if (!box) return;
  if (bar) bar.style.width = (quizState.step / QUIZ_STEPS.length * 100) + '%';

  if (quizState.step < QUIZ_STEPS.length) {
    var st = QUIZ_STEPS[quizState.step];
    var html = '<div class="quiz__step-n">Шаг ' + (quizState.step + 1) + ' из ' + (QUIZ_STEPS.length + 1) + '</div>'
      + '<h3>' + st.q + '</h3><div class="quiz__opts">';
    st.opts.forEach(function (o) {
      var sel = quizState.answers[quizState.step] === o ? ' is-active' : '';
      html += '<div class="quiz-opt' + sel + '" data-val="' + o + '">' + o + '</div>';
    });
    html += '</div><div class="quiz-nav">'
      + (quizState.step > 0 ? '<button type="button" class="btn btn--outline" id="quizPrev">Назад</button>' : '<span></span>')
      + '<button type="button" class="btn" id="quizNext" ' + (quizState.answers[quizState.step] ? '' : 'disabled') + '>Далее</button>'
      + '</div>';
    box.innerHTML = html;

    box.querySelectorAll('.quiz-opt').forEach(function (el) {
      el.addEventListener('click', function () {
        quizState.answers[quizState.step] = el.dataset.val;
        box.querySelectorAll('.quiz-opt').forEach(function (x) { x.classList.remove('is-active'); });
        el.classList.add('is-active');
        var nb = document.getElementById('quizNext'); if (nb) nb.disabled = false;
      });
    });
    var nx = document.getElementById('quizNext');
    nx && nx.addEventListener('click', function () { quizState.step++; renderQuizStep(); });
    var pv = document.getElementById('quizPrev');
    pv && pv.addEventListener('click', function () { quizState.step--; renderQuizStep(); });
  } else {
    var chosen = quizState.answers.slice(0, QUIZ_STEPS.length).join(' → ');
    box.innerHTML = '<div class="quiz__discount">🎁 Оставьте контакты — сохраним скидку 3% на первый заказ</div>'
      + '<form class="modal__form" data-lead id="quizFinal">'
      + '<input type="hidden" name="form_type" value="quiz">'
      + '<input type="hidden" name="quiz_answers" value="' + chosen.replace(/"/g, '&quot;') + '">'
      + '<div class="field"><label for="qzName">Ваше имя</label><input id="qzName" name="name" type="text" placeholder="Как к вам обращаться?" required></div>'
      + '<div class="field"><label for="qzPhone">Телефон</label><input id="qzPhone" name="phone" type="tel" placeholder="+7 (___) ___-__-__" required></div>'
      + '<div class="field"><label for="qzList">Ваш выбор</label><textarea name="comment" rows="2" readonly>' + chosen + '</textarea></div>'
      + '<div class="field"><label class="consent"><input type="checkbox" name="consent" required><span>Соглашаюсь с <a href="/soglasie-na-obrabotku-personalnyh-dannyh/" target="_blank">политикой обработки персональных данных</a></span></label></div>'
      + '<button type="submit" class="btn btn--yellow btn--block">Получить расчёт со скидкой 3%</button>'
      + '<div class="form-status"></div>'
      + '</form>';
    var qf = document.getElementById('quizFinal');
    qf.addEventListener('submit', function (e) {
      e.preventDefault();
      sendForm(qf, function () {
        quizState = { step: 0, answers: [] };
        setTimeout(renderQuizStep, 3200);
      });
    });
  }
}

/* ================= Корзина ================= */
var CART_KEY = 'tsd_cart_v1';
function cartGet() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}
function cartSave(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  cartUpdateBadge();
}
function cartAdd(item) {
  var items = cartGet();
  var found = null;
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === item.id && items[i].variant === item.variant) { found = items[i]; break; }
  }
  if (found) { found.qty += item.qty; }
  else { items.push(item); }
  cartSave(items);
}
function cartUpdateBadge() {
  var n = 0;
  cartGet().forEach(function (i) { n += i.qty; });
  document.querySelectorAll('.js-cart-count').forEach(function (el) { el.textContent = n; });
}
function fmtPrice(v) {
  return Number(v).toLocaleString('ru-RU') + ' ₽';
}
function initAddToCart() {
  document.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var item = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        url: btn.dataset.url || '',
        price: parseFloat(btn.dataset.price) || 0,
        unit: btn.dataset.unit || 'шт',
        variant: btn.dataset.variant || '',
        img: btn.dataset.img || '',
        qty: 1
      };
      cartAdd(item);
      var old = btn.textContent;
      btn.textContent = 'Добавлено ✓';
      setTimeout(function () { btn.textContent = old; }, 1400);
    });
  });
}

/* Корзина: страница /cart/ */
function renderCartPage() {
  var wrap = document.getElementById('cartPage');
  if (!wrap) return;
  var items = cartGet();
  if (!items.length) {
    wrap.innerHTML = '<div class="cart-empty">'
      + '<svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>'
      + '<h2>Корзина пуста</h2><p>Добавьте товары из каталога, чтобы оформить заказ.</p>'
      + '<a href="/catalog/" class="btn">Перейти в каталог</a></div>';
    return;
  }
  var total = 0, rows = '';
  items.forEach(function (it, idx) {
    var sum = it.price * it.qty;
    total += sum;
    rows += '<tr>'
      + '<td><a href="' + it.url + '"><img class="cart-item-img" src="' + it.img + '" alt="' + it.name + '"></a></td>'
      + '<td><div class="ct-name"><a href="' + it.url + '">' + it.name + '</a></div>'
      + (it.variant ? '<div class="ct-variant">' + it.variant + '</div>' : '') + '</td>'
      + '<td>' + (it.price ? fmtPrice(it.price) + ' / ' + it.unit : 'по запросу') + '</td>'
      + '<td><div class="qty"><button type="button" data-qty="-1" data-idx="' + idx + '">−</button>'
      + '<input type="text" value="' + it.qty + '" data-qty-input data-idx="' + idx + '" inputmode="numeric">'
      + '<button type="button" data-qty="1" data-idx="' + idx + '">+</button></div></td>'
      + '<td class="ct-sum">' + (it.price ? fmtPrice(sum) : 'по запросу') + '</td>'
      + '<td><button type="button" class="cart-remove" data-remove="' + idx + '" title="Удалить">×</button></td>'
      + '</tr>';
  });
  wrap.innerHTML = '<div class="cart-layout">'
    + '<div><table class="cart-table"><thead><tr><th></th><th>Товар</th><th>Цена</th><th>Кол-во</th><th>Сумма</th><th></th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>'
    + '<div class="cart-summary"><h3>Оформление заказа</h3>'
    + '<div class="cart-summary__row"><span>Позиций:</span><span>' + items.length + '</span></div>'
    + '<div class="cart-summary__total"><span>Итого:</span><span id="cartTotal">' + fmtPrice(total) + '</span></div>'
    + '<form class="modal__form" style="margin-top:16px" data-lead id="cartOrderForm">'
    + '<input type="hidden" name="form_type" value="order">'
    + '<input type="hidden" name="order_items" id="orderItemsInput">'
    + '<div class="field"><label for="coName">Ваше имя *</label><input id="coName" name="name" type="text" required placeholder="Иван"></div>'
    + '<div class="field"><label for="coPhone">Телефон *</label><input id="coPhone" name="phone" type="tel" required placeholder="+7 (___) ___-__-__"></div>'
    + '<div class="field"><label for="coEmail">E-mail</label><input id="coEmail" name="email" type="email" placeholder="ivan@mail.ru"></div>'
    + '<div class="field"><label for="coComment">Комментарий к заказу</label><textarea id="coComment" name="comment" rows="2" placeholder="Адрес доставки, пожелания…"></textarea></div>'
    + '<div class="field"><label class="consent"><input type="checkbox" name="consent" required><span>Соглашаюсь с <a href="/soglasie-na-obrabotku-personalnyh-dannyh/" target="_blank">политикой обработки персональных данных</a> и даю <a href="/soglasie-na-obrabotku-personalnyh-dannyh/" target="_blank">согласие на обработку ПД</a></span></label></div>'
    + '<button type="submit" class="btn btn--yellow btn--block">Оформить заказ</button>'
    + '<p class="note" style="font-size:12.5px;color:#777">Менеджер перезвонит в течение 15 минут в рабочее время, уточнит наличие и рассчитает доставку.</p>'
    + '<div class="form-status"></div>'
    + '</form></div></div>';

  var itemsInput = document.getElementById('orderItemsInput');
  var list = items.map(function (i) {
    return i.name + (i.variant ? ' (' + i.variant + ')' : '') + ' × ' + i.qty + ' ' + i.unit + (i.price ? ' — ' + fmtPrice(i.price * i.qty) : ' — по запросу');
  });
  itemsInput.value = list.join('; ');

  wrap.querySelectorAll('[data-qty]').forEach(function (b) {
    b.addEventListener('click', function () {
      var idx = parseInt(b.dataset.idx, 10);
      items = cartGet();
      items[idx].qty = Math.max(1, items[idx].qty + parseInt(b.dataset.qty, 10));
      cartSave(items); renderCartPage();
    });
  });
  wrap.querySelectorAll('[data-qty-input]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var idx = parseInt(inp.dataset.idx, 10);
      var v = parseInt(inp.value.replace(/\D/g, ''), 10);
      items = cartGet();
      items[idx].qty = isNaN(v) ? 1 : Math.max(1, v);
      cartSave(items); renderCartPage();
    });
  });
  wrap.querySelectorAll('[data-remove]').forEach(function (b) {
    b.addEventListener('click', function () {
      items = cartGet();
      items.splice(parseInt(b.dataset.remove, 10), 1);
      cartSave(items); renderCartPage();
    });
  });

  var cof = document.getElementById('cartOrderForm');
  cof.addEventListener('submit', function (e) {
    e.preventDefault();
    sendForm(cof, function () {
      localStorage.removeItem(CART_KEY);
      cartUpdateBadge();
      setTimeout(function () { location.href = '/cart/spasibo/'; }, 1800);
    });
  });
}

/* ================= Каталог: фильтры и сортировка ================= */
function initCatalogFilter() {
  var grid = document.getElementById('catalogGrid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
  var countEl = document.getElementById('catalogCount');
  var sortSel = document.getElementById('sortSelect');

  function apply() {
    var cats = [], subs = [];
    document.querySelectorAll('.f-cat:checked').forEach(function (c) { cats.push(c.value); });
    document.querySelectorAll('.f-sub:checked').forEach(function (c) { subs.push(c.value); });
    var stockOnly = document.getElementById('fStock') ? document.getElementById('fStock').checked : false;
    var shown = 0;
    cards.forEach(function (card) {
      var ok = cats.indexOf(card.dataset.cat) !== -1;
      if (ok && subs.length) ok = subs.indexOf(card.dataset.sub) !== -1;
      if (ok && stockOnly) ok = card.dataset.stock === '1';
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (countEl) countEl.textContent = 'Показано ' + shown + ' из ' + cards.length + ' позиций';
  }

  function sortCards() {
    if (!sortSel) return;
    var mode = sortSel.value;
    var sorted = cards.slice();
    if (mode === 'price-asc') {
      sorted.sort(function (a, b) { return (+a.dataset.priceNum || Infinity) - (+b.dataset.priceNum || Infinity); });
    } else if (mode === 'price-desc') {
      sorted.sort(function (a, b) { return (+b.dataset.priceNum || 0) - (+a.dataset.priceNum || 0); });
    } else if (mode === 'name') {
      sorted.sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name, 'ru'); });
    } else { return; }
    sorted.forEach(function (c) { grid.appendChild(c); });
  }

  document.querySelectorAll('.f-cat, .f-sub').forEach(function (c) {
    c.addEventListener('change', function () {
      // При снятии категории — снять её подкатегории
      apply();
    });
  });
  var stockCb = document.getElementById('fStock');
  stockCb && stockCb.addEventListener('change', apply);
  sortSel && sortSel.addEventListener('change', sortCards);
  var reset = document.getElementById('filterReset');
  reset && reset.addEventListener('click', function () {
    document.querySelectorAll('.f-cat, .f-sub').forEach(function (c) { c.checked = true; });
    if (stockCb) stockCb.checked = true;
    if (sortSel) sortSel.value = 'default';
    apply();
  });
  apply();
}

/* ================= Init ================= */
document.addEventListener('DOMContentLoaded', function () {
  initCookie();
  initNav();
  initModals();
  initForms();
  initAddToCart();
  initCatalogFilter();
  cartUpdateBadge();
  if (document.getElementById('quizBody')) renderQuizStep();
  renderCartPage();
});
