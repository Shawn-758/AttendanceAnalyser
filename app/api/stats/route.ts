import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import moment from "moment";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month"); // Format YYYY-MM
    
    if (!monthStr) return NextResponse.json([]);

    const startOfMonth = moment(monthStr).startOf('month').toDate();
    const endOfMonth = moment(monthStr).endOf('month').toDate();

    const employees = await prisma.employee.findMany({
      include: {
        records: {
          where: {
            date: { gte: startOfMonth, lte: endOfMonth }
          }
        }
      }
    });

    const report = employees.map(emp => {
      let totalActualHours = 0;
      let totalExpectedHours = 0;
      let leavesTaken = 0;

      emp.records.forEach(record => {
          const day = moment(record.date).day();
          // Business Rules
          let expected = 0;
          if (day >= 1 && day <= 5) expected = 8.5; // Mon-Fri
          if (day === 6) expected = 4.0; // Sat

          totalExpectedHours += expected;
          totalActualHours += record.workedHours;

          if (record.status === 'ABSENT') leavesTaken++;
      });

      // Avoid division by zero
      const productivity = totalExpectedHours > 0 
          ? ((totalActualHours / totalExpectedHours) * 100).toFixed(1) 
          : "0.0";

      return {
          id: emp.id,
          name: emp.name,
          actualHours: totalActualHours.toFixed(2),
          expectedHours: totalExpectedHours,
          leavesTaken,
          leavesAllowed: 2,
          productivity,
          records: emp.records 
      };
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}