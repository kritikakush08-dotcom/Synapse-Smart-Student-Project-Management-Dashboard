const $ = (id) => document.getElementById(id);

async function api(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }
    return data;
}

function notify(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove("show"), 3500);
}

function showResult(id, value) {
    $(id).textContent = typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);
}

function showError(id, error) {
    showResult(id, "Error: " + error.message);
    notify(error.message);
}

const chartLayout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#cbd5e1", family: "Inter, Arial" },
    margin: { t: 25, r: 20, b: 55, l: 45 },
    xaxis: { gridcolor: "#273047" },
    yaxis: { gridcolor: "#273047" },
    autosize: true
};

const chartConfig = {
    responsive: true,
    displaylogo: false
};

async function drawDashboardChart() {
    const data = await api("/api/chart?type=bar");

    Plotly.newPlot("dashboard-chart", [{
        x: data.labels,
        y: data.values,
        type: "bar",
        marker: {
            color: ["#a78bfa", "#67e8f9", "#818cf8", "#c084fc"],
            line: { width: 0 }
        },
        hovertemplate: "%{x}: %{y}<extra></extra>"
    }], {
        ...chartLayout,
        showlegend: false,
        yaxis: { ...chartLayout.yaxis, title: "Marks", range: [0, 100] }
    }, chartConfig);
}

async function loadSummary() {
    try {
        const data = await api("/api/summary");
        $("avg").textContent = data.average;
        $("high").textContent = data.highest;
        $("low").textContent = data.lowest;
        $("count").textContent = data.count;
        await drawDashboardChart();
    } catch (error) {
        notify("Could not load dashboard: " + error.message);
    }
}

function navigate(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle("active", section.id === page);
    });

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    const titles = {
        dashboard: "Intelligence Dashboard",
        python: "Python Fundamentals Lab",
        analytics: "Data Analytics Studio",
        visuals: "Visualization Studio",
        oop: "OOP Explorer",
        gui: "Tkinter Desktop Lab"
    };

    $("page-title").textContent = titles[page] || "Synapse AI";
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (page === "visuals") renderChart();
    if (page === "analytics") loadEmployees();
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.go));
});

$("calculate-btn").addEventListener("click", async () => {
    try {
        const n = Number($("n-value").value);
        const r = Number($("r-value").value);

        if (!Number.isInteger(n) || !Number.isInteger(r)) {
            throw new Error("Enter whole numbers.");
        }

        const data = await api("/api/combinatorics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ n, r })
        });

        showResult("comb-result",
            `Permutations P(${n}, ${r}) = ${data.permutations}\n` +
            `Combinations C(${n}, ${r}) = ${data.combinations}`
        );
    } catch (error) {
        showError("comb-result", error);
    }
});

$("prime-btn").addEventListener("click", async () => {
    try {
        const limit = Number($("prime-limit").value);
        const data = await api(`/api/twin-primes?limit=${encodeURIComponent(limit)}`);
        showResult("prime-result",
            `Twin prime pairs below ${limit}:\n\n` +
            data.pairs.map(pair => `${pair[0]}, ${pair[1]}`).join("\n") +
            `\n\nTotal pairs: ${data.pairs.length}`
        );
    } catch (error) {
        showError("prime-result", error);
    }
});

$("list-btn").addEventListener("click", async () => {
    try {
        const raw = $("list-values").value.trim();
        if (!raw) throw new Error("Enter at least one number.");

        const values = raw.split(",").map(x => {
            if (!x.trim()) throw new Error("Check your comma-separated list.");
            const number = Number(x.trim());
            if (!Number.isFinite(number)) throw new Error("All values must be numbers.");
            return number;
        });

        const data = await api("/api/list-lab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ values })
        });

        showResult("list-result", data);
    } catch (error) {
        showError("list-result", error);
    }
});

