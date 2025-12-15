import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Classification, DocumentRecord } from '../types';
import { db } from '../services/dbService';

const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ total: 0, highRisk: 0, avgScore: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const allRecords = await db.getRecords();
      setRecords(allRecords);
      processAnalytics(allRecords);
    };
    fetchData();
  }, []);

  const processAnalytics = (data: DocumentRecord[]) => {
    // 1. Process Risk Distribution by Classification
    const classCounts: Record<string, number> = {
      [Classification.Public]: 0,
      [Classification.Internal]: 0,
      [Classification.Confidential]: 0,
      [Classification.Restricted]: 0
    };
    
    // 2. Process Sources
    const sourceCounts: Record<string, number> = {};

    let totalRisk = 0;
    let highRiskCount = 0;

    data.forEach(rec => {
      // Classification Stats
      if (classCounts[rec.classification] !== undefined) {
        classCounts[rec.classification]++;
      }
      
      // Source Stats
      const src = rec.source || 'Unknown';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      // KPI Stats
      totalRisk += rec.riskScore;
      if (rec.riskScore > 70) highRiskCount++;
    });

    setKpis({
      total: data.length,
      highRisk: highRiskCount,
      avgScore: data.length > 0 ? Math.round(100 - (totalRisk / data.length)) : 100 // Inverse risk for compliance score
    });

    // Format for Recharts
    const rData = [
      { name: Classification.Public, value: classCounts[Classification.Public], color: '#22c55e' },
      { name: Classification.Internal, value: classCounts[Classification.Internal], color: '#3b82f6' },
      { name: Classification.Confidential, value: classCounts[Classification.Confidential], color: '#f59e0b' },
      { name: Classification.Restricted, value: classCounts[Classification.Restricted], color: '#ef4444' },
    ];
    setRiskData(rData.filter(d => d.value > 0)); // Only show active

    const sData = Object.keys(sourceCounts).map((key, idx) => ({
      name: key,
      value: sourceCounts[key],
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][idx % 5]
    }));
    setSourceData(sData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Records</h3>
        <p className="text-3xl font-bold text-white mt-2">{kpis.total}</p>
        <p className="text-green-400 text-sm mt-1 flex items-center">
            Active in Registry
        </p>
      </div>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">High Risk Items</h3>
        <p className="text-3xl font-bold text-white mt-2">{kpis.highRisk}</p>
        <p className="text-red-400 text-sm mt-1 flex items-center">
             Requires Immediate Review
        </p>
      </div>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Compliance Score</h3>
        <p className="text-3xl font-bold text-white mt-2">{kpis.avgScore}<span className="text-lg text-slate-500">/100</span></p>
        <p className="text-blue-400 text-sm mt-1">ISO 15489 Standard</p>
      </div>

      {/* Charts */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2 min-h-[300px] flex flex-col">
        <h3 className="text-slate-300 font-semibold mb-4">Risk Distribution</h3>
        {riskData.length > 0 ? (
        <div className="flex-1 w-full h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                        itemStyle={{ color: '#f8fafc' }}
                        cursor={{fill: 'transparent'}}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {riskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>
        ) : (
             <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No data available</div>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg min-h-[300px] flex flex-col">
        <h3 className="text-slate-300 font-semibold mb-4">Data Sources</h3>
        {sourceData.length > 0 ? (
        <div className="flex-1 w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2 flex-wrap">
                 {sourceData.map((entry, index) => (
                     <div key={index} className="flex items-center text-xs text-slate-400">
                         <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: entry.color }}></div>
                         {entry.name}
                     </div>
                 ))}
            </div>
        </div>
        ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No sources detected</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;