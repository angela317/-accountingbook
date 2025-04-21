const apiUrl = "https://script.google.com/macros/s/AKfycbz7DeELWoSnQNwJcxJBYFbwYq4mAxHjuf6eiQL9s-n_KE3fRTsQkx3R9bgiyUx2HOps/exec";

const form = document.getElementById("recordForm");
const recordsContainer = document.getElementById("records");
const monthFilter = document.getElementById("monthFilter");
const totalDisplay = document.getElementById("totalDisplay");

let allData = [];
let chart;

window.addEventListener("load", async () => {
  await loadRecords();
  renderChart();

  document.getElementById("showRecordsBtn").addEventListener("click", () => {
    document.getElementById("recordSection").style.display = "block";
    document.getElementById("chartSection").style.display = "none";
    document.getElementById("showRecordsBtn").classList.add("active");
    document.getElementById("showChartBtn").classList.remove("active");
  });

  document.getElementById("showChartBtn").addEventListener("click", () => {
    document.getElementById("recordSection").style.display = "none";
    document.getElementById("chartSection").style.display = "block";
    document.getElementById("showChartBtn").classList.add("active");
    document.getElementById("showRecordsBtn").classList.remove("active");
  });
});

async function loadRecords() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    allData = data.slice(1);
    renderFilteredRecords();
  } catch (error) {
    console.error("讀取紀錄時發生錯誤：", error);
  }
}

function renderFilteredRecords() {
  const selectedMonth = monthFilter.value;
  recordsContainer.innerHTML = "";
  let total = 0;
  const categoryTotals = {};

  allData.forEach((row, index) => {
    const [date, category, amount, note] = row;
    if (!date || !amount) return;
    const rowMonth = new Date(date).toISOString().slice(0, 7);
    if (selectedMonth && selectedMonth !== rowMonth) return;

    total += Number(amount);
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(amount);

    const recordElement = document.createElement("div");
    recordElement.classList.add("record");
    recordElement.innerHTML = `
      <p><strong>日期：</strong>${date}</p>
      <p><strong>類別：</strong>${category}</p>
      <p><strong>金額：</strong>${amount}</p>
      <p><strong>備註：</strong>${note}</p>
      <div style="text-align: right;">
        <button class="delete-btn" data-index="${index + 2}">刪除</button>
      </div>
    `;
    recordsContainer.appendChild(recordElement);
  });

  totalDisplay.textContent = `本月總支出：$${total}`;

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const index = this.getAttribute("data-index");
      const confirmed = confirm("確定要刪除這筆紀錄嗎？");
      if (!confirmed) return;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify({
          action: "delete",
          rowIndex: Number(index),
        }),
        headers: { "Content-Type": "application/json" },
      });

      const resultText = await response.text();
      if (resultText.includes("刪除成功")) {
        await loadRecords();
      } else {
        alert("刪除失敗，請再試一次！");
        await loadRecords();
      }
    });
  });

  renderChart(categoryTotals);
}

function renderChart(data = {}) {
  const ctx = document.getElementById("chart").getContext("2d");
  if (chart) chart.destroy();

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

monthFilter.addEventListener("change", renderFilteredRecords);
