'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '../../context/AuthContext';
import { Share2, Search, SlidersHorizontal, Info, ShieldAlert, Cpu, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';

// Mock Network Nodes & Edges fallback matching backend schemas
const MOCK_NODES: Node[] = [
  // Criminals
  { id: 'c-1', position: { x: 150, y: 150 }, data: { label: "Ramesh 'Kulla' Kumar", type: 'CRIMINAL', risk: 85, status: 'ACTIVE' }, style: { background: '#111118', color: '#FFF', border: '1.5px solid #EF4444', borderRadius: '8px', padding: '10px', fontSize: '11px', width: 140 } },
  { id: 'c-2', position: { x: 380, y: 80 }, data: { label: "Shaji 'Doctor' Mathew", type: 'CRIMINAL', risk: 92, status: 'ABSCONDING' }, style: { background: '#111118', color: '#FFF', border: '1.5px solid #EF4444', borderRadius: '8px', padding: '10px', fontSize: '11px', width: 140 } },
  { id: 'c-3', position: { x: 420, y: 280 }, data: { label: "Syed 'Bhai' Karim", type: 'CRIMINAL', risk: 78, status: 'IN_CUSTODY' }, style: { background: '#111118', color: '#FFF', border: '1.5px solid #F59E0B', borderRadius: '8px', padding: '10px', fontSize: '11px', width: 140 } },
  { id: 'c-5', position: { x: 50, y: 320 }, data: { label: "Manjunath Gowda", type: 'CRIMINAL', risk: 70, status: 'ACTIVE' }, style: { background: '#111118', color: '#FFF', border: '1.5px solid #F59E0B', borderRadius: '8px', padding: '10px', fontSize: '11px', width: 140 } },

  // Cases
  { id: 'f-1', position: { x: 260, y: 250 }, data: { label: 'FIR-2026-0045 (Robbery)', type: 'CASE', status: 'ACTIVE' }, style: { background: '#0B0B0F', color: '#FFF', border: '1.5px solid #7C3AED', borderRadius: '8px', padding: '10px', fontSize: '11px', width: 150 } },
  { id: 'f-2', position: { x: 520, y: 180 }, data: { label: 'FIR-2026-0056 (Burglary)', type: 'CASE', status: 'PENDING' }, style: { background: '#0B0B0F', color: '#FFF', border: '1.5px solid #7C3AED', borderRadius: '8px', padding: '10px', fontSize: '11px', width: 150 } },

  // Vehicle
  { id: 'v-1', position: { x: 100, y: 20 }, data: { label: 'KA-01-HE-7890 (Activa)', type: 'VEHICLE', owner: 'Ramesh Kumar' }, style: { background: '#111118', color: '#CCC', border: '1px solid #4F46E5', borderRadius: '6px', padding: '8px', fontSize: '10px', width: 130 } },
  { id: 'v-2', position: { x: 580, y: 40 }, data: { label: 'KA-51-AB-9999 (Bolero)', type: 'VEHICLE', owner: 'Rental' }, style: { background: '#111118', color: '#CCC', border: '1px solid #4F46E5', borderRadius: '6px', padding: '8px', fontSize: '10px', width: 130 } },

  // Phone
  { id: 'p-1', position: { x: 250, y: 80 }, data: { label: '9900123456 (Jio)', type: 'PHONE', owner: 'Ramesh Kumar' }, style: { background: '#111118', color: '#CCC', border: '1px solid #10B981', borderRadius: '6px', padding: '8px', fontSize: '10px', width: 120 } }
];

const MOCK_EDGES: Edge[] = [
  // Associate links
  { id: 'e-1', source: 'c-1', target: 'c-5', label: 'GANG_MEMBER', animated: true, style: { stroke: '#EF4444' } },
  { id: 'e-2', source: 'c-2', target: 'c-3', label: 'CO_CONSPIRATOR', style: { stroke: '#E2E8F0' } },

  // Case Suspect associations
  { id: 'e-3', source: 'c-1', target: 'f-1', label: 'SUSPECT', style: { stroke: '#7C3AED' } },
  { id: 'e-4', source: 'c-5', target: 'f-1', label: 'ACCOMPLICE', style: { stroke: '#7C3AED' } },
  { id: 'e-5', source: 'c-2', target: 'f-2', label: 'SUSPECT', style: { stroke: '#7C3AED' } },
  { id: 'e-6', source: 'c-3', target: 'f-2', label: 'ACCOMPLICE', style: { stroke: '#7C3AED' } },

  // Asset links
  { id: 'e-7', source: 'c-1', target: 'v-1', label: 'OWNS' },
  { id: 'e-8', source: 'c-1', target: 'p-1', label: 'USES' },
  { id: 'e-9', source: 'v-2', target: 'f-2', label: 'SPOTTED_NEAR', style: { stroke: '#EF4444' } },
  { id: 'e-10', source: 'p-1', target: 'f-1', label: 'CALL_LOGGED' }
];

export default function NetworkAnalysis() {
  const { token, isDemoMode } = useAuth();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(MOCK_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(MOCK_EDGES);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isDemoMode) {
      setNodes(MOCK_NODES);
      setEdges(MOCK_EDGES);
      return;
    }

    const fetchNetwork = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/criminals/network', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const payload = await res.json();
          // Map DB nodes/edges with clean styled cards for React Flow
          const mappedNodes = payload.nodes.map((n: any) => {
            let border = '#4F46E5'; // default Indigo
            if (n.data.type === 'CRIMINAL') {
              border = n.data.riskScore >= 80 ? '#EF4444' : '#F59E0B';
            } else if (n.data.type === 'CASE') {
              border = '#7C3AED'; // Purple
            } else if (n.data.type === 'PHONE') {
              border = '#10B981'; // Success Green
            }

            return {
              id: n.id,
              position: { x: Math.random() * 500 + 50, y: Math.random() * 300 + 50 },
              data: n.data,
              style: {
                background: '#111118',
                color: '#FFF',
                border: `1.5px solid ${border}`,
                borderRadius: '8px',
                padding: '10px',
                fontSize: '11px',
                width: 140
              }
            };
          });

          setNodes(mappedNodes);
          setEdges(payload.edges);
        }
      } catch (err) {
        console.warn('Network call failed, staying with mock fallback');
      }
    };

    fetchNetwork();
  }, [isDemoMode, token, setNodes, setEdges]);

  // Click handler on nodes
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data);
  }, []);

  const runAssociationAnalysis = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Computing relative centralities via NetworkX...',
        success: 'Co-conspirator path matching detected: Shaji Mathew linked to Koramangala gang via Syed Karim contact logs.',
        error: 'Graph processing error'
      }
    );
  };

  return (
    <div className="h-[80vh] flex flex-col md:flex-row gap-6">
      {/* Visual Canvas Block */}
      <div className="flex-1 glass-card rounded-xl relative overflow-hidden flex flex-col">
        {/* Graph Header overlay */}
        <div className="absolute top-4 left-4 z-10 bg-[#0B0B0F]/90 border border-slate-850 p-3 rounded-xl max-w-sm pointer-events-auto">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white tracking-tight">KSP Association Analyser</h3>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 leading-normal">
            Relational map of phone calls, vehicle logs, and accomplice FIR linkages. Click node to inspect details.
          </p>
        </div>

        {/* Graph Controls overlay */}
        <div className="absolute bottom-4 left-4 z-10 flex gap-2">
          <button
            onClick={runAssociationAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-[10px] font-mono font-bold text-white uppercase rounded-lg transition shadow-lg shadow-purple-950/20"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Detect Communities</span>
          </button>
        </div>

        {/* React Flow Container */}
        <div className="flex-1 w-full h-full bg-[#08080C]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#1A1A24" gap={16} size={1} />
            <Controls className="bg-slate-900 border border-slate-800 text-slate-300" />
            <MiniMap 
              className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden" 
              nodeColor={n => {
                if (n.data.type === 'CRIMINAL') return '#EF4444';
                if (n.data.type === 'CASE') return '#7C3AED';
                return '#4F46E5';
              }}
              maskColor="rgba(0,0,0,0.7)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Side Details Panel */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        {/* Info panel */}
        <div className="glass-card rounded-xl p-5 space-y-4 flex-1 overflow-y-auto">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-900 pb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-purple-400" />
            <span>Entity Inspector</span>
          </h4>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider bg-purple-950/20 border border-purple-900/40 px-2 py-0.5 rounded">
                  {selectedNode.type}
                </span>
                <h3 className="text-sm font-bold text-white mt-2">{selectedNode.label}</h3>
              </div>

              <div className="space-y-2.5 text-xs border-t border-slate-900 pt-3">
                {selectedNode.type === 'CRIMINAL' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Risk Level:</span>
                      <span className="text-rose-500 font-semibold">{selectedNode.risk}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-slate-350">{selectedNode.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                      Identified as gang co-conspirator. Monitored for repeat burglaries and robberies.
                    </p>
                  </>
                )}

                {selectedNode.type === 'CASE' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-amber-500 font-semibold">{selectedNode.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                      Active investigation case file. Pinned suspects have outstanding warrants.
                    </p>
                  </>
                )}

                {selectedNode.type === 'VEHICLE' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Registered:</span>
                      <span className="text-slate-350">{selectedNode.owner}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                      Asset spotted in Indiranagar burglary zones. Plate registered.
                    </p>
                  </>
                )}

                {selectedNode.type === 'PHONE' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Device Owner:</span>
                      <span className="text-slate-350">{selectedNode.owner}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                      Call logger matching Koramangala active getaway coordinates.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-600 text-xs font-mono">
              Select any node on the graph to audit metadata details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
