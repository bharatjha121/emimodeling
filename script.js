// DOM Elements
const loanAmountInput = document.getElementById('loanAmount');
const loanAmountSlider = document.getElementById('loanAmountSlider');
const interestRateInput = document.getElementById('interestRate');
const interestRateSlider = document.getElementById('interestRateSlider');
const loanTenureInput = document.getElementById('loanTenure');
const loanTenureSlider = document.getElementById('loanTenureSlider');
const tenureType = document.getElementById('tenureType');
const resultsDiv = document.getElementById('results');
const scheduleSection = document.getElementById('scheduleSection');
const toggleScheduleBtn = document.getElementById('toggleSchedule');
const scheduleTable = document.getElementById('scheduleTable');
const scheduleBody = document.getElementById('scheduleBody');
const pieChart = document.getElementById('pieChart');
const chartLegend = document.getElementById('chartLegend');
const addPartPaymentBtn = document.getElementById('addPartPayment');
const partPaymentsList = document.getElementById('partPaymentsList');
const additionalMonthlyPaymentInput = document.getElementById('additionalMonthlyPayment');

// Part payments array
let partPayments = [];
let partPaymentIdCounter = 0;

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Update slider fill color
function updateSliderFill(slider) {
    const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #6366f1 ${value}%, #e1e8ed ${value}%)`;
}

// Sync slider with input
loanAmountSlider.addEventListener('input', (e) => {
    loanAmountInput.value = e.target.value;
    updateSliderFill(e.target);
    calculateEMI();
});

loanAmountInput.addEventListener('input', (e) => {
    const inputValue = e.target.value;

    // Allow empty input - don't force anything while typing
    if (inputValue === '') {
        // Keep slider at minimum when input is empty
        loanAmountSlider.value = 0;
        updateSliderFill(loanAmountSlider);
        calculateEMI();
        return;
    }

    const value = parseInt(inputValue);
    if (!isNaN(value) && value >= 0) {
        const clampedValue = Math.max(0, Math.min(10000000, value));
        loanAmountSlider.value = clampedValue;
        updateSliderFill(loanAmountSlider);
        // Only update input if value was clamped and input isn't empty
        if (value !== clampedValue && inputValue !== '') {
            e.target.value = clampedValue;
        }
    }
    calculateEMI();
});

loanAmountInput.addEventListener('blur', (e) => {
    const inputValue = e.target.value.trim();
    // If empty on blur, set to default 0
    let value = inputValue === '' ? 0 : parseInt(inputValue) || 0;
    value = Math.max(0, Math.min(10000000, value));
    loanAmountSlider.value = value;
    loanAmountInput.value = value;
    updateSliderFill(loanAmountSlider);
    calculateEMI();
});

interestRateSlider.addEventListener('input', (e) => {
    interestRateInput.value = e.target.value;
    updateSliderFill(e.target);
    calculateEMI();
});

interestRateInput.addEventListener('input', (e) => {
    const inputValue = e.target.value;

    if (inputValue === '') {
        interestRateSlider.value = 1;
        updateSliderFill(interestRateSlider);
        calculateEMI();
        return;
    }

    const value = parseFloat(inputValue);
    if (!isNaN(value) && value >= 0) {
        const clampedValue = Math.max(1, Math.min(30, value));
        interestRateSlider.value = clampedValue;
        updateSliderFill(interestRateSlider);
        if (value !== clampedValue && inputValue !== '') {
            e.target.value = clampedValue;
        }
    }
    calculateEMI();
});

interestRateInput.addEventListener('blur', (e) => {
    const inputValue = e.target.value.trim();
    let value = inputValue === '' ? 10 : parseFloat(inputValue) || 10;
    value = Math.max(1, Math.min(30, value));
    interestRateSlider.value = value;
    interestRateInput.value = value;
    updateSliderFill(interestRateSlider);
    calculateEMI();
});

loanTenureSlider.addEventListener('input', (e) => {
    loanTenureInput.value = e.target.value;
    updateSliderFill(e.target);
    calculateEMI();
});

