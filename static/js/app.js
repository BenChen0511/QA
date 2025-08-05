document.getElementById("searchForm").onsubmit = async (e) => {
    e.preventDefault();

    const button = e.target.querySelector("button");
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "⏳ 思考中...";

    const question = document.getElementById("question").value;
    const response = await fetch(`/query?question=` + encodeURIComponent(question));

    if (!response.ok) {
        let errorMessage = "❌ 查詢失敗，請稍後再試。";

        // 根據錯誤碼顯示不同訊息
        switch (response.status) {
            case 500:
                errorMessage = "⚠️ 系統錯誤500可能是記憶體不足或模型錯誤。";
                break;
            case 404:
                errorMessage = "❌ 找不到資源404。";
                break;
            case 403:
                errorMessage = "🚫 權限不足403。";
                break;
            case 400:
                errorMessage = "⚠️ 錯誤的請求400請檢查輸入內容。";
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
};

document.getElementById("searchQuestionForm").onsubmit = async (e) => {
    e.preventDefault();

    const button = e.target.querySelector("button");
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "⏳ 查找中...";

    const keyword = document.getElementById("searchQuestion").value;
    const response = await fetch(`/search?keyword=` + encodeURIComponent(keyword));

    if (!response.ok) {
        document.getElementById("searchResults").innerHTML = "<p>❌ 查找失敗，請稍後再試。</p>";
        button.disabled = false;
        button.innerHTML = originalText;
        return;
    }

    const results = await response.json();

    // 顯示結果列表
    const container = document.getElementById("searchResults");
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
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`${errorText}`);
            }
            else {
                alert("✅ 登入成功：" + username);

                const html = await response.text();
                document.getElementById("authSection").innerHTML = html;

                // 關閉登入 modal
                const loginModal = document.getElementById("staticBackdrop");
                const modalInstance = bootstrap.Modal.getInstance(loginModal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        }
        catch (error) {
            alert("⚠️ 登入時發生錯誤：" + error);
        }
    });
});

document.addEventListener("click", async function (e) {
    if (e.target && e.target.id === "logoutBtn") {
        const response = await fetch("/api/logout");
        const html = await response.text();
        document.getElementById("authSection").innerHTML = html;
    }
});

function showTab(tabName) {
    let titleText = "";
    switch (tabName) {
        case "query":
            titleText = "查詢問答";
            break;
        case "upload":
            titleText = "檔案上傳";
            break;
        case "search":
            titleText = "問題查找";
            break;
        default:
            titleText = "Q&A查詢系統";
    }

    document.getElementById("mainContentTitle").innerText = titleText;

    document.getElementById("queryTab").style.display = tabName === "query" ? "block" : "none";
    document.getElementById("uploadTab").style.display = tabName === "upload" ? "block" : "none";
    document.getElementById("searchTab").style.display = tabName === "search" ? "block" : "none";

    const items = document.querySelectorAll(".dropdown-item");
    items.forEach(item => {
        item.classList.remove("active", "bg-secondary", "text-white");
    });

    const activeItem = document.querySelector(`.dropdown-item[onclick="showTab('${tabName}')"]`);
    if (activeItem) {
        activeItem.classList.add("active", "bg-secondary", "text-white");
    }
}
