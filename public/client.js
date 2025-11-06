// ====================================
// الاتصال بالخادم
// ====================================
const socket = io();

// ====================================
// العناصر من DOM
// ====================================
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messagesContainer');
const usernameInput = document.getElementById('username');
const typingIndicator = document.getElementById('typingIndicator');
const typingText = document.getElementById('typingText');
const userCountElement = document.getElementById('userCount');

// ====================================
// توليد اسم مستخدم افتراضي
// ====================================
const arabicNames = [
    'محمد', 'أحمد', 'علي', 'فاطمة', 'خديجة', 
    'عمر', 'عثمان', 'خالد', 'سارة', 'مريم',
    'يوسف', 'إبراهيم', 'زينب', 'نور', 'ليلى'
];

const randomName = arabicNames[Math.floor(Math.random() * arabicNames.length)];
const randomNumber = Math.floor(Math.random() * 9999);
usernameInput.value = `${randomName}${randomNumber}`;

// ====================================
// متغيرات تتبع الحالة
// ====================================
let isTyping = false;
let typingTimer;
let isFirstMessage = true;

// ====================================
// دالة إرسال الرسالة
// ====================================
function sendMessage() {
    const text = messageInput.value.trim();
    const username = usernameInput.value.trim() || 'مجهول';

    if (!text) {
        // هز الحقل إذا كان فارغاً
        messageInput.classList.add('shake');
        setTimeout(() => messageInput.classList.remove('shake'), 500);
        return;
    }

    // إرسال الرسالة للخادم
    socket.emit('chat message', { username, text });

    // مسح الحقل
    messageInput.value = '';
    
    // إيقاف إشعار الكتابة
    socket.emit('stop typing');
    isTyping = false;

    // تأثير الإرسال
    sendButton.classList.add('sent');
    setTimeout(() => sendButton.classList.remove('sent'), 300);
}

// ====================================
// دالة إضافة رسالة
// ====================================
function addMessage(username, text, timestamp) {
    // إزالة رسالة الترحيب عند أول رسالة
    if (isFirstMessage) {
        const welcomeCard = messagesContainer.querySelector('.welcome-card');
        if (welcomeCard) {
            welcomeCard.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => welcomeCard.remove(), 300);
        }
        isFirstMessage = false;
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    // تنسيق الوقت
    const time = timestamp ? new Date(timestamp) : new Date();
    const timeString = time.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    });

    messageElement.innerHTML = `
        <span class="username">${escapeHtml(username)}</span>
        <span class="text">${escapeHtml(text)}</span>
        <span class="timestamp">${timeString}</span>
    `;

    messagesContainer.appendChild(messageElement);
    
    // التمرير السلس للأسفل
    setTimeout(() => {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

// ====================================
// حماية من XSS
// ====================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====================================
// معالجات الأحداث
// ====================================

// النقر على زر الإرسال
sendButton.addEventListener('click', sendMessage);

// الضغط على Enter
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// معالجة الكتابة (Typing Indicator)
messageInput.addEventListener('input', () => {
    const username = usernameInput.value.trim() || 'مجهول';
    
    if (messageInput.value.trim() !== '') {
        if (!isTyping) {
            isTyping = true;
            socket.emit('typing', username);
        }
        
        // إعادة تعيين المؤقت
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            isTyping = false;
            socket.emit('stop typing');
        }, 1000);
    } else {
        if (isTyping) {
            isTyping = false;
            socket.emit('stop typing');
        }
    }
});

// التركيز على حقل الرسالة عند تحميل الصفحة
window.addEventListener('load', () => {
    messageInput.focus();
});

// ====================================
// استقبال الأحداث من الخادم
// ====================================

// استقبال الرسائل السابقة
socket.on('previous messages', (messages) => {
    messages.forEach(msg => {
        addMessage(msg.username, msg.text, msg.timestamp);
    });
});

// استقبال رسالة جديدة
socket.on('chat message', (msg) => {
    addMessage(msg.username, msg.text, msg.timestamp);
    
    // تشغيل صوت إشعار (اختياري)
    playNotificationSound();
});

// تحديث عدد المستخدمين
socket.on('user count', (count) => {
    userCountElement.textContent = count;
    
    // تأثير النبض عند تغيير العدد
    userCountElement.style.animation = 'none';
    setTimeout(() => {
        userCountElement.style.animation = 'pulse 0.5s ease-out';
    }, 10);
});

// عرض إشعار الكتابة
socket.on('typing', (username) => {
    typingText.textContent = `${username} يكتب...`;
    typingIndicator.style.display = 'block';
});

// إخفاء إشعار الكتابة
socket.on('stop typing', () => {
    typingIndicator.style.display = 'none';
});

// معالجة الاتصال
socket.on('connect', () => {
    console.log('✅ متصل بالخادم');
});

// معالجة قطع الاتصال
socket.on('disconnect', () => {
    console.log('❌ تم قطع الاتصال');
    showConnectionStatus(false);
});

// معالجة إعادة الاتصال
socket.on('reconnect', () => {
    console.log('🔄 تم إعادة الاتصال');
    showConnectionStatus(true);
});

// ====================================
// دوال مساعدة
// ====================================

// تشغيل صوت إشعار بسيط
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // تجاهل الأخطاء الصوتية
    }
}

// عرض حالة الاتصال
function showConnectionStatus(connected) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${connected ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideDown 0.3s ease-out;
    `;
    statusDiv.textContent = connected ? '✅ متصل' : '❌ غير متصل';
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => statusDiv.remove(), 300);
    }, 2000);
}

// ====================================
// أنماط CSS إضافية للتأثيرات
// ====================================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to { opacity: 0; transform: scale(0.9); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
    
    .shake {
        animation: shake 0.5s;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    .sent {
        animation: sendPulse 0.3s;
    }
    
    @keyframes sendPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(0.95); }
    }
`;
document.head.appendChild(style);

// ====================================
// رسالة في الـ Console
// ====================================
console.log('%c💬 غرفة الدردشة ', 'background: #6366f1; color: white; font-size: 20px; padding: 10px; border-radius: 5px;');
console.log('%cمرحباً بك! الموقع يعمل بشكل صحيح ✅', 'color: #10b981; font-size: 14px;');