loanTenureInput.addEventListener('input', (e) => {
    const inputValue = e.target.value;

    if (inputValue === '') {
        loanTenureSlider.value = 1;
        updateSliderFill(loanTenureSlider);
        calculateEMI();
        return;
    }

    const value = parseInt(inputValue);
    if (!isNaN(value) && value >= 0) {
        const clampedValue = Math.max(1, Math.min(30, value));
        loanTenureSlider.value = clampedValue;
        updateSliderFill(loanTenureSlider);
        if (value !== clampedValue && inputValue !== '') {
            e.target.value = clampedValue;
        }
    }
    calculateEMI();
});

loanTenureInput.addEventListener('blur', (e) => {
    const inputValue = e.target.value.trim();
    let value = inputValue === '' ? 5 : parseInt(e.target.value) || 5;
    value = Math.max(1, Math.min(30, value));
    loanTenureSlider.value = value;
    loanTenureInput.value = value;
    updateSliderFill(loanTenureSlider);
    calculateEMI();
});

tenureType.addEventListener('change', () => {
    calculateEMI();
});

// Calculate EMI
function calculateEMIValue(principal, rate, tenureMonths) {
    if (rate === 0) {
        return principal / tenureMonths;
    }

    const monthlyRate = rate / 100 / 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    return emi;
}

// Get part payments from form
function getPartPayments() {
    const payments = [];
    const inputs = partPaymentsList.querySelectorAll('.part-payment-item');

    inputs.forEach((item) => {
        const id = item.dataset.id;
        const amount = parseFloat(item.querySelector('.part-amount').value) || 0;
        const month = parseInt(item.querySelector('.part-month').value);
        const year = parseInt(item.querySelector('.part-year').value);
        const checkedRadio = item.querySelector('.prepayment-type:checked');
        const prepaymentType = checkedRadio ? checkedRadio.value : 'reduce_tenure';

        if (amount > 0 && month && year) {
            // Calculate month number from loan start (assuming loan starts from current month)
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;

            let monthNumber = 0;
            if (year > currentYear || (year === currentYear && month >= currentMonth)) {
                monthNumber = (year - currentYear) * 12 + (month - currentMonth) + 1;
            }

            if (monthNumber > 0) {
                payments.push({
                    id: id,
                    amount: amount,
                    month: monthNumber,
                    year: year,
                    monthName: month,
                    type: prepaymentType // 'reduce_tenure' or 'reduce_emi'
                });
            }
        }
    });

    // Sort by month number
    return payments.sort((a, b) => a.month - b.month);
}

// Generate year options (current year to current year + 30)
function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    let options = '';
    for (let i = 0; i <= 30; i++) {
        const year = currentYear + i;
        options += `<option value="${year}">${year}</option>`;
    }
    return options;
}

// Generate month options
function generateMonthOptions() {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    let options = '';
    months.forEach((month, index) => {
        options += `<option value="${index + 1}">${month}</option>`;
    });
    return options;
}

