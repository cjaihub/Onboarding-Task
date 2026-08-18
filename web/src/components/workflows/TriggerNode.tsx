import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';

export default function TriggerNode({ data }: NodeProps) {
  return (
    <div className="bg-[#1e2128] border-2 border-red-600 rounded-lg shadow-xl w-48 text-white">
      <div className="flex items-center gap-2 p-2 bg-red-600/20 border-b border-red-600/30 rounded-t-lg">
        <Zap className="w-4 h-4 text-red-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-red-100">Trigger</span>
      </div>
      <div className="p-3">
        <div className="text-xs font-medium truncate">{data.label as string}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-red-500" />
    </div>
  );
}
