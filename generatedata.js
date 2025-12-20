const XLSX = require('xlsx');

// Setup: October 2023 (1st to 31st)
const year = 2023;
const month = 9; // Month is 0-indexed in JS (9 = Oct)
const daysInMonth = 31;

const headers = ["Employee Name", "Date", "In-Time", "Out-Time"];
const data = [headers];

// Helper to format date YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

    // Skip Sundays (0)
    if (dayOfWeek === 0) continue;

    // 1. Alice Perfect (100% Attendance)
    // Mon-Fri: 10:00 - 18:30, Sat: 10:00 - 14:00
    const outTime = dayOfWeek === 6 ? "14:00" : "18:30";
    data.push(["Alice Perfect", formatDate(date), "10:00", outTime]);

    // 2. Bob Latecomer (Absent on even days)
    if (day % 2 !== 0) {
        data.push(["Bob Latecomer", formatDate(date), "10:30", "18:30"]);
    }
}

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Attendance");
XLSX.writeFile(wb, "full_month_test.xlsx");

console.log("✅ 'full_month_test.xlsx' created successfully! Upload this file.");