// Add part payment entry
function addPartPaymentEntry() {
    // Remove empty message if present
    const emptyMsg = partPaymentsList.querySelector('.empty-message');
    if (emptyMsg) {
        emptyMsg.remove();
    }

    const id = 'pp_' + partPaymentIdCounter++;
    const yearOptions = generateYearOptions();
    const monthOptions = generateMonthOptions();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const entryHTML = `
        <div class="part-payment-item" data-id="${id}">
            <div class="action-buttons">
                <button type="button" class="add-btn-icon" onclick="addPartPaymentEntry()" title="Add Payment">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <button type="button" class="delete-btn" onclick="removePartPayment('${id}')" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
            <div class="part-payment-field amount-field">
                <label>Amount (₹)</label>
                <input type="number" class="part-amount" placeholder="Enter amount" min="0" step="1000" value="">
            </div>
            <div class="part-payment-field">
                <label>Month</label>
                <select class="part-month">
                    ${monthOptions}
                </select>
            </div>
            <div class="part-payment-field">
                <label>Year</label>
                <select class="part-year">
                    ${yearOptions}
                </select>
            </div>
            <div class="part-payment-field radio-field">
                <label>Apply As</label>
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="prepayment-type-${id}" class="prepayment-type" value="reduce_tenure" checked>
                        <span>Reduce Tenure</span>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="prepayment-type-${id}" class="prepayment-type" value="reduce_emi">
                        <span>Reduce EMI</span>
                    </label>
                </div>
            </div>
        </div>
    `;

    partPaymentsList.insertAdjacentHTML('beforeend', entryHTML);

    // Set default to current month/year
    const newItem = partPaymentsList.querySelector(`[data-id="${id}"]`);
    newItem.querySelector('.part-month').value = currentMonth;
    newItem.querySelector('.part-year').value = currentYear;

    // Add event listeners
    newItem.querySelector('.part-amount').addEventListener('input', calculateEMI);
    newItem.querySelector('.part-month').addEventListener('change', calculateEMI);
    newItem.querySelector('.part-year').addEventListener('change', calculateEMI);
    // Add listeners for all radio buttons in this item
    newItem.querySelectorAll('.prepayment-type').forEach(radio => {
        radio.addEventListener('change', calculateEMI);
    });

    calculateEMI();
}

// Remove part payment entry
function removePartPayment(id) {
    const item = partPaymentsList.querySelector(`[data-id="${id}"]`);
    if (item) {
        item.remove();

        // Show empty message if no items left
        if (partPaymentsList.children.length === 0) {
            partPaymentsList.innerHTML = '<div class="empty-message">Click "Add Payment" to include part payments</div>';
        }

        calculateEMI();
    }
}

// Make removePartPayment available globally
window.removePartPayment = removePartPayment;

// Calculate amortization schedule with part payments
function calculateSchedule(principal, rate, tenureMonths, emi, partPayments = [], additionalMonthlyPayment = 0, additionalPaymentFrequency = 'monthly') {
    const schedule = [];
    let balance = principal;
    const monthlyRate = rate / 100 / 12;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let actualEmi = emi;
    let finalEmi = emi; // Track the final EMI being used

    // Create a map of prepayments by month with their types
    const prepaymentMap = {};
    partPayments.forEach(pp => {
        if (!prepaymentMap[pp.month]) {
            prepaymentMap[pp.month] = { amount: 0, type: pp.type };
        }
        prepaymentMap[pp.month].amount += pp.amount;
        // If multiple prepayments in same month, use the type of the last one
        prepaymentMap[pp.month].type = pp.type;
    });

    // Loop until balance is zero or tenure is reached
    // Allow loop to go one extra month to capture final fractional payments if needed, but usually balance <= 0 checks suffice
    for (let month = 1; month <= tenureMonths + 120 && balance > 0.1; month++) {
        const interestPayment = balance * monthlyRate;
        // Principal part of the regular EMI
        let principalPart = actualEmi - interestPayment;

        let prepaymentAmount = 0;
        let emiChanged = false;

        // Apply additional payment based on frequency
        let extraPayment = 0;
        const recurringPaymentAmount = Math.max(0, additionalMonthlyPayment);

        if (recurringPaymentAmount > 0) {
            if (additionalPaymentFrequency === 'monthly') {
                extraPayment = recurringPaymentAmount;
            } else if (additionalPaymentFrequency === 'yearly') {
                // Apply only every 12th month (Dec of each year relative to start)
                if (month % 12 === 0) {
                    extraPayment = recurringPaymentAmount;
                }
            }
        }

        // Total principal payment for this month starts with regular principal part + extra payment
        let totalPrincipalForMonth = principalPart + extraPayment;

        // Handle One-time Prepayments
        if (prepaymentMap[month]) {
            prepaymentAmount = prepaymentMap[month].amount;
            const prepaymentType = prepaymentMap[month].type;

            totalPrincipalForMonth += prepaymentAmount;

            // Note: We'll adjust balance after applying this payment
            // Logic for Reduce EMI vs Tenure happens after we know the new balance impact
            if (prepaymentType === 'reduce_emi') {
                emiChanged = true;
            }
        }

        // Check if this payment exceeds output balance
        // We need to calculate what the balance WOULD be
        // Current Balance - Principal Paid
        let closingBalance = balance - totalPrincipalForMonth;

        if (closingBalance < 0) {
            // We are overpaying. Reduce the principal payment to exactly match the balance.
            totalPrincipalForMonth = balance;
            closingBalance = 0;
        }

        // Update totals
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += totalPrincipalForMonth;
        balance = closingBalance;

        schedule.push({
            month: month,
            principal: totalPrincipalForMonth - extraPayment - prepaymentAmount, // Approximate regular principal part
            interest: interestPayment,
            prepayment: prepaymentAmount,
            additionalMonthly: extraPayment,
            total: interestPayment + totalPrincipalForMonth,
            balance: closingBalance,
            newEmi: emiChanged ? null : null // Placeholder if we want to track EMI changes
        });

        // Handle EMI Recalculation for 'Reduce EMI' type
        if (emiChanged && balance > 1) {
            const remainingMonths = Math.max(1, tenureMonths - month);
            actualEmi = calculateEMIValue(balance, rate, remainingMonths);
            finalEmi = actualEmi;
        }

        if (balance <= 0.1) break;
    }

    return { schedule, totalInterestPaid, totalPrincipalPaid, effectiveEmi: finalEmi };
}

