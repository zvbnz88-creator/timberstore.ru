<?php
/**
 * Обработчик лид-форм timberstore.ru (хостинг Beget, PHP 8.x)
 * Принимает FormData, отправляет уведомление на e-mail и дублирует лид в CSV-файл.
 * Защита: honeypot, проверка согласия 152-ФЗ, ограничение частоты.
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// --- Настройки ---
define('MAIL_TO', 'timberstore.ru@gmail.com');   // куда падают лиды
define('MAIL_FROM', 'noreply@timberstore.ru');   // отправитель (домен сайта)
define('SITE_NAME', 'Строительный торговый дом');

// --- Только POST ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Метод не поддерживается']);
    exit;
}

// --- Частотное ограничение: не чаще 1 заявки в 20 сек с одной сессии ---
session_start();
$now = time();
if (isset($_SESSION['last_lead']) && ($now - $_SESSION['last_lead']) < 20) {
    echo json_encode(['ok' => false, 'message' => 'Заявка уже отправлена. Мы с вами свяжемся!']);
    exit;
}

// --- Очистка входных данных ---
function clean($s, $max = 1000) {
    $s = trim((string)$s);
    $s = strip_tags($s);
    $s = str_replace(["\r", "\n"], ' ', $s);
    return mb_substr($s, 0, $max);
}

$name     = clean($_POST['name'] ?? '', 100);
$phone    = clean($_POST['phone'] ?? '', 30);
$email    = clean($_POST['email'] ?? '', 100);
$comment  = clean($_POST['comment'] ?? '', 2000);
$product  = clean($_POST['product'] ?? '', 300);
$formType = clean($_POST['form_type'] ?? 'callback', 40);
$page     = clean($_POST['page'] ?? '', 200);
$quiz     = clean($_POST['quiz_answers'] ?? '', 500);
$order    = clean($_POST['order_items'] ?? '', 3000);
$hp       = trim($_POST['website'] ?? ''); // honeypot

// --- Honeypot: боты заполняют скрытое поле ---
if ($hp !== '') {
    echo json_encode(['ok' => true, 'message' => 'Спасибо! Мы свяжемся с вами.']);
    exit;
}

// --- Валидация ---
if ($phone === '' || mb_strlen(preg_replace('/\D/', '', $phone)) < 10) {
    echo json_encode(['ok' => false, 'message' => 'Укажите корректный номер телефона.']);
    exit;
}

// --- Согласие на обработку ПД (152-ФЗ) обязательно ---
$consent = isset($_POST['consent']);
if (!$consent) {
    echo json_encode(['ok' => false, 'message' => 'Требуется согласие на обработку персональных данных.']);
    exit;
}

// --- Формируем письмо ---
$typeNames = [
    'callback' => 'Заявка на обратный звонок',
    'quick_order' => 'Быстрый заказ товара',
    'order' => 'Заказ из корзины',
    'quiz' => 'Квиз: подбор материалов',
    'calc' => 'Заявка на расчёт',
    'consult' => 'Заявка на консультацию',
];
$typeLabel = $typeNames[$formType] ?? 'Заявка с сайта';

$lines = [];
$lines[] = 'ТИП: ' . $typeLabel;
if ($name !== '')    $lines[] = 'Имя: ' . $name;
if ($phone !== '')   $lines[] = 'Телефон: ' . $phone;
if ($email !== '')   $lines[] = 'E-mail: ' . $email;
if ($product !== '') $lines[] = 'Товар/услуга: ' . $product;
if ($order !== '')   $lines[] = "Состав заказа:\n" . str_replace('; ', "\n", $order);
if ($quiz !== '')    $lines[] = 'Ответы квиза: ' . $quiz;
if ($comment !== '') $lines[] = 'Комментарий: ' . $comment;
$lines[] = 'Страница: https://timberstore.ru' . $page;
$lines[] = 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '-');
$lines[] = 'Дата: ' . date('d.m.Y H:i:s');
$lines[] = 'Согласие на обработку ПД: да (152-ФЗ)';

$body = implode("\n", $lines);
$subject = '=?UTF-8?B?' . base64_encode('[timberstore.ru] ' . $typeLabel . ' — ' . $phone) . '?=';

$headers = [
    'From: =?UTF-8?B?' . base64_encode(SITE_NAME) . '?= <' . MAIL_FROM . '>',
    'Reply-To: ' . ($email !== '' ? $email : MAIL_FROM),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
$headersStr = implode("\r\n", $headers);

// --- Отправка письма (mail доступен на Beget) ---
$sent = @mail(MAIL_TO, $subject, $body, $headersStr);

// --- Дублируем лид в CSV-файл (страховка) ---
$leadDir = __DIR__ . '/.leads';
if (!is_dir($leadDir)) {
    @mkdir($leadDir, 0750, true);
    @file_put_contents($leadDir . '/.htaccess', "Require all denied\nDeny from all\n");
}
$leadRow = [
    date('Y-m-d H:i:s'),
    $formType,
    $name, $phone, $email,
    $product,
    $order,
    $quiz,
    $comment,
    'https://timberstore.ru' . $page,
    $_SERVER['REMOTE_ADDR'] ?? '-',
    $sent ? 'mail_ok' : 'mail_fail',
];
@file_put_contents(
    $leadDir . '/leads-' . date('Y-m') . '.csv',
    implode(';', array_map(function ($v) { return '"' . str_replace('"', '""', $v) . '"'; }, $leadRow)) . "\n",
    FILE_APPEND | LOCK_EX
);

$_SESSION['last_lead'] = $now;

if ($sent) {
    echo json_encode(['ok' => true, 'message' => 'Заявка принята! Мы перезвоним вам в течение 15 минут в рабочее время.']);
} else {
    // Лид всё равно сохранён в файл — сообщаем об успехе
    echo json_encode(['ok' => true, 'message' => 'Заявка принята! Мы перезвоним вам в течение 15 минут в рабочее время.']);
}
