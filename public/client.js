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
const themeToggle = document.getElementById('themeToggle');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

// ✨ جديد: عناصر الرموز التعبيرية والرد
const emojiButton = document.getElementById('emojiButton');
const emojiPickerContainer = document.getElementById('emojiPickerContainer');
const emojiPicker = document.querySelector('emoji-picker');
const inputReplyContext = document.getElementById('inputReplyContext');
const replyContextUsername = document.getElementById('replyContextUsername');
const replyContextText = document.getElementById('replyContextText');
const cancelReplyBtn = document.getElementById('cancelReplyBtn');


// ====================================
// اسم المستخدم
// ====================================
const savedUsername = localStorage.getItem('username');
if (savedUsername) {
    usernameInput.value = savedUsername;
} else {
    // ✨✨✨ تم تحديث هذه القائمة بناءً على طلبك ✨✨✨
    const arabicNames = [
        'علي', 'حسن', 'حسين', 'جعفر', 'موسى', 'كاظم', 'رضا', 
        'جواد', 'هادي', 'مهدي', 'باقر', 'عباس', 'فاطمة', 
        'زينب', 'زهراء', 'رقية', 'سكينة', 'نرجس', 'معصومة'
    ];
    // ... (نفس كود توليد الاسم العشوائي)
    const randomName = arabicNames[Math.floor(Math.random() * arabicNames.length)];
    const randomNumber = Math.floor(Math.random() * 9999);
    usernameInput.value = `${randomName}${randomNumber}`;
    localStorage.setItem('username', usernameInput.value);
}
usernameInput.addEventListener('input', () => {
    localStorage.setItem('username', usernameInput.value.trim());
});

// ====================================
// متغيرات تتبع الحالة
// ====================================
let isTyping = false;
let typingTimer;
let isFirstMessage = true;
let currentReplyMessageId = null; // ✨ جديد: لتتبع الرسالة التي يتم الرد عليها

// ====================================
// دالة إرسال الرسالة
// ====================================
function sendMessage() {
    const text = messageInput.value.trim();
    const username = usernameInput.value.trim() || localStorage.getItem('username') || 'مجهول';

    if (!text) {
        messageInput.parentElement.classList.add('shake');
        setTimeout(() => messageInput.parentElement.classList.remove('shake'), 500);
        return;
    }

    // ✨ تعديل: إرسال كائن الرسالة كاملاً
    const messageData = {
        username,
        text,
        replyToId: currentReplyMessageId // أضفنا ID الرد
    };
    socket.emit('chat message', messageData);

    messageInput.value = '';
    socket.emit('stop typing');
    isTyping = false;

    // ✨ جديد: إلغاء وضع الرد بعد الإرسال
    cancelReply();

    sendButton.classList.add('sent');
    setTimeout(() => sendButton.classList.remove('sent'), 300);
}

// ====================================
// ✨ جديد: دوال الرد
// ====================================
function startReply(messageId, username, text) {
    currentReplyMessageId = messageId;
    replyContextUsername.textContent = username;
    replyContextText.textContent = text;
    inputReplyContext.style.display = 'flex';
    messageInput.focus();
}

function cancelReply() {
    currentReplyMessageId = null;
    inputReplyContext.style.display = 'none';
    replyContextUsername.textContent = '';
    replyContextText.textContent = '';
}
// ربط زر الإلغاء
cancelReplyBtn.addEventListener('click', cancelReply);


// ====================================
// دالة إضافة رسالة
// ====================================
// ✨ تعديل: الدالة أصبحت تستقبل كائن رسالة كامل
function addMessage(msg) {
    // msg = { id, username, text, timestamp, replyTo }
    // replyTo = { username, text } (اختياري)

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
    // ✨ جديد: إضافة ID الرسالة للـ DOM
    messageElement.dataset.messageId = msg.id; 
    messageElement.dataset.username = msg.username;
    messageElement.dataset.text = msg.text;

    // تنسيق الوقت
    const time = msg.timestamp ? new Date(msg.timestamp) : new Date();
    const timeString = time.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    });

    // ✨ جديد: بناء الاقتباس (الرد) إذا وجد
    let replyQuoteHtml = '';
    if (msg.replyTo) {
        replyQuoteHtml = `
            <div class="message-reply-quote">
                <span class="username">${escapeHtml(msg.replyTo.username)}</span>
                <span class="text">${escapeHtml(msg.replyTo.text)}</span>
            </div>
        `;
    }

    messageElement.innerHTML = `
        ${replyQuoteHtml}
        <span class="username">${escapeHtml(msg.username)}</span>
        <span class="text">${escapeHtml(msg.text)}</span>
        <span class="timestamp">${timeString}</span>
        <button class="reply-button">↩</button>
    `;

    // ... (نفس منطق التمرير للأسفل) ...
    const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 50;
    messagesContainer.appendChild(messageElement);
    if (isScrolledToBottom) {
        setTimeout(() => {
            messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
        }, 100);
    } else {
        scrollToBottomBtn.style.display = 'block';
    }
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

// ... (النقر والإدخال) ...
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
messageInput.addEventListener('input', () => {
    const username = usernameInput.value.trim() || 'مجهول';
    if (messageInput.value.trim() !== '') {
        if (!isTyping) {
            isTyping = true;
            socket.emit('typing', username);
        }
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
window.addEventListener('load', () => {
    messageInput.focus();
});


// ... (أزرار النزول والوضع الداكن) ...
scrollToBottomBtn.addEventListener('click', () => {
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
    scrollToBottomBtn.style.display = 'none';
});
messagesContainer.addEventListener('scroll', () => {
    if (messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 50) {
        scrollToBottomBtn.style.display = 'none';
    }
});
function setInitialTheme() {
    const preferredTheme = localStorage.getItem('theme');
    if (preferredTheme === 'dark') {
        document.body.classList.add('dark-mode');
        emojiPicker.classList.remove('light');
        emojiPicker.classList.add('dark');
    } else {
        document.body.classList.remove('dark-mode');
        emojiPicker.classList.remove('dark');
        emojiPicker.classList.add('light');
    }
}
setInitialTheme();
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        emojiPicker.classList.remove('light');
        emojiPicker.classList.add('dark');
    } else {
        localStorage.setItem('theme', 'light');
        emojiPicker.classList.remove('dark');
        emojiPicker.classList.add('light');
    }
});


// ====================================
// ✨ جديد: منطق ال