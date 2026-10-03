/* ========================================
   PAYVANTA — APPLICATION LOGIC
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* ======================================
     ELEMENTS
     ====================================== */

  const modeButtons = document.querySelectorAll(".mode-button");
  const calculatorModes = document.querySelectorAll(".calculator-mode");

  const resultCard = document.querySelector(".result-card");
  const resultTotal = document.querySelector(".result-total");
  const resultType = document.querySelector(".result-type");
  const resultDetails = document.querySelector(".result-details");
  const editButton = document.querySelector(".edit-button");


  /* ======================================
     HELPERS
     ====================================== */

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);


  const hours = (value) =>
    `${Number(value).toFixed(2)} h`;


  const getNumber = (selector) => {
    const element = document.querySelector(selector);

    if (!element) return null;

    const value = parseFloat(element.value);

    return Number.isFinite(value) ? value : null;
  };


  const showError = (message) => {
    resultCard.classList.remove("hidden");

    resultType.textContent = "Check your information";
    resultTotal.textContent = "";
    resultDetails.innerHTML = `<div>${message}</div>`;

    resultCard.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  };


  const showResult = (type, total, details, isHours = false) => {
    resultCard.classList.remove("hidden");

    resultType.textContent = type;

    resultTotal.textContent = isHours
      ? hours(total)
      : money(total);

    resultDetails.innerHTML = details
      .map((detail) => `<div>${detail}</div>`)
      .join("");

    resultCard.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  };


  const hideResult = () => {
    resultCard.classList.add("hidden");
  };


  const formatTime = (value) => {
    const [hour, minute] = value.split(":").map(Number);

    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  };


  /* ======================================
     MAIN MODE NAVIGATION
     ====================================== */

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedMode = button.dataset.mode;

      modeButtons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      calculatorModes.forEach((mode) => {
        mode.classList.toggle(
          "active",
          mode.id === `${selectedMode}-mode`
        );
      });

      hideResult();
    });
  });


  /* ======================================
     CALCULATE BUTTONS
     ====================================== */

  document.querySelectorAll(".calculate-button").forEach((button) => {
    button.addEventListener("click", () => {
      const activeMode = document.querySelector(
        ".calculator-mode.active"
      );

      if (!activeMode) return;

      const mode = activeMode.id.replace("-mode", "");

      switch (mode) {
        case "pay":
          calculateRegularPay();
          break;

        case "overtime":
          calculateOvertime();
          break;

        case "hours":
          calculateHoursWorked();
          break;

        case "weekly":
          calculateWeekly();
          break;

        case "biweekly":
          calculateBiweekly();
          break;
      }
    });
  });


  /* ======================================
     1. REGULAR PAY
     ====================================== */

  function calculateRegularPay() {
    const rate = getNumber("#pay-hourly-rate");
    const workedHours = getNumber("#pay-hours");

    if (rate === null) {
      showError("Please enter your hourly rate.");
      return;
    }

    if (workedHours === null) {
      showError("Please enter valid hours.");
      return;
    }

    if (rate < 0 || workedHours < 0) {
      showError("Values cannot be negative.");
      return;
    }

    const total = rate * workedHours;

    showResult("Regular Pay", total, [
      `Hourly Rate · ${money(rate)}`,
      `Hours Worked · ${hours(workedHours)}`
    ]);
  }


  /* ======================================
     2. OVERTIME
     ====================================== */

  let overtimeMultiplier = 1.5;

  const overtimeOptions =
    document.querySelectorAll(".rate-option");

  const customRateContainer =
    document.querySelector(".custom-rate");


  overtimeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      overtimeOptions.forEach((item) => {
        item.classList.remove("active");
      });

      option.classList.add("active");

      const value = option.textContent.trim();

      if (value === "Custom") {
        if (customRateContainer) {
          customRateContainer.classList.remove("hidden");
        }
      } else {
        if (customRateContainer) {
          customRateContainer.classList.add("hidden");
        }

        overtimeMultiplier =
          parseFloat(value.replace("×", ""));
      }
    });
  });


  function getOvertimeMultiplier(selector) {
    const options = document.querySelectorAll(selector);

    let active = null;

    options.forEach((option) => {
      if (option.classList.contains("active")) {
        active = option;
      }
    });

    if (!active) return 1.5;

    const text = active.textContent.trim();

    if (text === "Custom") {
      const custom = getNumber("#custom-multiplier");

      if (custom === null || custom <= 0) {
        return null;
      }

      return custom;
    }

    const multiplier = parseFloat(
      text.replace("×", "")
    );

    return Number.isFinite(multiplier)
      ? multiplier
      : 1.5;
  }


  function calculateOvertime() {
    const rate = getNumber("#ot-hourly-rate");
    const regularHours = getNumber("#ot-regular-hours");
    const overtimeHours = getNumber("#ot-hours");

    if (rate === null) {
      showError("Please enter your hourly rate.");
      return;
    }

    if (regularHours === null) {
      showError("Please enter valid regular hours.");
      return;
    }

    if (overtimeHours === null) {
      showError("Please enter valid overtime hours.");
      return;
    }

    if (
      rate < 0 ||
      regularHours < 0 ||
      overtimeHours < 0
    ) {
      showError("Values cannot be negative.");
      return;
    }

    const customOption =
      document.querySelector(".rate-option.active");

    if (
      customOption &&
      customOption.textContent.trim() === "Custom"
    ) {
      const customMultiplier =
        getNumber("#custom-multiplier");

      if (
        customMultiplier === null ||
        customMultiplier <= 0
      ) {
        showError(
          "Please enter a valid overtime multiplier."
        );
        return;
      }

      overtimeMultiplier = customMultiplier;
    }

    const regularPay =
      rate * regularHours;

    const overtimePay =
      rate *
      overtimeHours *
      overtimeMultiplier;

    const totalPay =
      regularPay + overtimePay;

    showResult("Total Pay", totalPay, [
      `Regular Pay · ${money(regularPay)}`,
      `Overtime Pay · ${money(overtimePay)}`,
      `Overtime Rate · ${overtimeMultiplier.toFixed(2)}×`
    ]);
  }


  /* ======================================
     3. HOURS WORKED
     ====================================== */

  function calculateHoursWorked() {
    const startElement =
      document.querySelector("#start-time");

    const endElement =
      document.querySelector("#end-time");

    const start =
      startElement ? startElement.value : "";

    const end =
      endElement ? endElement.value : "";

    const breakValue =
      getNumber("#break-hours");

    if (!start) {
      showError("Please enter a start time.");
      return;
    }

    if (!end) {
      showError("Please enter an end time.");
      return;
    }

    const [startHour, startMinute] =
      start.split(":").map(Number);

    const [endHour, endMinute] =
      end.split(":").map(Number);

    const startMinutes =
      startHour * 60 + startMinute;

    const endMinutes =
      endHour * 60 + endMinute;

    if (endMinutes <= startMinutes) {
      showError(
        "End time must be after start time."
      );
      return;
    }

    const totalBeforeBreak =
      (endMinutes - startMinutes) / 60;

    const breakHours =
      breakValue === null
        ? 0
        : breakValue;

    if (breakHours < 0) {
      showError("Break cannot be negative.");
      return;
    }

    if (breakHours > totalBeforeBreak) {
      showError(
        "Break cannot exceed the hours worked."
      );
      return;
    }

    const totalHours =
      totalBeforeBreak - breakHours;

    showResult(
      "Hours Worked",
      totalHours,
      [
        `Start · ${formatTime(start)}`,
        `End · ${formatTime(end)}`,
        `Break · ${hours(breakHours)}`
      ],
      true
    );

    resultCard.dataset.calculatedHours =
      totalHours.toString();

    addUseHoursButton(totalHours);
  }


  function addUseHoursButton(totalHours) {
    let button =
      document.querySelector(".use-hours-button");

    if (!button) {
      button =
        document.createElement("button");

      button.className =
        "edit-button use-hours-button";

      resultCard.appendChild(button);
    }

    button.textContent =
      "Use these hours →";

    button.onclick = () => {
      const weeklyButton =
        document.querySelector(
          '[data-mode="weekly"]'
        );

      if (weeklyButton) {
        weeklyButton.click();
      }

      const weeklyHours =
        document.querySelector(
          "#weekly-total-hours"
        );

      if (weeklyHours) {
        weeklyHours.value =
          totalHours.toFixed(2);
      }

      hideResult();
    };
  }


  /* ======================================
     WEEKLY TYPE SWITCH
     ====================================== */

  const weeklyTypeOptions =
    document.querySelectorAll(
      "#weekly-mode .type-option"
    );

  const weeklyQuick =
    document.querySelector(".weekly-quick");

  const weeklyByDay =
    document.querySelector(".weekly-by-day");


  weeklyTypeOptions.forEach((option, index) => {
    option.addEventListener("click", () => {
      weeklyTypeOptions.forEach((item) => {
        item.classList.remove("active");
      });

      option.classList.add("active");

      const isQuick = index === 0;

      if (weeklyQuick) {
        weeklyQuick.classList.toggle(
          "hidden",
          !isQuick
        );
      }

      if (weeklyByDay) {
        weeklyByDay.classList.toggle(
          "hidden",
          isQuick
        );
      }

      hideResult();
    });
  });


  /* ======================================
     WEEKLY CALCULATION
     ====================================== */

  function calculateWeekly() {
    const rate =
      getNumber("#weekly-rate");

    const otRate =
      getNumber("#weekly-ot-rate");

    if (rate === null) {
      showError("Please enter your hourly rate.");
      return;
    }

    if (rate < 0) {
      showError("Values cannot be negative.");
      return;
    }

    if (
      otRate === null ||
      otRate <= 0
    ) {
      showError(
        "Please enter a valid overtime rate."
      );
      return;
    }

    const isByDay =
      weeklyByDay &&
      !weeklyByDay.classList.contains("hidden");

    let totalHours = 0;
    let overtimeHours = 0;

    /* ---------- BY DAY ---------- */

    if (isByDay) {
      const inputs =
        weeklyByDay.querySelectorAll("input");

      inputs.forEach((input) => {
        const value = parseFloat(input.value);

        if (Number.isFinite(value)) {
          if (value < 0) {
            throw new Error("negative");
          }

          totalHours += value;
        }
      });

      overtimeHours =
        Math.max(totalHours - 40, 0);
    }

    /* ---------- QUICK ---------- */

    else {
      const total =
        getNumber("#weekly-total-hours");

      const enteredOT =
        getNumber("#weekly-ot-hours");

      if (total === null) {
        showError(
          "Please enter your total hours."
        );
        return;
      }

      if (enteredOT === null) {
        showError(
          "Please enter your overtime hours."
        );
        return;
      }

      if (
        total < 0 ||
        enteredOT < 0
      ) {
        showError(
          "Values cannot be negative."
        );
        return;
      }

      if (enteredOT > total) {
        showError(
          "Overtime hours cannot exceed total hours."
        );
        return;
      }

      totalHours = total;
      overtimeHours = enteredOT;
    }

    const regularHours =
      Math.max(totalHours - overtimeHours, 0);

    const regularPay =
      regularHours * rate;

    const overtimePay =
      overtimeHours * rate * otRate;

    const totalPay =
      regularPay + overtimePay;

    showResult("Weekly Pay", totalPay, [
      `Regular Pay · ${money(regularPay)}`,
      `Overtime Pay · ${money(overtimePay)}`,
      `Total Hours · ${hours(totalHours)}`,
      `Overtime · ${hours(overtimeHours)}`
    ]);
  }


  /* ======================================
     BIWEEKLY TYPE SWITCH
     ====================================== */

  const biweeklyTypeOptions =
    document.querySelectorAll(
      "#biweekly-mode .type-option"
    );

  const biweeklyQuick =
    document.querySelector(".biweekly-quick");

  const biweeklyByDay =
    document.querySelector(".biweekly-by-day");


  biweeklyTypeOptions.forEach((option, index) => {
    option.addEventListener("click", () => {
      biweeklyTypeOptions.forEach((item) => {
        item.classList.remove("active");
      });

      option.classList.add("active");

      const isQuick = index === 0;

      if (biweeklyQuick) {
        biweeklyQuick.classList.toggle(
          "hidden",
          !isQuick
        );
      }

      if (biweeklyByDay) {
        biweeklyByDay.classList.toggle(
          "hidden",
          isQuick
        );
      }

      hideResult();
    });
  });


  /* ======================================
     BIWEEKLY CALCULATION
     ====================================== */

  function calculateBiweekly() {
    const rate =
      getNumber("#biweekly-rate");

    const otRate =
      getNumber("#biweekly-ot-rate");

    if (rate === null) {
      showError("Please enter your hourly rate.");
      return;
    }

    if (rate < 0) {
      showError("Values cannot be negative.");
      return;
    }

    if (
      otRate === null ||
      otRate <= 0
    ) {
      showError(
        "Please enter a valid overtime rate."
      );
      return;
    }

    const isByDay =
      biweeklyByDay &&
      !biweeklyByDay.classList.contains("hidden");

    /* ==================================
       BIWEEKLY BY DAY
       ================================== */

    if (isByDay) {
      calculateBiweeklyByDay(
        rate,
        otRate
      );

      return;
    }


    /* ==================================
       BIWEEKLY QUICK
       ================================== */

    const weekOne =
      getNumber("#week-one-hours");

    const weekTwo =
      getNumber("#week-two-hours");

    const weekOneOT =
      getNumber("#week-one-ot-hours");

    const weekTwoOT =
      getNumber("#week-two-ot-hours");


    if (weekOne === null) {
      showError(
        "Please enter Week 1 hours."
      );
      return;
    }

    if (weekTwo === null) {
      showError(
        "Please enter Week 2 hours."
      );
      return;
    }

    if (weekOneOT === null) {
      showError(
        "Please enter Week 1 overtime hours."
      );
      return;
    }

    if (weekTwoOT === null) {
      showError(
        "Please enter Week 2 overtime hours."
      );
      return;
    }

    if (
      weekOne < 0 ||
      weekTwo < 0 ||
      weekOneOT < 0 ||
      weekTwoOT < 0
    ) {
      showError(
        "Values cannot be negative."
      );
      return;
    }

    if (weekOneOT > weekOne) {
      showError(
        "Week 1 overtime cannot exceed total hours."
      );
      return;
    }

    if (weekTwoOT > weekTwo) {
      showError(
        "Week 2 overtime cannot exceed total hours."
      );
      return;
    }

    const weekOneRegular =
      Math.max(weekOne - weekOneOT, 0);

    const weekTwoRegular =
      Math.max(weekTwo - weekTwoOT, 0);

    const weekOneRegularPay =
      weekOneRegular * rate;

    const weekOneOvertimePay =
      weekOneOT * rate * otRate;

    const weekTwoRegularPay =
      weekTwoRegular * rate;

    const weekTwoOvertimePay =
      weekTwoOT * rate * otRate;

    const totalPay =
      weekOneRegularPay +
      weekOneOvertimePay +
      weekTwoRegularPay +
      weekTwoOvertimePay;

    showResult("Biweekly Pay", totalPay, [
      `Week 1 · ${money(
        weekOneRegularPay +
        weekOneOvertimePay
      )}`,
      `Week 1 Overtime · ${hours(weekOneOT)}`,
      `Week 2 · ${money(
        weekTwoRegularPay +
        weekTwoOvertimePay
      )}`,
      `Week 2 Overtime · ${hours(weekTwoOT)}`,
      `Total Hours · ${hours(
        weekOne + weekTwo
      )}`
    ]);
  }


  /* ======================================
     BIWEEKLY BY DAY
     ====================================== */

  function calculateBiweeklyByDay(
    rate,
    otRate
  ) {
    if (!biweeklyByDay) {
      showError(
        "Biweekly daily fields are unavailable."
      );
      return;
    }

    const inputs =
      biweeklyByDay.querySelectorAll("input");

    if (inputs.length === 0) {
      showError(
        "Please enter your daily hours."
      );
      return;
    }

    let weekOneHours = 0;
    let weekTwoHours = 0;

    inputs.forEach((input, index) => {
      const value = parseFloat(input.value);

      if (!Number.isFinite(value)) {
        return;
      }

      if (value < 0) {
        return;
      }

      if (index < 7) {
        weekOneHours += value;
      } else {
        weekTwoHours += value;
      }
    });

    const weekOneRegular =
      Math.min(weekOneHours, 40);

    const weekOneOT =
      Math.max(weekOneHours - 40, 0);

    const weekTwoRegular =
      Math.min(weekTwoHours, 40);

    const weekTwoOT =
      Math.max(weekTwoHours - 40, 0);

    const weekOnePay =
      (weekOneRegular * rate) +
      (weekOneOT * rate * otRate);

    const weekTwoPay =
      (weekTwoRegular * rate) +
      (weekTwoOT * rate * otRate);

    const totalPay =
      weekOnePay + weekTwoPay;

    showResult("Biweekly Pay", totalPay, [
      `Week 1 · ${money(weekOnePay)}`,
      `Week 1 Overtime · ${hours(weekOneOT)}`,
      `Week 2 · ${money(weekTwoPay)}`,
      `Week 2 Overtime · ${hours(weekTwoOT)}`,
      `Total Hours · ${hours(
        weekOneHours + weekTwoHours
      )}`
    ]);
  }


  /* ======================================
     EDIT CALCULATION
     ====================================== */

  if (editButton) {
    editButton.addEventListener("click", () => {
      resultCard.classList.add("hidden");

      const activeMode =
        document.querySelector(
          ".calculator-mode.active"
        );

      if (activeMode) {
        activeMode.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    });
  }

});