async function loadEmployees() {
    try {
        const data = await api("/api/employees");

        $("employee-summary").innerHTML = `
            <article class="stat-card">
                <span>SALES AVERAGE</span>
                <strong>${data.sales_average.toLocaleString()}</strong>
                <small>After filling missing salary</small>
            </article>
            <article class="stat-card">
                <span>SALARY MEDIAN</span>
                <strong>${data.salary_median.toLocaleString()}</strong>
                <small>Calculated by Pandas</small>
            </article>
            <article class="stat-card">
                <span>TOTAL RECORDS</span>
                <strong>${data.row_count}</strong>
                <small>Sample employees</small>
            </article>
        `;

        $("employee-table").replaceChildren();

        data.records.forEach(employee => {
            const row = document.createElement("tr");
            [employee.Name, employee.Department, employee.Salary].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";
                row.appendChild(cell);
            });
            $("employee-table").appendChild(row);
        });
    } catch (error) {
        notify("Employee analysis failed: " + error.message);
    }
}

$("employee-btn").addEventListener("click", loadEmployees);

async function renderChart() {
    try {
        const type = $("chart-type").value;
        const data = await api(`/api/chart?type=${encodeURIComponent(type)}`);

        let trace;

        if (type === "pie") {
            trace = {
                labels: data.labels,
                values: data.values,
                type: "pie",
                hole: 0.35,
                textinfo: "label+percent"
            };
        } else if (type === "scatter") {
            trace = {
                x: data.labels,
                y: data.values,
                type: "scatter",
                mode: "markers",
                marker: { size: 11, color: "#67e8f9" }
            };
        } else if (type === "histogram") {
            trace = {
                x: data.values,
                type: "histogram",
                marker: { color: "#a78bfa" }
            };
        } else {
            trace = {
                x: data.labels,
                y: data.values,
                type,
                mode: type === "line" ? "lines+markers" : undefined,
                marker: { color: "#a78bfa" }
            };
        }

        Plotly.newPlot("studio-chart", [trace], {
            ...chartLayout,
            title: { text: `${type[0].toUpperCase() + type.slice(1)} chart`, font: { size: 16 } },
            yaxis: { ...chartLayout.yaxis, title: "Value" }
        }, chartConfig);
    } catch (error) {
        notify("Chart error: " + error.message);
    }
}

$("render-chart-btn").addEventListener("click", renderChart);
$("chart-type").addEventListener("change", renderChart);

$("csv-form").addEventListener("submit", async event => {
    event.preventDefault();

    try {
        const file = $("csv-file").files[0];
        if (!file) throw new Error("Select a CSV file.");

        const form = new FormData();
        form.append("file", file);

        const data = await api("/api/upload-csv", {
            method: "POST",
            body: form
        });

        showResult("csv-summary", {
            total_rows: data.rows,
            columns: data.columns,
            missing_values: data.missing_values,
            numeric_summary: data.numeric_summary
        });

        const table = $("csv-table");
        table.replaceChildren();

        const headers = document.createElement("tr");
        data.columns.forEach(column => {
            const th = document.createElement("th");
            th.textContent = column;
            headers.appendChild(th);
        });

        const thead = document.createElement("thead");
        thead.appendChild(headers);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        data.records.forEach(record => {
            const row = document.createElement("tr");
            data.columns.forEach(column => {
                const cell = document.createElement("td");
                cell.textContent = record[column] ?? "—";
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        notify("Dataset analysed successfully.");
    } catch (error) {
        showError("csv-summary", error);
    }
});

async function renderSquareChart() {
    const x = [];
    const y = [];

    for (let i = -10; i <= 10; i++) {
        x.push(i);
        y.push(i * i);
    }

    await Plotly.newPlot("square-chart", [{
        x, y, type: "scatter", mode: "lines",
        line: { color: "#67e8f9", width: 3 },
        name: "y = x²"
    }], {
        ...chartLayout,
        title: { text: "y = x²" },
        xaxis: { ...chartLayout.xaxis, title: "x" },
        yaxis: { ...chartLayout.yaxis, title: "y" }
    }, chartConfig);
}

$("render-chart-btn").addEventListener("click", () => {
    $("studio-chart").scrollIntoView({ behavior: "smooth", block: "start" });
});

loadSummary();
renderSquareChart();
