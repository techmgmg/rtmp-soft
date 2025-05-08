// server.js
const path = require('path');
const express = require('express');
const basicAuth = require('express-basic-auth');
const NodeMediaServer = require('node-media-server');

// 1) Настройки доступа

const ALLOWED_ADMIN_IPS = [
    '10.0.0.2', //NR
    '10.0.0.54', // TA
    '10.0.0.4', // TI
    '10.0.0.17', // Kopilov
    '10.0.0.20', // Kovalev
    '10.0.0.7', // SF
    '10.0.0.45', // Server


]; // админские IP

const AUTH_USERS = {user1: 'admin', user2: 'pass2'};      // логины админов

// 2) Запускаем NodeMediaServer как раньше
/*const nmsConfig = {
    logType: 2,
    rtmp: {port: 1935, chunk_size: 60000, gop_cache: true, ping: 30, ping_timeout: 60},
    http: {port: 8000, allow_origin: '*'}
};*/

const nmsConfig = {
    logType: 2,
    rtmp: {
        port: 1935,
        chunk_size: 4096,
        gop_cache: false,
        ping: 30,
        ping_timeout: 20
    },
    http: {
        port: 8000,
        allow_origin: '*',
        mediaroot: './media', // <--- добавляем
        webroot: './public',  // <--- добавляем
        api: true,            // <--- добавляем API для контроля потоков
        flv: true             // <--- ВАЖНО! Разрешаем HTTP-FLV
    },
    trans: {
        ffmpeg: 'ffmpeg',
        tasks: [
            {
                app: 'live',
                mp4: false,
                hls: false,
                dash: false,
                vc: "libx264",
                vcParam: ['-vf', 'scale=w=854:h=480:force_original_aspect_ratio=decrease', '-preset', 'ultrafast', '-tune', 'zerolatency'],
                ac: "aac",
                acParam: ['-ar', '44100', '-b:a', '64k', '-g', '10', '-keyint_min', '30'],
                rtmp: true,
            }
        ]
    }

};

const nms = new NodeMediaServer(nmsConfig);
nms.run();
console.log('▶️ NodeMediaServer запущен: RTMP 1935, HTTP-FLV 8000');

// 3) Запускаем Express рядом
const app = express();
const WEB_PORT = 3000;

// 3a) Фильтр по IP
app.use((req, res, next) => {
    const ip = req.ip.startsWith('::ffff:') ? req.ip.split(':').pop() : req.ip;
    if (!ALLOWED_ADMIN_IPS.includes(ip) && ip !== '127.0.0.1') {
        console.log(`[WEB DENIED] IP ${ip}`);
        return res.status(403).send('Forbidden');
    }
    next();
});

// 3b) Basic Auth для всех веб-админок
app.use(basicAuth({
    users: AUTH_USERS,
    challenge: true,
    realm: 'Admin Area'
}));

// 3c) Статика: отдаем клиентскую страницу и flv.js
app.use(express.static(path.join(__dirname, 'public')));

// 3d) По умолчанию — index.html
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// 3e) Запуск HTTP-панели
app.listen(WEB_PORT, () => {
    console.log(`🌐 Web-интерфейс доступен: http://<IP>:${WEB_PORT}/ (Basic Auth + IP filter)`);
});