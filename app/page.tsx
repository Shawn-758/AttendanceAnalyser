"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState("2023-10"); // Default for demo
  const [data, setData] = useState<any[]>([]);

  // 1. Fetch Data
  const fetchData = async () => {
    const res = await fetch(`/api/stats?month=${month}`);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  // 2. Handle Upload
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

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Leaves & Productivity Analyzer</h1>
          <div className="flex gap-4">
             <input 
                type="month" 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
                className="border p-2 rounded bg-white shadow-sm"
             />
          </div>
        </header>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Attendance Sheet</h2>
          <form onSubmit={handleUpload} className="flex gap-4 items-center">
            <input 
              type="file" 
              accept=".xlsx" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Processing..." : "Analyze"}
            </button>
          </form>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card title="Total Employees" value={data.length} />
            <Card title="Avg Productivity" value={`${(data.reduce((acc, curr) => acc + parseFloat(curr.productivity), 0) / (data.length || 1)).toFixed(1)}%`} />
            <Card title="Critical Leaves" value={data.filter(d => d.leavesTaken > 2).length} color="text-red-600" />
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Productivity</th>
                <th className="p-4">Expected Hrs</th>
                <th className="p-4">Actual Hrs</th>
                <th className="p-4">Leaves (Used/Allowed)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{emp.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${
                        parseFloat(emp.productivity) >= 80 ? 'bg-green-100 text-green-700' : 
                        parseFloat(emp.productivity) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {emp.productivity}%
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{emp.expectedHours}</td>
                  <td className="p-4 text-gray-600">{emp.actualHours}</td>
                  <td className="p-4">
                    <span className={emp.leavesTaken > 2 ? "text-red-600 font-bold" : "text-gray-600"}>
                        {emp.leavesTaken}
                    </span>
                    <span className="text-gray-400"> / 2</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {emp.leavesTaken > 2 ? "Over Limit" : "Safe"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <div className="p-8 text-center text-gray-500">No data found for this month.</div>}
        </div>
      </div>
    </div>
  );
}

// Simple Stat Card Component
function Card({ title, value, color = "text-gray-800" }: { title: string, value: string | number, color?: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
    )
}