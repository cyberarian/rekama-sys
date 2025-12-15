import React, { useEffect, useRef, useState } from 'react';
import { KnowledgeGraphData } from '../types';
import { db } from '../services/dbService';

const KnowledgeGraph: React.FC = () => {
  const [data, setData] = useState<KnowledgeGraphData>({ nodes: [], links: [] });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchData = async () => {
        const records = await db.getRecords();
        const policies = await db.getPolicies();

        const nodes: any[] = [];
        const links: any[] = [];

        // Central Node
        nodes.push({ id: 'root', group: 3, val: 30, name: 'Organization' });

        // Policy Nodes
        policies.forEach((p, idx) => {
            nodes.push({ id: `pol_${p.id}`, group: 1, val: 20, name: p.name });
            links.push({ source: 'root', target: `pol_${p.id}`, value: 2 });
        });

        // Record Nodes
        records.forEach((r, idx) => {
            nodes.push({ id: `rec_${r.id}`, group: 2, val: 15, name: r.title.substring(0, 15) + (r.title.length > 15 ? '...' : '') });
            
            // Link record to root or policy? 
            // For now, link to root to show inventory
            links.push({ source: 'root', target: `rec_${r.id}`, value: 1 });

            // Naive relationship: Link records with similar classification to policies? 
            // Simple visual: Just show them surrounding the org.
        });

        setData({ nodes, links });
    };
    fetchData();
  }, []);

  const width = 400; // Fixed width for sidebar container
  const height = 400;

  // Basic layout calculation (Radial)
  const getCoords = (node: any, index: number, total: number, group: number) => {
    if (node.id === 'root') return { x: width / 2, y: height / 2 };
    
    // Distribute groups in concentric circles
    const radius = group === 1 ? 80 : 140; 
    // Filter index logic is complex without D3, simplistic radial distribution based on array index
    const angle = (index / total) * 2 * Math.PI;
    
    return {
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius
    };
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-lg overflow-hidden flex flex-col items-center">
      <h3 className="text-slate-300 font-semibold mb-4 w-full text-left">Semantic Knowledge Graph</h3>
      <div className="text-xs text-slate-500 w-full mb-2 flex gap-4">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Policy</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Record</span>
      </div>
      <svg ref={svgRef} width="100%" height="400" viewBox={`0 0 ${width} ${height}`} className="w-full bg-slate-900 rounded-lg">
        {/* Links */}
        {data.links.map((link, i) => {
            const sourceNode = data.nodes.find(n => n.id === link.source);
            const targetNode = data.nodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            const sCoords = getCoords(sourceNode, data.nodes.indexOf(sourceNode), data.nodes.length, sourceNode.group);
            const tCoords = getCoords(targetNode, data.nodes.indexOf(targetNode), data.nodes.length, targetNode.group);
            
            return (
                <line 
                    key={i}
                    x1={sCoords.x} y1={sCoords.y}
                    x2={tCoords.x} y2={tCoords.y}
                    stroke="#475569"
                    strokeWidth="1"
                    opacity={0.5}
                />
            );
        })}
        {/* Nodes */}
        {data.nodes.map((node, i) => {
            const coords = getCoords(node, i, data.nodes.length, node.group);
            return (
                <g key={node.id} transform={`translate(${coords.x},${coords.y})`}>
                    <circle r={node.val / 2} fill={node.group === 1 ? '#3b82f6' : node.group === 2 ? '#10b981' : '#f59e0b'} className="cursor-pointer hover:opacity-80 transition-opacity">
                        <title>{node.name}</title>
                    </circle>
                    {data.nodes.length < 20 && ( // Hide text if too many nodes
                        <text dy={node.val / 2 + 12} textAnchor="middle" fill="#94a3b8" fontSize="10" className="pointer-events-none select-none">
                            {node.name}
                        </text>
                    )}
                </g>
            );
        })}
      </svg>
    </div>
  );
};

export default KnowledgeGraph;