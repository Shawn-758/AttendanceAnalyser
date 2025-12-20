"use client";
import { useState, useEffect } from "react";
import * as xlsx from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GradientText from "@/components/GradientText";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(""); 
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const queryMonth = month || "2023-10"; 
      // Adding timestamp to prevent caching
      const res = await fetch(`/api/stats?month=${queryMonth}&t=${new Date().getTime()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    // LOGIC FIX: Only fetch if empty (initial load) OR if format is exactly YYYY-MM or YYYY/MM
    const isValidFormat = /^\d{4}[-\/]\d{2}$/.test(month);
    
    if (month === "" || isValidFormat) {
        fetchData();
    }
  }, [month]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 429) {
          alert("Slow down! You are uploading too fast.");
          setLoading(false);
          return;
      }

      if (res.ok) {
        alert("Upload Successful!");
        fetchData();
      } else {
        alert("Upload Failed: Check file format");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("No data to download.");
      return;
    }
    const worksheetData = data.map((emp) => ({
      "Employee Name": emp.name,
      "Productivity (%)": `${emp.productivity}%`,
      "Expected Hours": emp.expectedHours,
      "Actual Hours": emp.actualHours,
      "Leaves Taken": emp.leavesTaken,
      "Allowed Leaves": emp.leavesAllowed,
      "Status": emp.leavesTaken > 2 ? "Over Limit" : "Safe"
    }));
    const worksheet = xlsx.utils.json_to_sheet(worksheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
    xlsx.writeFile(workbook, `Report_${month || 'All'}.xlsx`);
  };

  const handleDownloadPDF = () => {
    if (data.length === 0) {
      alert("No data to download.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Attendance & Productivity Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Month: ${month || 'All Data'}`, 14, 30);

    const tableColumn = ["Employee", "Productivity", "Exp Hrs", "Act Hrs", "Leaves", "Status"];
    const tableRows = data.map(emp => [
      emp.name,
      `${emp.productivity}%`,
      emp.expectedHours,
      emp.actualHours,
      `${emp.leavesTaken} / 2`,
      emp.leavesTaken > 2 ? "Over Limit" : "Safe"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save(`Report_${month || 'All'}.pdf`);
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 text-slate-800 p-8">
      
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <GradientText colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]} 
                animationSpeed={6} showBorder={false} className="text-4xl font-extrabold">
                  LeaveAnalyzer
              </GradientText>
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Workforce insights at a glance</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
             
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg aria-hidden="true" className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                </div>
                <input 
                    type="text" 
                    placeholder="YYYY-MM" 
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                    className="bg-transparent border-none text-slate-700 text-sm rounded-xl focus:ring-0 block w-36 pl-10 p-2.5 cursor-text font-semibold placeholder-slate-400"
                />
             </div>

             <div className="h-6 w-px bg-slate-200 mx-1"></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Export</span>

             <div className="flex gap-2">
               <button onClick={handleDownloadExcel} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white p-2 rounded-xl transition-all duration-300 shadow-sm" title="Excel">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
               </button>
               <button onClick={handleDownloadPDF} className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-all duration-300 shadow-sm" title="PDF">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
               </button>
             </div>
          </div>
        </header>

        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/40 mb-10 transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Upload Attendance</h2>
                <p className="text-slate-500 text-sm">Supported formats: .xlsx</p>
            </div>
            
            <form onSubmit={handleUpload} className="flex gap-4 items-center w-full md:w-auto">
              <label className="flex-1 cursor-pointer">
                <input 
                  type="file" 
                  accept=".xlsx" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all"
                />
              </label>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
              >
                {loading ? "Processing..." : "Analyze"}
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card title="Total Employees" value={data.length} icon="users" color="blue" />
            <Card 
                title="Avg Productivity" 
                value={`${(data.reduce((acc, curr) => acc + parseFloat(curr.productivity), 0) / (data.length || 1)).toFixed(1)}%`} 
                icon="chart" 
                color="emerald"
            />
            <Card 
                title="Critical Leaves" 
                value={data.filter(d => d.leavesTaken > 2).length} 
                icon="warning" 
                color="rose"
            />
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-sm border border-white/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-6">Employee</th>
                  <th className="p-6">Productivity</th>
                  <th className="p-6 text-center">Expected Hrs</th>
                  <th className="p-6 text-center">Actual Hrs</th>
                  <th className="p-6">Leaves</th>
                  <th className="p-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {data.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/50 transition-colors group">
                    <td className="p-6 font-bold text-slate-700">{emp.name}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-full rounded-full ${parseFloat(emp.productivity) >= 80 ? 'bg-emerald-500' : parseFloat(emp.productivity) >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${Math.min(parseFloat(emp.productivity), 100)}%` }}></div>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">{emp.productivity}%</span>
                      </div>
                    </td>
                    <td className="p-6 text-center text-slate-500">{emp.expectedHours}</td>
                    <td className="p-6 text-center text-slate-800 font-medium">{emp.actualHours}</td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.leavesTaken > 2 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"}`}>
                          {emp.leavesTaken} <span className="text-slate-400 ml-1 font-normal">/ 2</span>
                      </span>
                    </td>
                    <td className="p-6">
                         {emp.leavesTaken > 2 
                            ? <span className="text-rose-600 font-bold text-xs uppercase tracking-wide bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Over Limit</span>
                            : <span className="text-emerald-600 font-bold text-xs uppercase tracking-wide bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Safe</span>
                         }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && <div className="p-12 text-center text-slate-400 font-medium">No data found. Upload a file or select a different month.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) {
    const colors: Record<string, string> = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        rose: "text-rose-600 bg-rose-50 border-rose-100"
    };

    return (
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-white/60 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
                <div className={`p-2 rounded-xl ${colors[color]}`}>
                    {icon === 'users' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    {icon === 'chart' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    {icon === 'warning' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-800">{value}</p>
        </div>
    )
}