// الاتصال مع السيرفر
const socket = io();

// عناصر الواجهة
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messagesContainer = document.getElementById("messagesContainer");
const usernameInput = document.getElementById("username");
const typingIndicator = document.getElementById("typingIndicator");
const typingText = document.getElementById("typingText");
const userCountElement = document.getElementById("userCount");

// اسم المستخدم الافتراضي تلقائي
usernameInput.value = "مستخدم-" + Math.floor(Math.random() * 999);

// إرسال رسالة
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

function sendMessage() {
    const text = messageInput.value.trim();
    const username = usernameInput.value.trim() || "مجهول";

    if (text === "") return;

    socket.emit("chat message", { username, text });

    messageInput.value = "";
    socket.emit("stop typing");
}

// عرض رسالة جديدة
socket.on("chat message", (msg) => {
    addMessage(msg.username, msg.text);
});

function addMessage(username, text) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    messageElement.innerHTML = `
        <span class="username">${username}</span>
        <span class="text">${text}</span>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// استقبال الرسائل السابقة (عند الدخول)
socket.on("previous messages", (messages) => {
    messages.forEach((m) => addMessage(m.username, m.text));
});

// عدد المستخدمين المتصلين
socket.on("user count", (count) => {
    userCountElement.textContent = count;
});

// إشعارات الكتابة
messageInput.addEventListener("input", () => {
    if (messageInput.value.trim() !== "") {
        socket.emit("typing", usernameInput.value);
    } else {
        socket.emit("stop typing");
    }
});

socket.on("typing", (username) => {
    typingIndicator.style.display = "flex";
    typingText.textContent = username + " يكتب ...";
});

socket.on("stop typing", () => {
    typingIndicator.style.display = "none";
});
