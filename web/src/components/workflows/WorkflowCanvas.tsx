'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeTypes,
  useOnSelectionChange,
  Node,
  Connection,
  Edge,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkflow, updateWorkflow, getWorkflowExecutions, getWorkflowExecutionSteps, executeWorkflow } from '@/api/workflows';
import { Save, ChevronLeft, Activity as ActivityIcon, CheckCircle2, XCircle, Clock, Play } from 'lucide-react';
import Link from 'next/link';

// We'll define custom nodes in step 4, for now use default or simple custom node
import TriggerNode from './TriggerNode';
import ActionNode from './ActionNode';
import LogicNode from './LogicNode';
import TerminalNode from './TerminalNode';
import ApiNode from './ApiNode';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  terminal: TerminalNode,
  api: ApiNode,
};

function WorkflowCanvasInner({ workflowId }: { workflowId: number }) {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'executions'>('inspector');
  const [selectedExecution, setSelectedExecution] = useState<number | null>(null);

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNode(nodes.length > 0 ? nodes[0] : null);
      if (nodes.length > 0) setActiveTab('inspector');
    },
  });
  
  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => getWorkflow(workflowId),
  });

  const { data: executions } = useQuery({
    queryKey: ['workflowExecutions', workflowId],
    queryFn: () => getWorkflowExecutions(workflowId),
    refetchInterval: 2000, // Live updates every 2s
  });

  const { data: executionSteps } = useQuery({
    queryKey: ['workflowExecutionSteps', selectedExecution],
    queryFn: () => selectedExecution ? getWorkflowExecutionSteps(selectedExecution) : Promise.resolve([]),
    enabled: !!selectedExecution,
    refetchInterval: 2000,
  });

  // Highlight nodes based on execution steps
  useEffect(() => {
    if (executionSteps && executionSteps.length > 0) {
      setNodes((nds) => 
        nds.map(n => {
          const step = executionSteps.find(s => s.node_id === n.id);
          if (step) {
            n.style = { ...n.style, 
              boxShadow: step.status === 'SUCCESS' ? '0 0 0 4px #22c55e' : 
                         step.status === 'FAILED' ? '0 0 0 4px #ef4444' : 
                         step.status === 'RUNNING' ? '0 0 0 4px #eab308' : undefined
            };
            // Remove the pulse class if we had one
            n.className = n.className?.replace(' animate-pulse', '') || '';
            if (step.status === 'RUNNING') {
               n.className += ' animate-pulse';
            }
            n.data = { ...n.data, status: step.status, logs: step.logs };
          } else {
            n.style = { ...n.style, boxShadow: undefined };
            n.className = n.className?.replace(' animate-pulse', '') || '';
          }
          return n;
        })
      );
      
      // Update edges
      setEdges((eds) => 
        eds.map(e => {
          const targetStep = executionSteps.find(s => s.node_id === e.target);
          const sourceStep = executionSteps.find(s => s.node_id === e.source);
          
          if (targetStep && targetStep.status === 'RUNNING') {
             return { ...e, animated: true, style: { stroke: '#eab308', strokeWidth: 2 } };
          } else if (sourceStep && sourceStep.status === 'SUCCESS') {
             return { ...e, animated: false, style: { stroke: '#22c55e', strokeWidth: 2 } };
          } else if (sourceStep && sourceStep.status === 'FAILED') {
             return { ...e, animated: false, style: { stroke: '#ef4444', strokeWidth: 2 } };
          }
          return { ...e, animated: false, style: { stroke: '#374151' } };
        })
      );
    } else {
      setNodes((nds) => nds.map(n => ({ ...n, style: { ...n.style, boxShadow: undefined }, className: n.className?.replace(' animate-pulse', '') || '' })));
      setEdges((eds) => eds.map(e => ({ ...e, animated: false, style: { stroke: '#374151' } })));
    }
  }, [executionSteps, setNodes, setEdges]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateWorkflow(workflowId, { definition: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      alert('Workflow saved!');
    }
  });

  const executeMutation = useMutation({
    mutationFn: () => executeWorkflow(workflowId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflowExecutions', workflowId] });
      setActiveTab('executions');
      setSelectedExecution(data.execution_id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      alert(`Execution failed to start: ${err.message}`);
    }
  });

  // Load from DB
  useEffect(() => {
    if (workflow?.definition) {
      setNodes((workflow.definition.nodes || []) as Node[]);
      setEdges((workflow.definition.edges || []) as Edge[]);
    }
  }, [workflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onSave = useCallback(() => {
    updateMutation.mutate({ nodes, edges });
  }, [nodes, edges, updateMutation]);

  if (isLoading) return <div className="p-8">Loading canvas...</div>;
  if (!workflow) return <div className="p-8">Workflow not found.</div>;

  return (
      <div className="flex h-screen flex-col bg-[#0f1115]">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-800 bg-[#16181d] px-4">
          <div className="flex items-center gap-4">
            <Link href="/workflows" className="text-gray-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-white">{workflow.name}</h1>
              <p className="text-[10px] text-gray-500">{workflow.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => executeMutation.mutate()}
              disabled={executeMutation.isPending}
              className="flex items-center gap-2 rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-green-400" /> Run Workflow
            </button>
            <button
              onClick={onSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Mobile Linear View */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4 relative">
            <h2 className="text-sm font-bold text-white mb-4">Workflow Steps (Read Only)</h2>
            {nodes.map((node, i) => (
              <div key={node.id} className="bg-[#16181d] border border-gray-800 rounded-xl p-4 flex gap-4 items-start relative">
                {/* Visual connecting line */}
                {i !== nodes.length - 1 && (
                  <div className="absolute left-[29px] top-12 bottom-[-16px] w-0.5 bg-gray-800 z-0" />
                )}
                
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-700 bg-gray-900 text-xs text-gray-500 z-10 shadow-md">
                  {i + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-white capitalize">{node.type} Node</h3>
                    <span className="text-[10px] text-gray-500 font-mono bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">{node.id}</span>
                  </div>
                  <p className="text-xs text-red-400 mt-1.5 font-medium">{node.data.label as string}</p>
                  
                  {node.data.type_id === 'action_change_status' && (
                    <div className="mt-2 text-xs bg-gray-900/50 p-2 rounded border border-gray-800">
                      <span className="text-gray-500">Target Status: </span>
                      <span className="text-white font-medium">{node.data.status as string || 'OPEN'}</span>
                    </div>
                  )}
                  {node.data.type_id === 'action_add_comment' && (
                    <div className="mt-2 text-xs bg-gray-900/50 p-2 rounded border border-gray-800">
                      <span className="text-gray-500">Comment: </span>
                      <span className="text-white font-medium italic">&quot;{node.data.message as string || '...'}&quot;</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {nodes.length === 0 && (
              <div className="text-center p-6 border border-dashed border-gray-800 rounded-xl mt-4">
                <p className="text-xs text-gray-500 font-medium">No nodes in this workflow.</p>
              </div>
            )}
            
            <div className="text-center p-6 border border-dashed border-gray-800 rounded-xl mt-6 bg-[#16181d]">
              <ActivityIcon className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">To edit this workflow visually, open Usalama Command Center on a desktop device.</p>
            </div>
          </div>

          {/* Left Sidebar (Node Palette) */}
          <div className="w-64 border-r border-gray-800 bg-[#16181d] p-4 text-white hidden md:block">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Nodes</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs text-gray-400 mb-2">Triggers</h4>
                <div
                  className="rounded border border-red-900 bg-red-900/20 p-2 text-sm cursor-grab"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', 'trigger');
                    e.dataTransfer.setData('type_id', 'trigger_work_item_created');
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  Work Item Created
                </div>
              </div>
              <div>
                <h4 className="text-xs text-gray-400 mb-2">Actions</h4>
                <div
                  className="rounded border border-green-900 bg-green-900/20 p-2 text-sm cursor-grab mb-2"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', 'action');
                    e.dataTransfer.setData('type_id', 'action_change_status');
                  }}
                >
                  Change Status
                </div>
                <div
                  className="rounded border border-green-900 bg-green-900/20 p-2 text-sm cursor-grab mb-4"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', 'action');
                    e.dataTransfer.setData('type_id', 'action_add_comment');
                  }}
                >
                  Add Comment
                </div>

                <h4 className="text-xs text-gray-400 mb-2 mt-4">Integrations</h4>
                <div
                  className="rounded border border-blue-900 bg-blue-900/20 p-2 text-sm cursor-grab mb-2 flex items-center justify-between"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', 'api');
                    e.dataTransfer.setData('type_id', 'action_api');
                  }}
                >
                  <span>HTTP Request</span>
                </div>
                
                <h4 className="text-xs text-gray-400 mb-2 mt-4">Local Development</h4>
                <div
                  className="rounded border border-gray-600 bg-gray-800 p-2 text-sm cursor-grab flex items-center justify-between"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', 'terminal');
                    e.dataTransfer.setData('type_id', 'action_cli_command');
                  }}
                >
                  <span className="font-mono text-gray-300">Terminal Command</span>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Area (Desktop only) */}
          <div className="hidden md:flex flex-1 relative">
            {/* Tabs for Sidebar */}
            <div className="absolute top-4 right-4 z-10 flex bg-gray-900 rounded-lg p-1 border border-gray-800">
              <button 
                onClick={() => setActiveTab('inspector')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'inspector' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Inspector
              </button>
              <button 
                onClick={() => setActiveTab('executions')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'executions' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Executions
              </button>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const type = e.dataTransfer.getData('application/reactflow');
                const typeId = e.dataTransfer.getData('type_id');
                
                if (!type) return;

                // Compute mouse position relative to canvas
                const position = {
                  x: e.clientX - 256 - 50, // crude offset
                  y: e.clientY - 56 - 20,
                };

                const newNode = {
                  id: `node_${Date.now()}`,
                  type,
                  position,
                  data: { label: typeId, type_id: typeId },
                };
              setNodes((nds) => nds.concat(newNode));
            }}
            fitView
            className="bg-[#0f1115]"
          >
            <Background color="#1e2128" gap={16} />
            <Controls className="bg-gray-800 border-gray-700 fill-white" />
          </ReactFlow>
        </div>

        {/* Right Sidebar (Inspector & Executions) */}
        <div className="w-80 border-l border-gray-800 bg-[#16181d] flex flex-col text-white hidden lg:flex">
          {activeTab === 'inspector' && selectedNode ? (
            <div className="p-4 overflow-y-auto">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Node Inspector</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Node ID</label>
                  <div className="bg-[#0f1115] border border-gray-800 rounded p-2 text-sm text-gray-500 font-mono">
                    {selectedNode.id}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Label</label>
                  <input
                    type="text"
                    value={selectedNode.data.label as string}
                    onChange={(e) => {
                      setNodes((nds) =>
                        nds.map((n) => {
                          if (n.id === selectedNode.id) {
                            n.data = { ...n.data, label: e.target.value };
                          }
                          return n;
                        })
                      );
                    }}
                    className="w-full bg-[#0f1115] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Dynamic properties based on type_id */}
                {selectedNode.data.type_id === 'action_change_status' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">New Status</label>
                    <select
                      value={(selectedNode.data.status as string) || 'OPEN'}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) => {
                            if (n.id === selectedNode.id) {
                              n.data = { ...n.data, status: e.target.value };
                            }
                            return n;
                          })
                        );
                      }}
                      className="w-full bg-[#0f1115] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                )}

                {selectedNode.data.type_id === 'action_add_comment' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Comment Message</label>
                    <textarea
                      value={(selectedNode.data.message as string) || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) => {
                            if (n.id === selectedNode.id) {
                              n.data = { ...n.data, message: e.target.value };
                            }
                            return n;
                          })
                        );
                      }}
                      className="w-full bg-[#0f1115] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500 min-h-[100px]"
                      placeholder="Enter automated comment..."
                    />
                  </div>
                )}
                
                {selectedNode.data.type_id === 'action_cli_command' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Terminal Command</label>
                    <textarea
                      value={(selectedNode.data.command as string) || ''}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) => {
                            if (n.id === selectedNode.id) {
                              n.data = { ...n.data, command: e.target.value };
                            }
                            return n;
                          })
                        );
                      }}
                      className="w-full bg-[#0f1115] border border-gray-800 rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-red-500 min-h-[100px]"
                      placeholder="e.g. npm run test"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 mt-2 flex items-start gap-1">
                      <span className="text-yellow-500 font-bold">!</span> 
                      Commands execute directly on the local agent backend instance.
                    </p>
                  </div>
                )}

                {selectedNode.data.type_id === 'action_api' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">HTTP Method</label>
                      <select
                        value={(selectedNode.data.method as string) || 'GET'}
                        onChange={(e) => {
                          setNodes((nds) =>
                            nds.map((n) => {
                              if (n.id === selectedNode.id) {
                                n.data = { ...n.data, method: e.target.value };
                              }
                              return n;
                            })
                          );
                        }}
                        className="w-full bg-[#0f1115] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">URL</label>
                      <input
                        type="url"
                        value={(selectedNode.data.url as string) || ''}
                        onChange={(e) => {
                          setNodes((nds) =>
                            nds.map((n) => {
                              if (n.id === selectedNode.id) {
                                n.data = { ...n.data, url: e.target.value };
                              }
                              return n;
                            })
                          );
                        }}
                        className="w-full bg-[#0f1115] border border-gray-800 rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                        placeholder="https://api.example.com/v1/..."
                      />
                    </div>
                    {['POST', 'PUT'].includes((selectedNode.data.method as string) || 'GET') && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">JSON Payload</label>
                        <textarea
                          value={(selectedNode.data.body as string) || ''}
                          onChange={(e) => {
                            setNodes((nds) =>
                              nds.map((n) => {
                                if (n.id === selectedNode.id) {
                                  n.data = { ...n.data, body: e.target.value };
                                }
                                return n;
                              })
                            );
                          }}
                          className="w-full bg-[#0f1115] border border-gray-800 rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-red-500 min-h-[100px]"
                          placeholder='{"key": "value"}'
                        />
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            </div>
          ) : activeTab === 'inspector' && !selectedNode ? (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-xl border border-gray-800 bg-gray-900 flex items-center justify-center mb-4">
                <ActivityIcon className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-300">No Node Selected</h3>
              <p className="text-xs text-gray-500 mt-1">Select a node on the canvas to configure its properties.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Execution History</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {executions?.length === 0 && (
                  <div className="text-center text-xs text-gray-500 py-8">No executions yet.</div>
                )}
                {executions?.map(exe => {
                  const duration = exe.completed_at ? ((new Date(exe.completed_at).getTime() - new Date(exe.started_at).getTime()) / 1000).toFixed(2) : null;
                  
                  return (
                  <div 
                    key={exe.id}
                    onClick={() => setSelectedExecution(selectedExecution === exe.id ? null : exe.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedExecution === exe.id 
                        ? 'bg-red-900/20 border-red-800/50' 
                        : 'bg-[#0f1115] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {exe.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {exe.status === 'FAILED' && <XCircle className="w-4 h-4 text-red-500" />}
                        {exe.status === 'RUNNING' && <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />}
                        <span className="text-sm font-bold text-gray-200">Execution #{exe.id}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{new Date(exe.started_at).toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                      <span>{workflow.name}</span>
                      {duration && <span>{duration}s</span>}
                    </div>
                    
                    {selectedExecution === exe.id && executionSteps && (
                      <div className="mt-3 pt-3 border-t border-gray-800/50 space-y-3">
                        {executionSteps.map(step => (
                          <div key={step.id} className="text-xs">
                            <div className="flex justify-between text-gray-400">
                              <span>{step.node_id}</span>
                              <span className={
                                step.status === 'SUCCESS' ? 'text-green-400' :
                                step.status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'
                              }>{step.status}</span>
                            </div>
                            {step.error && <div className="text-red-400 mt-1 break-all bg-red-900/20 p-1 rounded">{step.error}</div>}
                            {step.logs && <div className="text-gray-500 mt-1 break-all italic">{step.logs}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
  );
}

export function WorkflowCanvas({ workflowId }: { workflowId: number }) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner workflowId={workflowId} />
    </ReactFlowProvider>
  );
}
