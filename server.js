const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// ✅ تقديم الملفات الثابتة من مسار مطلق (حل Render)
app.use(express.static(path.join(__dirname, 'public')));

// مصفوفة لتخزين الرسائل (في الذاكرة)
let messages = [];
const MAX_MESSAGES = 100; // الحد الأقصى للرسائل المحفوظة

// عداد للمستخدمين المتصلين
let userCount = 0;

// عند اتصال مستخدم جديد
io.on('connection', (socket) => {
  userCount++;
  console.log(`مستخدم جديد متصل. العدد الكلي: ${userCount}`);

  // إرسال الرسائل السابقة للمستخدم الجديد
  socket.emit('previous messages', messages);

  // إرسال عدد المستخدمين المتصلين للجميع
  io.emit('user count', userCount);

  // استقبال رسالة جديدة
  socket.on('chat message', (data) => {
    const message = {
      id: Date.now(),
      username: data.username,
      text: data.text,
      timestamp: new Date().toISOString()
    };

    // إضافة الرسالة إلى المصفوفة
    messages.push(message);

    // الاحتفاظ بآخر 100 رسالة فقط
    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }

    // إرسال الرسالة لجميع المتصلين
    io.emit('chat message', message);
  });

  // عند إرسال إشعار الكتابة
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  // عند التوقف عن الكتابة
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing');
  });

  // عند قطع الاتصال
  socket.on('disconnect', () => {
    userCount--;
    console.log(`مستخدم قطع الاتصال. العدد الكلي: ${userCount}`);
    io.emit('user count', userCount);
  });
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