// Draw pie chart
function drawPieChart(principal, totalInterest) {
    const ctx = pieChart.getContext('2d');
    const size = Math.min(pieChart.width, pieChart.height);
    const centerX = pieChart.width / 2;
    const centerY = pieChart.height / 2;
    const radius = size / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, pieChart.width, pieChart.height);

    const totalAmount = principal + totalInterest;
    const principalAngle = (principal / totalAmount) * 2 * Math.PI;
    const interestAngle = (totalInterest / totalAmount) * 2 * Math.PI;

    // Draw principal slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, principalAngle);
    ctx.closePath();
    ctx.fillStyle = '#6366f1';
    ctx.fill();

    // Draw interest slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, principalAngle, principalAngle + interestAngle);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Update legend
    chartLegend.innerHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background: #6366f1;"></div>
            <span class="legend-text">Principal: ${formatCurrency(principal)}</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #ef4444;"></div>
            <span class="legend-text">Interest: ${formatCurrency(totalInterest)}</span>
        </div>
    `;
}

// Main calculation function
function calculateEMI() {
    // Get values with defaults for calculation
    const principal = parseFloat(loanAmountInput.value) || 0;
    const rate = parseFloat(interestRateInput.value) || 0;
    let tenure = parseInt(loanTenureInput.value) || 0;
    const type = tenureType.value;

    // Only calculate if we have valid minimum values
    if (principal <= 0 || rate <= 0 || tenure <= 0) {
        return; // Don't calculate with invalid values
    }

    // Apply bounds for calculation (but don't change input value here)
    const validPrincipal = Math.max(10000, Math.min(10000000, principal));
    const validRate = Math.max(1, Math.min(30, rate));
    const validTenure = Math.max(1, Math.min(30, tenure));

    // Convert to months if in years
    const tenureMonths = type === 'years' ? validTenure * 12 : validTenure;

    // Get part payments
    const partPayments = getPartPayments();

    // Get additional monthly payment
    const additionalMonthlyPayment = parseFloat(additionalMonthlyPaymentInput.value) || 0;

    // Get additional payment frequency
    const frequencyInput = document.querySelector('input[name="paymentFrequency"]:checked');
    const paymentFrequency = frequencyInput ? frequencyInput.value : 'monthly';

    // Calculate base EMI (without prepayments)
    const emi = calculateEMIValue(validPrincipal, validRate, tenureMonths);

    // Calculate baseline scenario (without any prepayments or additional payments)
    const baselineSchedule = calculateSchedule(validPrincipal, validRate, tenureMonths, emi, [], 0, 'monthly');
    const baselineTotalInterest = baselineSchedule.totalInterestPaid;
    const baselineMonths = baselineSchedule.schedule.length;

    // Calculate schedule with prepayments and additional monthly payment
    const scheduleData = calculateSchedule(validPrincipal, validRate, tenureMonths, emi, partPayments, additionalMonthlyPayment, paymentFrequency);

    // Calculate totals
    const totalInterest = scheduleData.totalInterestPaid;
    const totalPrincipal = scheduleData.totalPrincipalPaid;
    const totalAmount = totalPrincipal + totalInterest;

    // Get effective EMI (might be reduced if "Reduce EMI" option is selected)
    const effectiveEmi = scheduleData.effectiveEmi || emi;

    // Calculate savings and months saved
    const interestSaved = baselineTotalInterest - totalInterest;
    const monthsSaved = baselineMonths - scheduleData.schedule.length;

    // Display results - show effective EMI (reduced EMI if applicable)
    document.getElementById('emiAmount').textContent = formatCurrency(effectiveEmi);
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);

    // Draw pie chart (use original principal vs actual interest paid)
    drawPieChart(validPrincipal, totalInterest);

    // Store schedule for later display
    window.currentSchedule = scheduleData.schedule;

    // Auto-update schedule table if it's currently visible
    if (scheduleTable.style.display !== 'none' && window.currentSchedule) {
        displaySchedule(window.currentSchedule);
    }

    // Display savings message
    displaySavingsMessage(interestSaved, monthsSaved, partPayments.length > 0 || additionalMonthlyPayment > 0);
}

// Display savings message
function displaySavingsMessage(interestSaved, monthsSaved, hasPrepayments) {
    const savingsMessageDiv = document.getElementById('savingsMessage');

    if (!hasPrepayments || interestSaved <= 0) {
        savingsMessageDiv.style.display = 'none';
        return;
    }

    const monthsText = monthsSaved === 1 ? 'month' : 'months';
    let timeText = `${monthsSaved} ${monthsText}`;

    if (monthsSaved >= 12) {
        const years = Math.floor(monthsSaved / 12);
        const remainingMonths = monthsSaved % 12;
        const yearText = years === 1 ? 'year' : 'years';
        const remMonthText = remainingMonths === 1 ? 'month' : 'months';

        let breakdown = `${years} ${yearText}`;
        if (remainingMonths > 0) {
            breakdown += ` and ${remainingMonths} ${remMonthText}`;
        }
        timeText += ` (${breakdown})`;
    }

    const messageHTML = `
        <div class="savings-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M9 12l2 2 4-4"></path>
            </svg>
            <div class="savings-text">
                <strong>Great news!</strong> You will save <strong>${formatCurrency(interestSaved)}</strong> on interest 
                ${monthsSaved > 0 ? `and close your loan <strong>${timeText} earlier</strong>` : ''}.
            </div>
        </div>
    `;

    savingsMessageDiv.innerHTML = messageHTML;
    savingsMessageDiv.style.display = 'block';
}

// Display amortization schedule
function displaySchedule(schedule) {
    scheduleBody.innerHTML = '';

    // Handle Rent Column Header
    const showRent = isRentedCheckbox.checked;
    const headerRow = document.getElementById('scheduleHeaderRow');

    // Check if Rent header already exists
    let rentHeader = headerRow.querySelector('.rent-header');

    if (showRent) {
        if (!rentHeader) {
            rentHeader = document.createElement('th');
            rentHeader.className = 'rent-header';
            rentHeader.textContent = 'Rent (₹)';
            headerRow.appendChild(rentHeader);
        }
    } else {
        if (rentHeader) {
            rentHeader.remove();
        }
    }

    // Rent Calculation Variables
    let currentRent = parseFloat(initialRentInput.value) || 0;
    const stepUpPercent = parseFloat(stepUpPercentInput.value) || 0;
    const stepUpFrequency = parseInt(stepUpFrequencyInput.value) || 1;
    let rentYearCounter = 1;

    // Calculate start date (next month)
    const now = new Date();
    let currentMonth = now.getMonth(); // 0-11
    let currentYear = now.getFullYear();

    // Move to next month
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    schedule.forEach((payment, index) => {
        const row = document.createElement('tr');
        const hasPrepayment = payment.prepayment > 0;
        const hasAdditionalMonthly = payment.additionalMonthly > 0;

        // Calculate date for this payment (index is 0-based, payment.month is 1-based usually)
        let paymentMonthIndex = (currentMonth + index) % 12;
        let paymentYear = currentYear + Math.floor((currentMonth + index) / 12);
        const dateString = `${monthNames[paymentMonthIndex]} ${paymentYear}`;

        let principalCell = formatCurrency(payment.principal);
        if (hasPrepayment || hasAdditionalMonthly) {
            let extras = [];
            if (hasPrepayment) {
                extras.push(`<span style="color: #10b981; font-weight: 600;">+${formatCurrency(payment.prepayment)}</span>`);
            }
            if (hasAdditionalMonthly) {
                extras.push(`<span style="color: #6366f1; font-weight: 600;">+${formatCurrency(payment.additionalMonthly)}</span>`);
            }
            principalCell += ' ' + extras.join(' ');
        }

        // Prepare Row HTML
        let rowHTML = `
            <td>${dateString}</td>
            <td>${principalCell}</td>
            <td>${formatCurrency(payment.interest)}</td>
            <td>${formatCurrency(payment.total)}</td>
            <td>${formatCurrency(payment.balance)}</td>
        `;

        // Append Rent Cell if active
        if (showRent) {
            // Apply step-up logic:
            // Rent increases after every 'stepUpFrequency' years.
            // We need to track the "loan year" or "rent year".
            // index 0 to 11 = Year 1. index 12 to 23 = Year 2.

            const currentYearOfLoan = Math.floor(index / 12) + 1;

            // Calculate rent for this specific year
            // Formula: Initial * (1 + rate)^floor((Year-1)/Frequency)
            const numberOfStepUps = Math.floor((currentYearOfLoan - 1) / stepUpFrequency);
            const calculatedRent = currentRent * Math.pow(1 + stepUpPercent / 100, numberOfStepUps);

            rowHTML += `<td>${formatCurrency(calculatedRent)}</td>`;
        }

        row.innerHTML = rowHTML;
        scheduleBody.appendChild(row);
    });
}



// Event listener for add part payment button
addPartPaymentBtn.addEventListener('click', addPartPaymentEntry);

// Toggle schedule
toggleScheduleBtn.addEventListener('click', () => {
    if (scheduleTable.style.display === 'none') {
        scheduleTable.style.display = 'block';
        toggleScheduleBtn.textContent = 'Hide Full Schedule';
        // Ensure schedule is up to date when showing
        if (window.currentSchedule) {
            displaySchedule(window.currentSchedule);
        }
    } else {
        scheduleTable.style.display = 'none';
        toggleScheduleBtn.textContent = 'Show Full Schedule';
    }
});

// Initialize canvas size
function initCanvas() {
    const container = document.querySelector('.chart-container');
    const size = Math.min(280, container.offsetWidth - 40);
    pieChart.width = size;
    pieChart.height = size;
}

// ROI Elements
const isRentedCheckbox = document.getElementById('isRented');
const roiInputsDetails = document.getElementById('roiInputs');
const initialRentInput = document.getElementById('initialRent');
const stepUpPercentInput = document.getElementById('stepUpPercent');
const stepUpFrequencyInput = document.getElementById('stepUpFrequency');
const roiResult = document.getElementById('roiResult');
const totalRentEarnedDisplay = document.getElementById('totalRentEarned');

// Calculate Rental Income
function calculateRentalIncome() {
    if (!isRentedCheckbox.checked) {
        roiInputsDetails.style.display = 'none';
        roiResult.style.display = 'none';
        return;
    }

    roiInputsDetails.style.display = 'block';

    const initialRent = parseFloat(initialRentInput.value) || 0;
    const stepUpPercent = parseFloat(stepUpPercentInput.value) || 0;
    const stepUpFrequency = parseInt(stepUpFrequencyInput.value) || 1;

    // Get Loan Tenure in Years
    let tenure = parseInt(loanTenureInput.value) || 0;
    const type = tenureType.value;
    const tenureYears = type === 'years' ? tenure : tenure / 12; // Approximation for rent step-up logic

    if (initialRent <= 0 || tenureYears <= 0) {
        roiResult.style.display = 'none';
        return;
    }

    let totalRent = 0;
    let currentMonthlyRent = initialRent;

    // Calculate year by year
    // We'll approximate partial years if tenure is e.g. 15.5 years
    // But step-up usually happens on annual boundaries.

    const fullYears = Math.floor(tenureYears);
    const partialYear = tenureYears - fullYears;

    for (let year = 1; year <= fullYears; year++) {
        totalRent += currentMonthlyRent * 12;

        // Apply step-up if frequency matches
        if (year % stepUpFrequency === 0) {
            currentMonthlyRent = currentMonthlyRent * (1 + stepUpPercent / 100);
        }
    }

    // Add partial year rent (at final rate)
    if (partialYear > 0) {
        totalRent += currentMonthlyRent * (partialYear * 12);
    }

    totalRentEarnedDisplay.textContent = formatCurrency(totalRent);
    roiResult.style.display = 'block';
}

// Initialize sliders fill on load
function initializeSliders() {
    updateSliderFill(loanAmountSlider);
    updateSliderFill(interestRateSlider);
    updateSliderFill(loanTenureSlider);

    // Initialize ROI calculation if previously set? (Browser might remember input values on reload)
    calculateRentalIncome();
}

// Initialize
window.addEventListener('load', () => {
    initCanvas();
    initializeSliders();

    // Event listener for additional monthly payment
    if (additionalMonthlyPaymentInput) {
        additionalMonthlyPaymentInput.addEventListener('input', calculateEMI);
    }

    // Additional Payment Frequency Listeners
    document.querySelectorAll('input[name="paymentFrequency"]').forEach(radio => {
        radio.addEventListener('change', calculateEMI);
    });

    calculateEMI();

    // Show empty message if no part payments
    if (partPaymentsList.children.length === 0) {
        partPaymentsList.innerHTML = '<div class="empty-message">Click "Add Payment" to include part payments</div>';
    }


    // ROI Listeners
    const updateRoiAndSchedule = () => {
        calculateRentalIncome();
        if (scheduleTable.style.display !== 'none' && window.currentSchedule) {
            displaySchedule(window.currentSchedule);
        }
    };

    isRentedCheckbox.addEventListener('change', updateRoiAndSchedule);
    initialRentInput.addEventListener('input', updateRoiAndSchedule);
    stepUpPercentInput.addEventListener('input', updateRoiAndSchedule);
    stepUpFrequencyInput.addEventListener('input', updateRoiAndSchedule);
    // Loan Tenure change should also trigger ROI update
    loanTenureInput.addEventListener('input', calculateRentalIncome);
    loanTenureSlider.addEventListener('input', calculateRentalIncome);
    tenureType.addEventListener('change', calculateRentalIncome);
});


window.addEventListener('resize', () => {
    initCanvas();
    if (window.currentSchedule) {
        const principal = parseFloat(loanAmountInput.value) || 1000000;
        const totalInterest = parseFloat(document.getElementById('totalInterest').textContent.replace(/[₹,\s]/g, '')) || 0;
        drawPieChart(principal, totalInterest);
    }
});
