function formatLocation(loc) {
  const map = {
    "haifa": "חיפה",
    "tel aviv": "תל אביב",
    "netanya": "נתניה",
    "jerusalem": "ירושלים",
    "beersheba": "באר שבע",
    "nahariya": "נהריה"
  };
  return map[loc] || loc || "";
}

function formatDate(isoDate) {
  // "2026-01-02" => "02/01/2026"
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function renderOrder() {
  const raw = localStorage.getItem("order");
  if (!raw) {
    document.getElementById("orderBox").innerHTML =
      `<p style="color:#ffd9d9">לא נמצאה הזמנה. חזור לעמוד הבחירה ובחר מושבים.</p>`;
    return;
  }

  let order;
  try {
    order = JSON.parse(raw);
  } catch (e) {
    document.getElementById("orderBox").innerHTML =
      `<p style="color:#ffd9d9">שגיאה בקריאת ההזמנה.</p>`;
    return;
  }

  document.getElementById("movieTitle").textContent = order.movieTitle || "—";
  document.getElementById("location").textContent = formatLocation(order.location);
  document.getElementById("day").textContent = formatDate(order.day);
  document.getElementById("time").textContent = order.time || "—";
  document.getElementById("totalPrice").textContent = `${order.total || 0} ₪`;

  const seatsList = document.getElementById("seatsList");
  seatsList.innerHTML = "";

  if (!order.seats || order.seats.length === 0) {
    const li = document.createElement("li");
    li.textContent = "לא נבחרו מושבים.";
    seatsList.appendChild(li);
    return;
  }

  // מיון נוח
  const sorted = [...order.seats].sort((a, b) => (a.id || "").localeCompare(b.id || "", "he"));

  for (const s of sorted) {
    const li = document.createElement("li");
    const typeLabel = (s.type === "vip") ? "VIP" : "רגיל";
    li.textContent = `${s.id} — ${typeLabel} — ${s.price} ₪`;
    seatsList.appendChild(li);
  }
}
renderOrder();
