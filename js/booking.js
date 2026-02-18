// ====== תפיסת אלמנטים ======
const seatMap = document.getElementById("seatMap");
const seatSection = document.getElementById("seatSection");
const locationSelect = document.getElementById("location");
const daySelect = document.getElementById("day");
const timeSelect = document.getElementById("time");
const preSeatPlaceHolder = document.getElementById("preSeatPlaceHolder");
const selectionInfo = document.getElementById("selectionInfo");
const selectedList = document.getElementById("selectedList");
const totalPriceEl = document.getElementById("totalPrice");
const goSummaryBtn = document.getElementById("goSummary");
const summarySection = document.getElementById("summarySection");
const showSeatsBtn = document.getElementById("showSeatsBtn");

// ====== הגדרות ======
const ROWS = 8;
const COLS = 10;

const PRICES = {
  regular: 40,
  vip: 60
};

// ====== מצב פתיחת מפת מושבים ======
var isSeatMapOpen = false;


var DEFAULT_TAKEN_SEATS = ["A1", "A2", "B5", "B6", "E5", "E6", "G9", "G8"];
var TAKEN_SEATS = DEFAULT_TAKEN_SEATS.slice();

// בחירה: Map seatId -> { type, price }
const selectedSeats = new Map(); // אוסף שמחזיק "מפתח - ערך," כאשר המפתח הוא מזהה המושב והערך הוא אובייקט עם סוג ומחיר

// ====== עזר ======
function seatId(rowIndex, colIndex) {
  const rowLetter = String.fromCharCode("A".charCodeAt(0) + rowIndex);
  return `${rowLetter}${colIndex + 1}`;
}

// שתי שורות ראשונות VIP, השאר רגיל
function seatType(rowIndex) {
  return rowIndex < 2 ? "vip" : "regular";
}

function getShowKey() {
  return locationSelect.value + "__" +
         daySelect.value + "__" +
         timeSelect.value;
}

function loadTakenSeatsForShow() {
  const key = getShowKey();
  const raw = localStorage.getItem("takenSeats::" + key);
  if (raw)
  {
    return JSON.parse(raw); //“JSON משמש להמרת נתונים מורכבים לטקסט כדי לשמור אותם ב־localStorage, ולהפוך אותם חזרה לנתונים בשימוש.”
  }
  else
  {
    return [];
  }
}

//// שומר את רשימת המושבים התפוסים עבור הקרנה מסוימת ב-localStorage
function saveTakenSeatsForShow(takenSeatsArray) {
  const key = getShowKey();
  localStorage.setItem(
    "takenSeats::" + key,
    JSON.stringify(takenSeatsArray)
  );
}

function mergeUnique(arr1, arr2) {
  var result = arr1.slice(); // עותק של arr1
  for (var i = 0; i < arr2.length; i++) {
    if (result.indexOf(arr2[i]) === -1) {
      result.push(arr2[i]);
    }
  }
  return result;
}

function canShowSeatMap() {
  return locationSelect.value && daySelect.value && timeSelect.value;
}

function canGoToSummary() {
  return canShowSeatMap() && selectedSeats.size > 0;
}

function updateSeatSectionVisibility() {
  var ready = canShowSeatMap();

  // הכפתור פעיל רק אחרי שבחרו הכל
  showSeatsBtn.disabled = !ready;

  // אם לא בחרו מיקום/יום/שעה — אין מפה
  if (!ready) {
    isSeatMapOpen = false;
    selectedSeats.clear();
    renderSummaryBox();
  }

  // placeholder מוצג אם:
  // לא ready או שהמפה לא נפתחה עדיין
  var showPlaceholder = (!ready || !isSeatMapOpen);

  preSeatPlaceHolder.hidden = !showPlaceholder;
  seatSection.hidden = showPlaceholder;
  summarySection.hidden = showPlaceholder;

  // רק אם באמת מציגים את המפה — נטען ונצייר
  if (!showPlaceholder) {
    var savedTaken = loadTakenSeatsForShow();
    TAKEN_SEATS = mergeUnique(DEFAULT_TAKEN_SEATS, savedTaken);

    renderSeatMap();
    renderSummaryBox();
    goSummaryBtn.disabled = !canGoToSummary();
  }
}


