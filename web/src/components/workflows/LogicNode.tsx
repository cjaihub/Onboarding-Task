import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function LogicNode({ data }: NodeProps) {
  return (
    <div className="bg-[#1e2128] border-2 border-orange-600 rounded-lg shadow-xl w-48 text-white">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-500" />
      <div className="flex items-center gap-2 p-2 bg-orange-600/20 border-b border-orange-600/30 rounded-t-lg">
        <GitBranch className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Logic</span>
      </div>
      <div className="p-3">
        <div className="text-xs font-medium truncate">{data.label as string}</div>
      </div>
      <Handle type="source" position={Position.Right} id="true" style={{ top: 20 }} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Right} id="false" style={{ top: 50 }} className="w-3 h-3 bg-red-500" />
    </div>
  );
}
