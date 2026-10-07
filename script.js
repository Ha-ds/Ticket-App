// ---------- STATE ----------

const state = {
  origin: "",
  destination: "",
  date: "",
  hour: "00:00",
  passengers: "1 Adult",
  train: null,
  seat: null,
};

const SAMPLE_TRAINS = [
  { id: "FR 9421", depart: "07:12", arrive: "09:48", duration: "2h 36m", cls: "Standard", price: 24 },
  { id: "IC 5310", depart: "08:05", arrive: "11:02", duration: "2h 57m", cls: "Standard", price: 19 },
  { id: "FR 9427", depart: "10:40", arrive: "13:15", duration: "2h 35m", cls: "Business", price: 39 },
  { id: "IC 5316", depart: "13:20", arrive: "16:24", duration: "3h 04m", cls: "Standard", price: 21 },
  { id: "FR 9433", depart: "17:55", arrive: "20:31", duration: "2h 36m", cls: "Business", price: 42 },
];

const TAKEN_SEATS = new Set(["1B", "2A", "3C", "5D", "7A"]);

// ---------- STEP NAVIGATION ----------

function goToStep(stepNumber) {
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === String(stepNumber));
  });

  document.querySelectorAll(".step").forEach((step) => {
    const n = Number(step.dataset.step);
    step.classList.toggle("is-active", n === stepNumber);
    step.classList.toggle("is-done", n < stepNumber);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => goToStep(Number(btn.dataset.back)));
});

// ---------- STEP 1: SEARCH ----------

document.getElementById("swap-stations").addEventListener("click", () => {
  const originSel = document.getElementById("origin");
  const destSel = document.getElementById("destination");
  const tmp = originSel.value;
  originSel.value = destSel.value;
  destSel.value = tmp;
});

document.querySelectorAll(".search-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".search-tabs .tab").forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
  });
});

document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();

  state.origin = document.getElementById("origin").value;
  state.destination = document.getElementById("destination").value;
  state.date = document.getElementById("depart-date").value;
  state.hour = document.getElementById("depart-hour").value;
  state.passengers = document.getElementById("passengers").value;

  if (!state.origin || !state.destination || !state.date) return;

  document.getElementById("route-heading").textContent = `${state.origin} → ${state.destination}`;
  document.getElementById("route-sub").textContent = `${formatDate(state.date)} · ${state.passengers}`;

  renderTrainResults();
  goToStep(2);
});

function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// ---------- STEP 2: RESULTS ----------

function renderTrainResults() {
  const list = document.getElementById("ticket-list");
  list.innerHTML = "";

  SAMPLE_TRAINS.forEach((train) => {
    const row = document.createElement("div");
    row.className = "ticket-row";
    row.innerHTML = `
      <div class="ticket-times">
        <span>${train.depart}</span>
        <span class="dash"></span>
        <span>${train.arrive}</span>
      </div>
      <div class="ticket-meta">${train.id} · ${train.duration} · ${train.cls}</div>
      <div class="ticket-price">$${train.price}<span>per seat</span></div>
    `;
    row.addEventListener("click", () => {
      state.train = train;
      document.getElementById("chosen-train-sub").textContent = `${train.id} · ${train.cls} class · departs ${train.depart}`;
      renderSeatGrid();
      goToStep(3);
    });
    list.appendChild(row);
  });
}

// ---------- STEP 3: SEATS ----------

function renderSeatGrid() {
  const grid = document.getElementById("seat-grid");
  grid.innerHTML = "";
  state.seat = null;
  updateSeatSummary();

  const rows = 6;
  const cols = ["A", "B", "C", "gap", "D"];

  for (let r = 1; r <= rows; r++) {
    cols.forEach((col) => {
      if (col === "gap") {
        const spacer = document.createElement("div");
        spacer.className = "seat aisle-gap";
        grid.appendChild(spacer);
        return;
      }
      const seatId = `${r}${col}`;
      const btn = document.createElement("button");
      btn.className = "seat";
      btn.type = "button";
      btn.textContent = seatId;

      if (TAKEN_SEATS.has(seatId)) {
        btn.classList.add("is-taken");
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => selectSeat(seatId, btn));
      }
      grid.appendChild(btn);
    });
  }
}

function selectSeat(seatId, btn) {
  document.querySelectorAll(".seat.is-selected").forEach((s) => s.classList.remove("is-selected"));
  btn.classList.add("is-selected");
  state.seat = seatId;
  updateSeatSummary();
}

function updateSeatSummary() {
  const summary = document.getElementById("seat-summary");
  const continueBtn = document.getElementById("to-passenger-btn");
  if (state.seat) {
    summary.textContent = `Seat ${state.seat} selected`;
    continueBtn.disabled = false;
  } else {
    summary.textContent = "No seat selected yet";
    continueBtn.disabled = true;
  }
}

document.getElementById("to-passenger-btn").addEventListener("click", () => {
  if (state.seat) goToStep(4);
});

// ---------- STEP 4: PASSENGER ----------

document.getElementById("passenger-form").addEventListener("submit", (e) => {
  e.preventDefault();
  state.fullName = document.getElementById("full-name").value.trim();
  state.email = document.getElementById("email").value.trim();
  if (!state.fullName || !state.email) return;

  renderPaymentSummary();
  goToStep(5);
});

// ---------- STEP 5: PAYMENT / CONFIRMATION ----------

function renderPaymentSummary() {
  const route = `${state.origin} → ${state.destination}`;
  const dateLabel = `${formatDate(state.date)}, ${state.hour}`;
  const trainLabel = `${state.train.id} · ${state.train.cls}`;
  const total = `$${state.train.price}`;

  document.getElementById("stub-route").textContent = route;
  document.getElementById("stub-date").textContent = dateLabel;
  document.getElementById("stub-train").textContent = trainLabel;
  document.getElementById("stub-seat").textContent = state.seat;
  document.getElementById("stub-total").textContent = total;
}

document.getElementById("payment-form").addEventListener("submit", (e) => {
  e.preventDefault();

  document.getElementById("payment-view").hidden = true;
  document.getElementById("payment-back-btn").hidden = true;
  document.getElementById("payment-title").textContent = "Booking confirmed";
  document.getElementById("payment-sub").textContent = "Thanks for booking with us.";

  document.getElementById("confirm-email").textContent = state.email;
  document.getElementById("final-stub").innerHTML = document.getElementById("summary-stub").innerHTML;

  const confirmation = document.getElementById("confirmation-view");
  confirmation.hidden = false;
});

document.getElementById("restart-btn").addEventListener("click", () => {
  location.reload();
});

// ---------- INIT ----------

(function setMinDate() {
  const dateInput = document.getElementById("depart-date");
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
  dateInput.value = today;
})();