function renderSeatMap() {
  // 1) ניקוי ה-SVG
  seatMap.innerHTML = "";

  // 2) מידות ה-viewBox (חייב להתאים ל-HTML שלך: viewBox="0 0 620 520")
  var VB_W = 620;
  var VB_H = 520;

  // 3) הגדרות מושבים
  var seatSize = 40;
  var gap = 8;

  // 4) חישוב גודל גריד בפועל
  var gridW = COLS * seatSize + (COLS - 1) * gap;
  var gridH = ROWS * seatSize + (ROWS - 1) * gap;

  // 5) מרווחים למעלה/למטה כדי להשאיר מקום ל"מסך"
  var topPadding = 70;
  var bottomPadding = 20;

  // 6) חישוב נקודת התחלה שממרכזת את הגריד
  var startX = (VB_W - gridW) / 2;
  if (startX < 20) startX = 20; // שלא ייצא צמוד מדי לשוליים

  var availableH = VB_H - topPadding - bottomPadding;
  var startY = topPadding + (availableH - gridH) / 2;
  if (startY < topPadding) startY = topPadding;

  // 7) ציור המסך (ממורכז)
  var screenW = VB_W - 80;
  if (screenW > 380) screenW = 380;

  var screenX = (VB_W - screenW) / 2;

  var screen = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  screen.setAttribute("x", screenX);
  screen.setAttribute("y", 10);
  screen.setAttribute("width", screenW);
  screen.setAttribute("height", 30);
  screen.setAttribute("rx", 10);
  screen.setAttribute("fill", "#eee");
  seatMap.appendChild(screen);

  var screenText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  screenText.setAttribute("x", screenX + screenW / 2);
  screenText.setAttribute("y", 32);
  screenText.setAttribute("text-anchor", "middle");
  screenText.setAttribute("font-size", 14);
  screenText.textContent = "מסך";
  seatMap.appendChild(screenText);

  // 8) ציור המושבים בלולאות
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var id = seatId(r, c);
      var type = seatType(r);

      var x = startX + c * (seatSize + gap);
      var y = startY + r * (seatSize + gap);

      var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", seatSize);
      rect.setAttribute("height", seatSize);
      rect.setAttribute("rx", 10);
      rect.setAttribute("data-seat", id);
      rect.classList.add("seat", type);

      // מושב תפוס (TAKEN_SEATS הוא מערך אצלך)
      if (TAKEN_SEATS.indexOf(id) !== -1) {
        rect.classList.add("taken");
      }

      // מושב נבחר (selectedSeats הוא Map)
      if (selectedSeats.has(id)) {
        rect.classList.add("selected");
      }

      seatMap.appendChild(rect);

      // טקסט של מזהה המושב
      var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x + seatSize / 2);
      label.setAttribute("y", y + seatSize / 2 + 5);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", 11);
      label.textContent = id;
      seatMap.appendChild(label);
    }
  }
}


// ====== קליק על מושב ======
seatMap.addEventListener("click", (e) => {
  const target = e.target;
  if (!target.classList || !target.classList.contains("seat")) return;

  const id = target.getAttribute("data-seat");
  if (!id) return;

  if (target.classList.contains("taken")) return;

  if (selectedSeats.has(id)) {
    selectedSeats.delete(id);
    target.classList.remove("selected");
  } else {
    const type = target.classList.contains("vip") ? "vip" : "regular";
    selectedSeats.set(id, { type, price: PRICES[type] });
    target.classList.add("selected");
  }

  renderSummaryBox();
});

showSeatsBtn.addEventListener("click", () => {
  isSeatMapOpen = true;
  updateSeatSectionVisibility();
});

function onShowChange() {
  // סוגרים את מפת המושבים
  isSeatMapOpen = false;

  // מעדכנים תצוגה
  updateSeatSectionVisibility();
}

locationSelect.addEventListener("change", onShowChange);
daySelect.addEventListener("change", onShowChange);
timeSelect.addEventListener("change", onShowChange);

// ====== סיכום בחירה ======
function renderSummaryBox() {
  selectedList.innerHTML = "";

  if (selectedSeats.size === 0) {
    selectionInfo.textContent = "עוד לא נבחרו מושבים.";
    totalPriceEl.textContent = "0 ₪";
    goSummaryBtn.disabled = true;
    return;
  }

  selectionInfo.textContent = "נבחרו " + selectedSeats.size + " מושבים:";

  const sorted = Array.from(selectedSeats.entries()).sort((a, b) => a[0].localeCompare(b[0], "he"));

  let total = 0;
  for (const [id, info] of sorted) {
    total += info.price;
    const li = document.createElement("li");
    li.textContent = `${id} — ${info.type === "vip" ? "VIP" : "רגיל"} — ${info.price} ₪`;
    selectedList.appendChild(li);
  }

  totalPriceEl.textContent = `${total} ₪`;
  goSummaryBtn.disabled = !canGoToSummary();
}


// ====== מעבר לסיכום ======
goSummaryBtn.addEventListener("click", () => {

  // 1. המושבים שנבחרו עכשיו
  const seatsArr = Array.from(selectedSeats.entries()).map(([id, info]) => ({
    id,
    type: info.type,
    price: info.price
  }));

  // 2. חישוב סה״כ
  const total = seatsArr.reduce((sum, s) => sum + s.price, 0);

  // 3. בניית אובייקט הזמנה (כמו שהיה לך)
  const order = {
    movieTitle: "מלך האריות",
    location: locationSelect.value,
    day: daySelect.value,
    time: timeSelect.value,
    seats: seatsArr,
    total
  };

  // 4. שמירת ההזמנה (כמו שהיה לך)
  localStorage.setItem("order", JSON.stringify(order));
  const takenArr = loadTakenSeatsForShow();
  for (var i = 0; i < seatsArr.length; i++) {
    if (takenArr.indexOf(seatsArr[i].id) === -1) {
      takenArr.push(seatsArr[i].id);
    }
  }

saveTakenSeatsForShow(takenArr);

  // 8. מעבר לעמוד סיכום
  window.location.href = "summary.html";
});


// ====== התחלה ======
renderSeatMap();
renderSummaryBox();
updateSeatSectionVisibility();
