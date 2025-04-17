const apiUrl = "https://script.google.com/macros/s/AKfycbxXJv0vtGWO-aeJAEk_aafQt24s4hrvOSeE-Y8DkjAFCjNh7BCP8VfoLPLnsZs3-CPT/exec";

const form = document.getElementById("recordForm");
const recordsContainer = document.getElementById("records");
const monthFilter = document.getElementById("monthFilter");
const totalDisplay = document.getElementById("totalDisplay");

let allData = [];

let chart; // Chart.js 圖表實例

// 🟡 初始化頁面
window.addEventListener("load", async () => {
    await loadRecords();
    renderChart(); // 初始空白圖表
});

// 🟦 載入資料
async function loadRecords() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        allData = data.slice(1); // 去掉標題列
        renderFilteredRecords();
    } catch (error) {
        console.error("讀取紀錄時發生錯誤：", error);
    }
}

// 🟩 根據篩選顯示紀錄
function renderFilteredRecords() {
    const selectedMonth = monthFilter.value; // yyyy-MM
    recordsContainer.innerHTML = "";
    let total = 0;
    const categoryTotals = {};

    allData.forEach((row, index) => {
        const [date, category, amount, note] = row;
        if (!date || !amount) return;

        const rowMonth = new Date(date).toISOString().slice(0, 7);
        if (selectedMonth && selectedMonth !== rowMonth) return;

        // 加總
        total += Number(amount);
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(amount);

        // 建立紀錄元素
        const recordElement = document.createElement("div");
        recordElement.classList.add("record");

        recordElement.innerHTML = `
            <p><strong>日期：</strong>${date}</p>
            <p><strong>類別：</strong>${category}</p>
            <p><strong>金額：</strong>${amount}</p>
            <p><strong>備註：</strong>${note}</p>
            <div style="text-align: right;">
              <button class="delete-btn" data-index="${index + 1}">刪除</button>
            </div>
        `;
        recordsContainer.appendChild(recordElement);
    });

    // 顯示總金額
    totalDisplay.textContent = `本月總支出：$${total}`;

    // 刪除功能
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

            await loadRecords();
        });
    });

    // 更新圖表
    renderChart(categoryTotals);
}

// 🟨 渲染圓餅圖
function renderChart(data = {}) {
    const ctx = document.getElementById("chart").getContext("2d");

    if (chart) chart.destroy(); // 先銷毀舊圖

    chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: "各類別支出",
                data: Object.values(data),
                backgroundColor: [
                    "#3a7ca5", "#f4c542", "#96d82a", "#ff9f80", "#ffcb77", "#a2d2ff"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" },
                title: { display: true, text: "支出比例圖" }
            }
        }
    });
}

// 🟪 新增紀錄
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
        mode: "no-cors"
    });

    form.reset();
    alert("新增成功！（請稍等片刻）");

    setTimeout(loadRecords, 2000);
});

// 🟫 篩選變動時重新渲染
monthFilter.addEventListener("change", renderFilteredRecords);
