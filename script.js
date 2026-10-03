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

  const money = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };


  const hours = (value) => {
    return `${Number(value).toFixed(2)} h`;
  };


  const getNumber = (selector) => {
    const element = document.querySelector(selector);

    if (!element) {
      return null;
    }

    const value = parseFloat(element.value);

    return Number.isFinite(value) ? value : null;
  };


  const showError = (message) => {
    resultCard.classList.remove("hidden");

    resultType.textContent = "Check your information";
    resultTotal.textContent = "";
    resultDetails.innerHTML = `
      <div>${message}</div>
    `;

    resultCard.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  };


  const showResult = (type, total, details) => {
    resultCard.classList.remove("hidden");

    resultType.textContent = type;
    resultTotal.textContent = money(total);

    resultDetails.innerHTML = details
      .map(detail => `<div>${detail}</div>`)
      .join("");

    resultCard.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  };


  const hideResult = () => {
    resultCard.classList.add("hidden");
  };


  /* ======================================
     MODE NAVIGATION
     ====================================== */

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {

      const selectedMode = button.dataset.mode;

      modeButtons.forEach((item) => {
        item.classList.toggle(
          "active",
          item === button
        );
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

      if (!activeMode) {
        return;
      }

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

    showResult(
      "Regular Pay",
      total,
      [
        `Hourly Rate · ${money(rate)}`,
        `Hours Worked · ${hours(workedHours)}`
      ]
    );
  }


  /* ======================================
     2. OVERTIME
     ====================================== */

  let overtimeMultiplier = 1.5;

  const overtimeOptions = document.querySelectorAll(".rate-option");
  const customRateContainer = document.querySelector(".custom-rate");

  overtimeOptions.forEach((option) => {

    option.addEventListener("click", () => {

      overtimeOptions.forEach((item) => {
        item.classList.remove("active");
      });

      option.classList.add("active");

      const value = option.textContent.trim();

      if (value === "Custom") {

        customRateContainer.classList.remove("hidden");

      } else {

        customRateContainer.classList.add("hidden");

        overtimeMultiplier = parseFloat(
          value.replace("×", "")
        );
      }
    });

  });


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

    const customOption = document.querySelector(
      ".rate-option.active"
    );

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
        showError("Please enter a valid overtime multiplier.");
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
      regularPay +
      overtimePay;

    showResult(
      "Total Pay",
      totalPay,
      [
        `Regular Pay · ${money(regularPay)}`,
        `Overtime Pay · ${money(overtimePay)}`,
        `Overtime Rate · ${overtimeMultiplier.toFixed(2)}×`
      ]
    );
  }


  /* ======================================
     3. HOURS WORKED
     ====================================== */

  function calculateHoursWorked() {

    const start = document.querySelector("#start-time").value;
    const end = document.querySelector("#end-time").value;

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
      showError("End time must be after start time.");
      return;
    }

    const totalMinutes =
      endMinutes - startMinutes;

    const totalBeforeBreak =
      totalMinutes / 60;

    const breakHours =
      breakValue === null ? 0 : breakValue;

    if (breakHours < 0) {
      showError("Break cannot be negative.");
      return;
    }

    if (breakHours > totalBeforeBreak) {
      showError("Break cannot exceed the hours worked.");
      return;
    }

    const totalHours =
      totalBeforeBreak - breakHours;

    showResult(
      "Total Hours",
      0,
      [
        `Worked Time · ${hours(totalHours)}`,
        `Start · ${formatTime(start)}`,
        `End · ${formatTime(end)}`,
        `Break · ${hours(breakHours)}`
      ]
    );

    resultTotal.textContent =
      hours(totalHours);

    resultType.textContent =
      "Hours Worked";

    resultCard.dataset.calculatedHours =
      totalHours.toString();

    addUseHoursButton(totalHours);
  }


  function formatTime(value) {

    const [hour, minute] =
      value.split(":").map(Number);

    const date =
      new Date();

    date.setHours(hour, minute, 0, 0);

    return new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit"
      }
    ).format(date);
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
     4. WEEKLY
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

      if (index === 0) {

        weeklyQuick.classList.remove("hidden");
        weeklyByDay.classList.add("hidden");

      } else {

        weeklyQuick.classList.add("hidden");
        weeklyByDay.classList.remove("hidden");
      }

    });

  });


  function calculateWeekly() {

    const rate =
      getNumber("#weekly-rate");

    const otRate =
      getNumber("#weekly-ot-rate");

    if (rate === null) {
      showError("Please enter your hourly rate.");
      return;
    }

    if (otRate === null || otRate <= 0) {
      showError("Please enter a valid overtime rate.");
      return;
    }

    const byDay =
      !weeklyByDay.classList.contains("hidden");

    let totalHours = 0;

    if (byDay) {

      const dayInputs =
        weeklyByDay.querySelectorAll("input");

      dayInputs.forEach((input) => {

        const value =
          parseFloat(input.value);

        if (Number.isFinite(value) && value >= 0) {
          totalHours += value;
        }

      });

    } else {

      const enteredHours =
        getNumber("#weekly-total-hours");

      if (enteredHours === null) {
        showError("Please enter your total hours.");
        return;
      }

      totalHours = enteredHours;
    }

    if (totalHours < 0) {
      showError("Hours cannot be negative.");
      return;
    }

    const regularHours =
      Math.min(totalHours, 40);

    const overtimeHours =
      Math.max(totalHours - 40, 0);

    const regularPay =
      regularHours * rate;

    const overtimePay =
      overtimeHours * rate * otRate;

    const totalPay =
      regularPay + overtimePay;

    showResult(
      "Weekly Pay",
      totalPay,
      [
        `Regular Pay · ${money(regularPay)}`,
        `Overtime Pay · ${money(overtimePay)}`,
        `Total Hours · ${hours(totalHours)}`,
        `Overtime · ${hours(overtimeHours)}`
      ]
    );
  }


  /* ======================================
     5. BIWEEKLY
     ====================================== */

  const biweeklyTypeOptions =
    document.querySelectorAll(
      "#biweekly-mode .type-option"
    );

  biweeklyTypeOptions.forEach((option, index) => {

    option.addEventListener("click", () => {

      biweeklyTypeOptions.forEach((item) => {
        item.classList.remove("active");
      });

      option.classList.add("active");

    });

  });


  function calculateBiweekly() {

    const rate =
      getNumber("#biweekly-rate");

    const otRate =
      getNumber("#biweekly-ot-rate");

    const weekOne =
      getNumber("#week-one-hours");

    const weekTwo =
      getNumber("#week-two-hours");

    if (rate === null) {
      showError("Please enter your hourly rate.");
      return;
    }

    if (otRate === null || otRate <= 0) {
      showError("Please enter a valid overtime rate.");
      return;
    }

    if (weekOne === null) {
      showError("Please enter Week 1 hours.");
      return;
    }

    if (weekTwo === null) {
      showError("Please enter Week 2 hours.");
      return;
    }

    if (
      rate < 0 ||
      weekOne < 0 ||
      weekTwo < 0
    ) {
      showError("Values cannot be negative.");
      return;
    }

    const weekOneRegular =
      Math.min(weekOne, 40);

    const weekOneOvertime =
      Math.max(weekOne - 40, 0);

    const weekTwoRegular =
      Math.min(weekTwo, 40);

    const weekTwoOvertime =
      Math.max(weekTwo - 40, 0);

    const weekOneRegularPay =
      weekOneRegular * rate;

    const weekOneOvertimePay =
      weekOneOvertime *
      rate *
      otRate;

    const weekTwoRegularPay =
      weekTwoRegular * rate;

    const weekTwoOvertimePay =
      weekTwoOvertime *
      rate *
      otRate;

    const totalPay =
      weekOneRegularPay +
      weekOneOvertimePay +
      weekTwoRegularPay +
      weekTwoOvertimePay;

    showResult(
      "Biweekly Pay",
      totalPay,
      [
        `Week 1 · ${money(
          weekOneRegularPay +
          weekOneOvertimePay
        )}`,
        `Week 1 Overtime · ${hours(weekOneOvertime)}`,
        `Week 2 · ${money(
          weekTwoRegularPay +
          weekTwoOvertimePay
        )}`,
        `Week 2 Overtime · ${hours(weekTwoOvertime)}`,
        `Total Hours · ${hours(weekOne + weekTwo)}`
      ]
    );
  }


  /* ======================================
     EDIT CALCULATION
     ====================================== */

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

});
