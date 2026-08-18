import { Handle, Position, NodeProps } from '@xyflow/react';
import { PlayCircle, Settings } from 'lucide-react';

export default function ActionNode({ data }: NodeProps) {
  return (
    <div className="bg-[#1e2128] border-2 border-green-600 rounded-lg shadow-xl w-48 text-white">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-500" />
      <div className="flex items-center gap-2 p-2 bg-green-600/20 border-b border-green-600/30 rounded-t-lg">
        <Settings className="w-4 h-4 text-green-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-green-100">Action</span>
      </div>
      <div className="p-3">
        <div className="text-xs font-medium truncate">{data.label as string}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-gray-500" />
    </div>
  );
}
