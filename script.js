const apiUrl = "https://script.google.com/macros/s/AKfycbxXJv0vtGWO-aeJAEk_aafQt24s4hrvOSeE-Y8DkjAFCjNh7BCP8VfoLPLnsZs3-CPT/exec"; // 請替換為你自己的 API 網址

const form = document.getElementById("recordForm");
const recordsContainer = document.getElementById("records");

// 讀取 Google Sheets 的記帳紀錄並顯示
async function loadRecords() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        recordsContainer.innerHTML = ""; // 清空紀錄區

        for (let i = 1; i < data.length; i++) { // 跳過標題列
            const [date, category, amount, note] = data[i];

            const recordElement = document.createElement("div");
            recordElement.classList.add("record");

            recordElement.innerHTML = `
                <p><strong>日期：</strong>${date}</p>
                <p><strong>類別：</strong>${category}</p>
                <p><strong>金額：</strong>${amount}</p>
                <p><strong>備註：</strong>${note}</p>
                <div style="text-align: right;">
                  <button class="delete-btn" data-index="${i}">刪除</button>
                </div>
            `;

            recordsContainer.appendChild(recordElement);
        }

        // 加入刪除事件
        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", async function () {
                const index = this.getAttribute("data-index");
                const confirmed = confirm("確定要刪除這筆紀錄嗎？");
                if (!confirmed) return;

                await fetch(apiUrl, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "delete",
                        rowIndex: Number(index),
                    }),
                    headers: { "Content-Type": "application/json" },
                });

                loadRecords(); // 重新載入
            });
        });

    } catch (error) {
        console.error("讀取紀錄時發生錯誤：", error);
    }
}

// 新增記帳資料
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const note = document.getElementById("note").value;

    const newRecord = {
        action: "add",
        date,
        category,
        amount,
        note,
    };

    await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify(newRecord),
        headers: { "Content-Type": "application/json" },
        mode: "no-cors" // 為了避免瀏覽器的 CORS 問題
    });

    form.reset();
    alert("新增成功！（請稍等片刻）");

    // 避免資料尚未寫入就刷新
    setTimeout(loadRecords, 2000);
});

// 網頁載入時讀取紀錄
window.addEventListener("load", loadRecords);
