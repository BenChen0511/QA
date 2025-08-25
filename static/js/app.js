document.getElementById("searchForm").onsubmit = async (e) => {
    e.preventDefault();
    hideFeedbackButtons();
    const button = e.target.querySelector("button");
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "⏳ 思考中...";

    const question = document.getElementById("question").value;
    const response = await fetch(`/search?question=` + encodeURIComponent(question));

    if (!response.ok) {
        let errorMessage = "查詢失敗，請稍後再試...";

        // 根據錯誤碼顯示不同訊息
        switch (response.status) {
            case 500:
                errorMessage = "系統錯誤500可能是記憶體不足或模型錯誤。";
                break;
            case 404:
                errorMessage = "找不到資源404。";
                break;
            case 403:
                errorMessage = "權限不足403。";
                break;
            case 400:
                errorMessage = "錯誤的請求400請檢查輸入內容。";
                break;
        }

        alert(errorMessage);
        document.getElementById("stream").innerHTML = `<p>${errorMessage}</p>`;
        button.disabled = false;
        button.innerHTML = originalText;
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = "";

    document.getElementById("stream").innerHTML = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        document.getElementById("stream").innerHTML = result.replace(/\n/g, "<br>");
    }

    button.disabled = false;
    button.innerHTML = originalText;
    document.getElementById("feedbackButtons").style.display = "flex";
    document.getElementById("feedbackButtons").classList.add("d-flex");
};

document.getElementById("queryQuestionForm").onsubmit = async (e) => {
    e.preventDefault();

    const button = e.target.querySelector("button");
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "⏳ 查找中...";

    const keyword = document.getElementById("queryQuestion").value;
    const response = await fetch(`/query?keyword=` + encodeURIComponent(keyword));

    if (!response.ok) {
        document.getElementById("queryResults").innerHTML = "<p>查找失敗，請稍後再試。</p>";
        button.disabled = false;
        button.innerHTML = originalText;
        return;
    }

    const results = await response.json();

    // 顯示結果列表
    const container = document.getElementById("queryResults");
    container.innerHTML = "";

    if (results.length === 0) {
        container.innerHTML = "<p>🔍 沒有找到相關問題。</p>";
    } else {
        const ul = document.createElement("ul");
        ul.classList.add("list-group");

        results.forEach(item => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "bg-dark", "text-light", "border-secondary");

            const question = typeof item.data?.question === "string" ? item.data.question : JSON.stringify(item.data.question);
            const answer = typeof item.data?.answer === "string" ? item.data.answer : JSON.stringify(item.data.answer);

            li.innerHTML = `
                <div><strong>問題：</strong> ${question}</div>
                <div><strong>答案：</strong> ${answer}</div>
                <div class="text-muted"><small>相似度：${item.score.toFixed(3)}</small></div>
            `;

            ul.appendChild(li);
        });

        container.appendChild(ul);
    }
    button.disabled = false;
    button.innerHTML = originalText;
};

document.addEventListener("DOMContentLoaded", function () {
    const likeBtn = document.getElementById("likeBtn");
    const dislikeBtn = document.getElementById("dislikeBtn");
    if (likeBtn && dislikeBtn) {
        likeBtn.addEventListener("click", async function () {
            await sendFeedback("like");
            alert("感謝您的回饋，我們會持續改進！");
            hideFeedbackButtons();
        });

        dislikeBtn.addEventListener("click", async function () {
            await sendFeedback("dislike");
            alert("感謝您的回饋，我們會持續改進！");
            hideFeedbackButtons();
        });
    }


    // 登入表單事件
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const username = document.getElementById("username")?.value ?? "";
            const password = document.getElementById("password")?.value ?? "";

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                    credentials: "same-origin"
                });

                if (response.ok || response.redirected || response.status === 303) {
                    // 可選：先關閉登入視窗
                    const modalEl = document.getElementById("staticBackdrop");
                    if (modalEl && window.bootstrap) {
                        (window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl)).hide();
                    }
                    // 整頁跳轉，讓模板依 session 重渲染
                    window.location.replace("/");
                } else {
                    const t = await response.text().catch(() => "");
                    alert(t || "登入失敗");
                }
            } catch (err) {
                alert("登入時發生錯誤：" + err);
            }
        });
    }
});

document.addEventListener("click", async function (e) {
    const target = e.target;
    if (target && target.id === "logoutBtn") {
        try {
            await fetch("/api/logout", {
                method: "GET",
                credentials: "same-origin",
                redirect: "manual"
            });
        } finally {
            window.location.replace("/"); // 無論如何刷新頁面
        }
    }
});

function showTab(tabName) {
    let titleText = "";
    switch (tabName) {
        case "search":
            titleText = "查詢問答";
            break;
        case "upload":
            titleText = "檔案上傳";
            break;
        case "query":
            titleText = "問題查找";
            break;
        default:
            titleText = "Q&A查詢系統";
    }
    const titleEl = document.getElementById("mainContentTitle");
    if (titleEl) titleEl.innerText = titleText;

    // 防呆：元素可能不存在（非 admin 沒有 uploadTab）
    const searchTab = document.getElementById("searchTab");
    const uploadTab = document.getElementById("uploadTab");
    const queryTab = document.getElementById("queryTab");

    if (searchTab) searchTab.style.display = tabName === "search" ? "block" : "none";
    if (uploadTab) uploadTab.style.display = tabName === "upload" ? "block" : "none";
    if (queryTab) queryTab.style.display = tabName === "query" ? "block" : "none";

    const items = document.querySelectorAll(".dropdown-item");
    items.forEach(item => item.classList.remove("active", "bg-secondary", "text-white"));

    const activeItem = document.querySelector(`.dropdown-item[onclick="showTab('${tabName}')"]`);
    if (activeItem) activeItem.classList.add("active", "bg-secondary", "text-white");
}

function hideFeedbackButtons() {
    const feedbackDiv = document.getElementById("feedbackButtons");
    feedbackDiv.style.display = "none";
    feedbackDiv.classList.remove("d-flex");
}

async function uploadFile() {
    const input = document.getElementById("fileInput");
    const file = input.files[0];
    if (!file) {
        alert("請選擇檔案！");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("http://localhost:8000/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.detail || "上傳失敗！");
        } else {
            alert(result.message || "上傳並建立資料庫完成！");
        }

    } catch (error) {
        console.error("上傳失敗", error);
        alert("上傳失敗！");
    }
}

async function sendFeedback(type) {
    try {
        const response = await fetch("/api/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: document.getElementById("question").value,
                answer: document.getElementById("stream").innerText,
                feedback: type
            })
        });

        if (!response.ok) {
            console.error("回饋送出失敗", await response.text());
        }
    } catch (error) {
        console.error("回饋送出錯誤", error);
    }
}

function sendLogoutBeacon() {
    if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/logout-beacon");
    } else {
        // 後援：在卸載時送 keepalive 請求
        fetch("/api/logout-beacon", { method: "POST", keepalive: true, credentials: "same-origin" }).catch(() => { });
    }
}

// 分頁被隱藏/關閉/跳離網站時清除 session
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendLogoutBeacon();
});
window.addEventListener("pagehide", () => {
    sendLogoutBeacon();
});

window.addEventListener("load", () => {
    fetch("/api/logout-beacon", { method: "POST", keepalive: true, credentials: "same-origin" }).catch(() => { });
});

