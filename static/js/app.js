document.getElementById("searchForm").onsubmit = async (e) => {
    e.preventDefault();

    const button = e.target.querySelector("button");
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "⏳ 思考中...";

    const question = document.getElementById("question").value;
    const response = await fetch(`/query?question=` + encodeURIComponent(question));

    if (!response.ok) {
        document.getElementById("stream").innerHTML = "<p>❌ 查詢失敗，請稍後再試。</p>";
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
        document.getElementById("stream").innerHTML = result;
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
    console.log("✅ app.js 載入成功");

    const loginForm = document.getElementById("loginForm");
    if (!loginForm) {
        console.error("❌ 找不到 loginForm");
        return;
    }

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log("🚀 登入表單已提交");

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(`伺服器回應錯誤：${response.status}`);
            }

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                throw new Error("❌ 無法解析 JSON 回應：" + jsonError.message);
            }

            console.log("🔁 後端回應：", result);

            if (result.success) {
                alert("✅ 登入成功：" + result.message);
            } else {
                alert("❌ 登入失敗：" + result.message);
            }
        } catch (error) {
            console.error("❗ 登入錯誤：", error);
            alert("⚠️ 登入時發生錯誤：" + error.message);
        }
    });
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
