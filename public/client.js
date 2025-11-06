// ====================================
// إدارة Cookies
// ====================================
const CookieManager = {
    set: (name, value, days = 365) => {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${date.toUTCString()};path=/`;
    },
    
    get: (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) {
            try {
                return JSON.parse(decodeURIComponent(match[2]));
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    
    remove: (name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    }
};

// ====================================
// الاتصال بالخادم
// ====================================
const socket = io();

// ====================================
// العناصر من DOM
// ====================================
const elements = {
    messageInput: document.getElementById('messageInput'),
    sendButton: document.getElementById('sendButton'),
    messagesContainer: document.getElementById('messagesContainer'),
    usernameInput: document.getElementById('username'),
    typingIndicator: document.getElementById('typingIndicator'),
    typingText: document.getElementById('typingText'),
    userCountElement: document.getElementById('userCount'),
    userAvatar: document.getElementById('userAvatar'),
    replyBanner: document.getElementById('replyBanner'),
    replyUsername: document.getElementById('replyUsername'),
    replyMessage: document.getElementById('replyMessage'),
    replyClose: document.getElementById('replyClose'),
    charCounter: document.getElementById('charCounter'),
    emojiBtn: document.getElementById('emojiBtn'),
    emojiPicker: document.getElementById('emojiPicker'),
    emojiGrid: document.getElementById('emojiGrid'),
    changeAvatarBtn: document.getElementById('changeAvatarBtn'),
    avatarPicker: document.getElementById('avatarPicker'),
    avatarGrid: document.getElementById('avatarGrid'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    soundToggle: document.getElementById('soundToggle'),
    notificationToggle: document.getElementById('notificationToggle'),
    typingToggle: document.getElementById('typingToggle'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn')
};

// ====================================
// الإعدادات والحالات
// ====================================
let currentReply = null;
let isTyping = false;
let typingTimer;
let isFirstMessage = true;

// الإيموجي المتاحة
const emojis = ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄','💋','🩸'];

// الأفتارات المتاحة
const avatars = ['👤','😀','😎','🤓','😇','🥳','🤩','😍','🥰','😏','🤔','🧐','😴','🥱','😛','🤪','🤑','🤠','👻','👽','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈'];

// تحميل الإعدادات من Cookies
let settings = CookieManager.get('chatSettings') || {
    sound: true,
    notifications: true,
    typing: true
};

// تحميل معلومات المستخدم من Cookies
let userData = CookieManager.get('chatUserData') || {
    username: '',
    avatar: '👤',
    messageCount: 0
};

// ====================================
// التهيئة الأولية
// ====================================
function initializeApp() {
    // تعيين الاسم والأفتار المحفوظين
    if (userData.username) {
        elements.usernameInput.value = userData.username;
    } else {
        const names = ['محمد', 'أحمد', 'علي', 'فاطمة', 'خديجة', 'عمر', 'خالد', 'سارة', 'مريم', 'نور'];
        userData.username = `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 9999)}`;
        elements.usernameInput.value = userData.username;
    }
    
    elements.userAvatar.textContent = userData.avatar;
    
    // تعيين الإعدادات
    elements.soundToggle.checked = settings.sound;
    elements.notificationToggle.checked = settings.notifications;
    elements.typingToggle.checked = settings.typing;
    
    // إنشاء قوائم الإيموجي والأفتارات
    populateEmojis();
    populateAvatars();
    
    // التركيز على حقل الرسالة
    elements.messageInput.focus();
    
    // تفعيل الإشعارات
    if (settings.notifications && 'Notification' in window) {
        Notification.requestPermission();
    }
}

// ====================================
// ملء قائمة الإيموجي
// ====================================
function populateEmojis() {
    elements.emojiGrid.innerHTML = emojis.map(emoji => 
        `<div class="emoji-item" data-emoji="${emoji}">${emoji}</div>`
    ).join('');
    
    elements.emojiGrid.querySelectorAll('.emoji-item').forEach(item => {
        item.addEventListener('click', () => {
            insertEmoji(item.dataset.emoji);
        });
    });
}

// ====================================
// ملء قائمة الأفتارات
// ====================================
function populateAvatars() {
    elements.avatarGrid.innerHTML = avatars.map(avatar => 
        `<div class="avatar-option" data-avatar="${avatar}">${avatar}</div>`
    ).join('');
    
    elements.avatarGrid.querySelectorAll('.avatar-option').forEach(item => {
        item.addEventListener('click', () => {
            selectAvatar(item.dataset.avatar);
        });
    });
}

// ====================================
// إدراج إيموجي
// ====================================
function insertEmoji(emoji) {
    const cursorPos = elements.messageInput.selectionStart;
    const text = elements.messageInput.value;
    const newText = text.slice(0, cursorPos) + emoji + text.slice(cursorPos);
    elements.messageInput.value = newText;
    elements.messageInput.focus();
    elements.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    updateCharCounter();
    elements.emojiPicker.classList.remove('active');
}

// ====================================
// اختيار أفتار
// ====================================
function selectAvatar(avatar) {
    userData.avatar = avatar;
    elements.userAvatar.textContent = avatar;
    CookieManager.set('chatUserData', userData);
    elements.avatarPicker.classList.remove('active');
}

// ====================================
// تحديث عداد الأحرف
// ====================================
function updateCharCounter() {
    const count = elements.messageInput.value.length;
    elements.charCounter.textContent = `${count}/1000`;
    if (count > 900) {
        elements.charCounter.style.color = 'var(--warning)';
    } else {
        elements.charCounter.style.color = 'var(--text-muted)';
    }
}

// ====================================
// إرسال رسالة
// ====================================
function sendMessage() {
    const text = elements.messageInput.value.trim();
    const username = elements.usernameInput.value.trim() || 'مجهول';
    
    if (!text) {
        elements.messageInput.classList.add('shake');
        setTimeout(() => elements.messageInput.classList.remove('shake'), 500);
        return;
    }
    
    // حفظ الاسم
    userData.username = username;
    userData.messageCount++;
    CookieManager.set('chatUserData', userData);
    
    const messageData = {
        username,
        text,
        avatar: userData.avatar,
        reply: currentReply
    };
    
    socket.emit('chat message', messageData);
    
    elements.messageInput.value = '';
    updateCharCounter();
    cancelReply();
    socket.emit('stop typing');
    isTyping = false;
    
    // تأثير الإرسال
    elements.sendButton.style.animation = 'sendPulse 0.3s';
    setTimeout(() => elements.sendButton.style.animation = '', 300);
    
    // تشغيل صوت
    if (settings.sound) playSound('send');
}

// ====================================
// إضافة رسالة
// ====================================
function addMessage(msg) {
    if (isFirstMessage) {
        const welcome = elements.messagesContainer.querySelector('.welcome-screen');
        if (welcome) {
            welcome.style.animation = 'fadeOut 0.3s';
            setTimeout(() => welcome.remove(), 300);
        }
        isFirstMessage = false;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.messageId = msg.id;
    
    // التحقق إذا كانت رسالتي
    const isOwn = msg.username === elements.usernameInput.value.trim();
    if (isOwn) messageDiv.classList.add('own-message');
    
    // بناء HTML الرسالة
    let html = `
        <div class="message-header">
            <span class="message-avatar">${msg.avatar || '👤'}</span>
            <span class="message-username">${escapeHtml(msg.username)}</span>
            <span class="message-time">${formatTime(msg.timestamp)}</span>
        </div>
        <div class="message-body">
    `;
    
    // إضافة الرد إن وجد
    if (msg.reply) {
        html += `
            <div class="message-reply">
                <div class="reply-to">↩️ ${escapeHtml(msg.reply.username)}</div>
                <div class="reply-content">${escapeHtml(msg.reply.text)}</div>
            </div>
        `;
    }
    
    html += `
            <div class="message-text">${escapeHtml(msg.text)}</div>
        </div>
        <div class="message-actions">
            <button class="msg-action-btn reply-btn" data-username="${escapeHtml(msg.username)}" data-text="${escapeHtml(msg.text)}" data-id="${msg.id}">
                ↩️ رد
            </button>
        </div>
    `;
    
    messageDiv.innerHTML = html;
    
    // معالج زر الرد
    messageDiv.querySelector('.reply-btn').addEventListener('click', function() {
        setReply(this.dataset.username, this.dataset.text, this.dataset.id);
    });
    
    elements.messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // تشغيل صوت وإشعار للرسائل الجديدة
    if (!isOwn) {
        if (settings.sound) playSound('receive');
        if (settings.notifications) showNotification(msg.username, msg.text);
    }
}

// ====================================
// تعيين الرد
// ====================================
function setReply(username, text, id) {
    currentReply = { username, text, id };
    elements.replyUsername.textContent = username;
    elements.replyMessage.textContent = text.length > 50 ? text.substring(0, 50) + '...' : text;
    elements.replyBanner.classList.add('active');
    elements.messageInput.focus();
}

// ====================================
// إلغاء الرد
// ====================================
function cancelReply() {
    currentReply = null;
    elements.replyBanner.classList.remove('active');
}

// ====================================
// تنسيق الوقت
// ====================================
function formatTime(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
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
// التمرير للأسفل
// ====================================
function scrollToBottom() {
    setTimeout(() => {
        elements.messagesContainer.scrollTo({
            top: elements.messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

// ====================================
// تشغيل الأصوات
// ====================================
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'send') {
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } else if (type === 'receive') {
            oscillator.frequency.value = 600;
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}

// ====================================
// إظهار إشعار
// ====================================
function showNotification(username, text) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`رسالة من ${username}`, {
            body: text.substring(0, 100),
            icon: '💬',
            tag: 'chat-notification'
        });
    }
}

// ====================================
// معالجات الأحداث
// ====================================

// زر الإرسال
elements.sendButton.addEventListener('click', sendMessage);

// Enter للإرسال
elements.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// تحديث عداد الأحرف
elements.messageInput.addEventListener('input', () => {
    updateCharCounter();
    
    // إشعار الكتابة
    if (settings.typing) {
        const text = elements.messageInput.value.trim();
        if (text !== '') {
            if (!isTyping) {
                isTyping = true;
                socket.emit('typing', elements.usernameInput.value.trim());
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
    }
});

// تعديل الاسم
elements.usernameInput.addEventListener('change', () => {
    userData.username = elements.usernameInput.value.trim();
    CookieManager.set('chatUserData', userData);
});

// إلغاء الرد
elements.replyClose.addEventListener('click', cancelReply);

// قائمة الإيموجي
elements.emojiBtn.addEventListener('click', () => {
    elements.emojiPicker.classList.toggle('active');
    elements.avatarPicker.classList.remove('active');
});

// قائمة الأفتارات
elements.changeAvatarBtn.addEventListener('click', () => {
    elements.avatarPicker.classList.toggle('active');
    elements.emojiPicker.classList.remove('active');
});

// الإعدادات
elements.settingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('active');
});

elements.closeSettings.addEventListener('click', () => {
    elements.settingsModal.classList.remove('active');
});

elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
        elements.settingsModal.classList.remove('active');
    }
});

// تحديث الإعدادات
elements.soundToggle.addEventListener('change', () => {
    settings.sound = elements.soundToggle.checked;
    CookieManager.set('chatSettings', settings);
});

elements.notificationToggle.addEventListener('change', () => {
    settings.notifications = elements.notificationToggle.checked;
    CookieManager.set('chatSettings', settings);
    if (settings.notifications && 'Notification' in window) {
        Notification.requestPermission();
    }
});

elements.typingToggle.addEventListener('change', () => {
    settings.typing = elements.typingToggle.checked;
    CookieManager.set('chatSettings', settings);
});

// مسح السجل
elements.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('هل تريد مسح جميع بيانات المحفوظة؟')) {
        CookieManager.remove('chatUserData');
        CookieManager.remove('chatSettings');
        location.reload();
    }
});

// إغلاق القوائم عند النقر خارجها
document.addEventListener('click', (e) => {
    if (!elements.emojiBtn.contains(e.target) && !elements.emojiPicker.contains(e.target)) {
        elements.emojiPicker.classList.remove('active');
    }
    if (!elements.changeAvatarBtn.contains(e.target) && !elements.avatarPicker.contains(e.target)) {
        elements.avatarPicker.classList.remove('active');
    }
});

// ====================================
// أحداث Socket.IO
// ====================================

socket.on('previous messages', (messages) => {
    messages.forEach(msg => addMessage(msg));
});

socket.on('chat message', (msg) => {
    addMessage(msg);
});

socket.on('user count', (count) => {
    elements.userCountElement.textContent = count;
});

socket.on('typing', (username) => {
    elements.typingText.textContent = `${username} يكتب...`;
    elements.typingIndicator.classList.add('active');
});

socket.on('stop typing', () => {
    elements.typingIndicator.classList.remove('active');
});

socket.on('connect', () => {
    console.log('✅ متصل بالخادم');
});

socket.on('disconnect', () => {
    console.log('❌ انقطع الاتصال');
});

// ====================================
// تهيئة التطبيق عند التحميل
// ====================================
window.addEventListener('load', initializeApp);

// ====================================
// رسالة في الـ Console
// ====================================
console.log('%c💬 غرفة الدردشة - Dark Mode', 'background: linear-gradient(135deg, #00d9ff 0%, #7b2ff7 100%); color: white; font-size: 18px; padding: 10px 20px; border-radius: 8px; font-weight: bold;');
console.log('%c✨ الموقع يعمل بشكل صحيح!', 'color: #00ff88; font-size: 14px; font-weight: bold;');
console.log(`%cإحصائياتك: عدد الرسائل المرسلة: ${userData.messageCount}`, 'color: #00d9ff; font-size: 12px;');