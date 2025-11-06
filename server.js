const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// تقديم الملفات الثابتة
app.use(express.static('public'));

// تخزين الرسائل
let messages = [];
const MAX_MESSAGES = 100;

// عداد المستخدمين
let userCount = 0;

// عند اتصال مستخدم جديد
io.on('connection', (socket) => {
    userCount++;
    console.log(`✅ مستخدم جديد متصل. العدد الكلي: ${userCount}`);

    // إرسال الرسائل السابقة
    socket.emit('previous messages', messages);

    // إرسال عدد المستخدمين
    io.emit('user count', userCount);

    // استقبال رسالة جديدة
    socket.on('chat message', (data) => {
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: data.username || 'مجهول',
            text: data.text,
            avatar: data.avatar || '👤',
            reply: data.reply || null,
            timestamp: new Date().toISOString()
        };

        // إضافة الرسالة
        messages.push(message);

        // الاحتفاظ بآخر 100 رسالة
        if (messages.length > MAX_MESSAGES) {
            messages.shift();
        }

        // إرسال الرسالة لجميع المتصلين
        io.emit('chat message', message);
        
        console.log(`📨 ${message.username}: ${message.text.substring(0, 50)}...`);
    });

    // إشعار الكتابة
    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', username);
    });

    // إيقاف إشعار الكتابة
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
    });

    // قطع الاتصال
    socket.on('disconnect', () => {
        userCount--;
        console.log(`❌ مستخدم قطع الاتصال. العدد الكلي: ${userCount}`);
        io.emit('user count', userCount);
    });
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 افتح المتصفح على: http://localhost:${PORT}`);
    console.log(`🌙 التصميم: Dark Mode`);
    console.log(`✨ الميزات: الرد، الأفتارات، الإيموجي، Cookies`);
    console.log('='.repeat(50));
});