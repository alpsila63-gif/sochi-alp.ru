<?php
/**
 * Обработчик форм sochi-alp.ru
 * Сохраняет заявки в /var/www/leads_data/leads.json
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://sochi-alp.ru');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}

// --- Получаем данные ---
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
    $data = $_POST;
}

// Sanitize
function s(string $v): string {
    return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8');
}

$name    = s($data['name']    ?? '');
$phone   = s($data['phone']   ?? '');
$service = s($data['service'] ?? '');
$message = s($data['message'] ?? '');
$page    = s($data['page']    ?? $_SERVER['HTTP_REFERER'] ?? '');
$source  = s($data['source']  ?? 'form');

if (empty($phone) && empty($name)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Заполните хотя бы одно поле']);
    exit;
}

// --- Записываем заявку ---
$leadsDir  = '/var/www/leads_data';
$leadsFile = $leadsDir . '/leads.json';

if (!is_dir($leadsDir)) {
    mkdir($leadsDir, 0750, true);
}

$lead = [
    'id'      => uniqid('l', true),
    'dt'      => date('Y-m-d H:i:s'),
    'ts'      => time(),
    'name'    => $name,
    'phone'   => $phone,
    'service' => $service,
    'message' => $message,
    'page'    => $page,
    'source'  => $source,
    'status'  => 'new',
    'ip'      => $_SERVER['REMOTE_ADDR'] ?? '',
];

$leads = [];
if (file_exists($leadsFile)) {
    $existing = @json_decode(file_get_contents($leadsFile), true);
    if (is_array($existing)) {
        $leads = $existing;
    }
}
array_unshift($leads, $lead); // новые сверху
file_put_contents($leadsFile, json_encode($leads, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);

// --- Отправляем в Telegram (если настроен) ---
$tgFile = $leadsDir . '/tg_config.json';
if (file_exists($tgFile)) {
    $tg = json_decode(file_get_contents($tgFile), true);
    if (!empty($tg['token']) && !empty($tg['chat_id'])) {
        $text  = "🔔 <b>Новая заявка — Альпинисты Сочи</b>\n\n";
        $text .= $name    ? "👤 Имя: <b>{$name}</b>\n"       : '';
        $text .= $phone   ? "📞 Телефон: <b>{$phone}</b>\n"   : '';
        $text .= $service ? "🔧 Услуга: {$service}\n"         : '';
        $text .= $message ? "💬 Сообщение: {$message}\n"      : '';
        $text .= $page    ? "\n🌐 Страница: {$page}"          : '';

        $url = "https://api.telegram.org/bot{$tg['token']}/sendMessage";
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_POSTFIELDS     => http_build_query([
                'chat_id'    => $tg['chat_id'],
                'text'       => $text,
                'parse_mode' => 'HTML',
            ]),
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}

echo json_encode(['ok' => true, 'message' => 'Заявка принята. Свяжемся с вами в течение 2 минут.']);
