// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as xlsx from "xlsx";
import moment from "moment";

const prisma = new PrismaClient();

// Helper: Calculate worked hours
const calculateHours = (inTime: Date, outTime: Date) => {
  const diffMs = outTime.getTime() - inTime.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return hours > 0 ? parseFloat(hours.toFixed(2)) : 0;
};

// Helper: Excel Serial Date Converter (just in case Excel sends numbers)
const parseExcelDate = (val: any) => {
  if (!val) return null;
  // If it's a string like "2024-01-01"
  if (typeof val === 'string') return new Date(val);
  // If it's a JS Date
  if (val instanceof Date) return val;
  // If it's an Excel serial number
  if (typeof val === 'number') {
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }
  return null;
};

// Helper: Parse Time strings like "10:00" or "18:30"
const parseTime = (dateObj: Date, timeStr: any) => {
  if (!timeStr || !dateObj) return null;
  
  // If Excel sends a decimal (0.5 = 12:00 PM)
  if (typeof timeStr === 'number') {
    const totalSeconds = Math.round(timeStr * 86400);
    const result = new Date(dateObj);
    result.setSeconds(totalSeconds);
    return result;
  }

  // If string "10:00"
  if (typeof timeStr === 'string') {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(dateObj);
    result.setHours(hours || 0, minutes || 0, 0, 0);
    return result;
  }
  return null;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse JSON with raw values to handle times correctly
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: true }); 

    if (jsonData.length === 0) return NextResponse.json({ message: "Empty sheet" });

    // 1. Process Raw Data based on your Image Columns
    const processedData = jsonData.map((row: any) => {
        // Exact keys from your image
        const nameRaw = row['Employee Name'];
        const dateRaw = row['Date'];
        const inTimeRaw = row['In-Time'];
        const outTimeRaw = row['Out-Time'];

        const baseDate = parseExcelDate(dateRaw);
        
        // Critical Logic: Check if In/Out exists. If not, it's a LEAVE (null).
        let inTime = null;
        let outTime = null;

        if (baseDate && inTimeRaw && outTimeRaw) {
             inTime = parseTime(baseDate, inTimeRaw);
             outTime = parseTime(baseDate, outTimeRaw);
        }

        return {
            name: nameRaw,
            date: baseDate,
            inTime: inTime,
            outTime: outTime,
            isAbsent: !inTime || !outTime // Flag this row as absent immediately
        };
    }).filter(d => d.name && d.date); // Filter junk rows

    if (processedData.length === 0) return NextResponse.json({ message: "No valid data found" });

    // Determine Month Range
    const firstDate = moment(processedData[0].date);
    const startOfMonth = firstDate.clone().startOf('month');
    const daysInMonth = firstDate.clone().daysInMonth();

    const employeeNames = [...new Set(processedData.map((d: any) => d.name))];

    for (const name of employeeNames) {
      const employee = await prisma.employee.upsert({
        where: { name: name },
        update: {},
        create: { name: name },
      });

      const empRecords = processedData.filter((d: any) => d.name === name);

      // 2. Iterate every day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDay = startOfMonth.clone().date(day);
        const dayOfWeek = currentDay.day(); // 0=Sun, 6=Sat
        
        if (dayOfWeek === 0) continue; // Sunday Off

        // Find record in Excel for this specific date
        const record = empRecords.find((r: any) => moment(r.date).isSame(currentDay, 'day'));

        // LOGIC: It is PRESENT only if record exists AND it is not marked absent
        if (record && !record.isAbsent && record.inTime && record.outTime) {
            const hours = calculateHours(record.inTime, record.outTime);
            await prisma.attendanceRecord.upsert({
                where: { employeeId_date: { employeeId: employee.id, date: currentDay.toDate() } },
                update: { workedHours: hours, status: "PRESENT", inTime: record.inTime, outTime: record.outTime },
                create: { 
                    employeeId: employee.id, 
                    date: currentDay.toDate(), 
                    workedHours: hours, 
                    status: "PRESENT",
                    inTime: record.inTime,
                    outTime: record.outTime
                }
            });
        } else {
            // Case 1: Row exists but times are empty (record.isAbsent = true)
            // Case 2: Row does not exist at all
            // BOTH are Leaves.
            await prisma.attendanceRecord.upsert({
                where: { employeeId_date: { employeeId: employee.id, date: currentDay.toDate() } },
                update: { workedHours: 0, status: "ABSENT", inTime: null, outTime: null },
                create: { 
                    employeeId: employee.id, 
                    date: currentDay.toDate(), 
                    workedHours: 0, 
                    status: "ABSENT"
                }
            });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}