/* =============================
   DEPARTMENT WEBHOOKS
   ============================= */
const WEBHOOKS = {
    mechanic: "hhttps://discord.com/api/webhooks/988647331161337866/iPzuk6weWc_2lNhacFZFkaOf1YXAyTStw8JVB7r6dRy5ySrS79he2ybWIeag1ANia8Yf",
    tow: "https://discord.com/api/webhooks/1448101821804445886/HAOQ986Ft1L_nUkZSVb5EzcHWP70Mua-eq9zG-lMkkRJ8hIe-cF1d9ipJyNuHwQzDMDT",
    wrap: "https://discord.com/api/webhooks/1352505544086257726/6ciYzmeYjnsJr6u0EWLzifgixKFTEyb0xn9DSt0PUL1aoTTi4kJkFYrrieeDr2Ui-SbZ",
    inspection: "hhttps://discord.com/api/webhooks/1449655850233761904/lg6D3LTqRsU9LmXL_cjQEM6_agiQ96f7op8DVlWU_MeNeNklhCGe0oELkssFtDSMfPCp"
};

/* =============================
   LOAD PARTS FROM items.json
   ============================= */
let partsData = [];

fetch("items.json")
    .then(res => res.json())
    .then(data => {
        partsData = data;
        populatePartsDropdown();
    })
    .catch(err => {
        console.error("Error loading items.json:", err);
        document.getElementById("partsDropdown").innerHTML =
            "<option>Error loading items</option>";
    });

function populatePartsDropdown() {
    const dropdown = document.getElementById("partsDropdown");
    dropdown.innerHTML = '<option value="">Select part...</option>';

    partsData.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name} - $${p.price.toFixed(2)}`;
        dropdown.appendChild(opt);
    });
}

/* =============================
   PARTS HANDLING
   ============================= */
const partsUsed = [];
const partsTableBody = document.querySelector("#partsTable tbody");
const subtotalEl = document.getElementById("partsSubtotal");

document.getElementById("addPartBtn").addEventListener("click", () => {
    const dropdown = document.getElementById("partsDropdown");
    const qty = parseInt(document.getElementById("partQty").value) || 1;
    if (!dropdown.value) return;

    const part = partsData.find(p => p.id === dropdown.value);
    const lineTotal = part.price * qty;

    partsUsed.push({
        name: part.name,
        price: part.price,
        qty,
        lineTotal
    });

    renderParts();
});

function renderParts() {
    partsTableBody.innerHTML = "";
    let subtotal = 0;

    partsUsed.forEach((p, i) => {
        subtotal += p.lineTotal;
        partsTableBody.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td>${p.qty}</td>
                <td>$${p.lineTotal.toFixed(2)}</td>
                <td><button onclick="removePart(${i})">X</button></td>
            </tr>
        `;
    });

    subtotalEl.textContent = subtotal.toFixed(2);
}

function removePart(index) {
    partsUsed.splice(index, 1);
    renderParts();
}

/* =============================
   FORM SUBMISSION
   ============================= */
document.getElementById("serviceForm").addEventListener("submit", async e => {
    e.preventDefault();

    const department = document.getElementById("department").value;
    const webhookUrl = WEBHOOKS[department];

    if (!webhookUrl) {
        showMessage("Please select a department.", "error");
        return;
    }

    const payload = {
        embeds: [{
            title: "Vehicle Service Report",
            color: 3447003,
            fields: [
                { name: "Department", value: department.toUpperCase() },
                { name: "Date", value: date.value },
                { name: "Time", value: time.value },
                { name: "Vehicle", value: vehicle.value },
                { name: "Plate #", value: plate.value },
                { name: "Job Type", value: jobType.value },
                { name: "Work Performed", value: workPerformed.value },
                {
                    name: "Parts Used",
                    value: partsUsed.length
                        ? partsUsed.map(p => `${p.name} x${p.qty} — $${p.lineTotal.toFixed(2)}`).join("\n")
                        : "None"
                },
                { name: "Total Charged", value: `$${Number(totalCharged.value).toFixed(2)}` },
                { name: "Customer", value: customer.value },
                { name: "Location", value: location.value || "N/A" },
                { name: "Notes", value: notes.value || "None" }
            ]
        }]
    };

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Webhook error");

        showMessage("Report submitted successfully!", "success");
        e.target.reset();
        partsUsed.length = 0;
        renderParts();
    } catch (err) {
        console.error(err);
        showMessage("Failed to submit report.", "error");
    }
});

function showMessage(text, type) {
    const msg = document.getElementById("message");
    msg.textContent = text;
    msg.className = `message ${type}`;
}
