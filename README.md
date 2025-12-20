# 📊 Leave & Productivity Analyzer

A full-stack **Next.js** application that automates employee attendance tracking, calculates productivity based on specific shift rules, and monitors leave balances using uploaded Excel data.

![Project Status](https://img.shields.io/badge/status-active-success.svg)

## 🚀 Features

* **Excel Upload**: Drag-and-drop parsing of `.xlsx` attendance sheets.
* **Smart Analysis Logic**:
    * **Mon-Fri**: 8.5 Expected Hours.
    * **Saturday**: 4.0 Expected Hours (Half-day).
    * **Sunday**: Off.
* **Productivity Calculation**: (Actual Hours / Expected Hours) %.
* **Leave Tracking**: Flags employees exceeding the 2 leaves/month limit.
* **Export Reports**: Download analysis as PDF or Excel.
* **Interactive Dashboard**: Visual breakdown of workforce metrics.

## 🛠️ Tech Stack

* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS
* **Database**: MongoDB Atlas (via Prisma ORM)
* **File Handling**: `xlsx` (SheetJS) for parsing, `jspdf` for reports.
* **Rate Limiting**: Upstash / Custom Middleware (to prevent upload spam).

---

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/leave-analyzer.git](https://github.com/your-username/leave-analyzer.git)
    cd leave-analyzer
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Database (Prisma)**
    Ensure your `.env` file contains your MongoDB Atlas connection string:
    ```env
    DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/attendance_db"
    ```
    Then push the schema to your database:
    ```bash
    npx prisma db push
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🧪 Testing with Sample Data

To verify the logic, you can use the provided **`full_month_test.xlsx`** dataset.

### 1. File Structure
Create an Excel file with the following headers (Case Sensitive):

| Employee Name | Date       | In-Time | Out-Time |
| :--- | :--- | :--- | :--- |
| Alice Perfect | 2023-10-01 | 10:00   | 18:30    |
| Bob Latecomer | 2023-10-02 | 10:30   | 18:30    |

### 2. Sample Data Logic (October 2023)
* **Alice Perfect**:
    * Attended all working days.
    * **Expected Result**: ~100% Productivity, 0 Leaves.
* **Bob Latecomer**:
    * Missed several days.
    * **Expected Result**: Low Productivity (<60%), Leaves > 2 (Over Limit).

**Note**: You can manually input `2023-10` in the dashboard date picker to run the analysis against this specific dataset.

---

## 📂 Project Structure

```bash
├── app/
│   ├── api/
│   │   ├── upload/      # Handles file parsing & DB storage
│   │   └── stats/       # Fetches calculated reports
│   ├── components/      # UI Cards, GradientText
│   └── page.tsx         # Main Dashboard & UI Logic
├── prisma/
│   └── schema.prisma    # Database Schema
├── public/              # Static assets
└── middleware.ts        # Rate limiting logic
