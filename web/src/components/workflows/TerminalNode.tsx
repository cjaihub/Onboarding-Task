import { Handle, Position } from '@xyflow/react';
import { Terminal, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function TerminalNode({ data }: { data: Record<string, unknown> }) {
  const isRunning = data.status === 'RUNNING';
  const isSuccess = data.status === 'SUCCESS';
  const isFailed = data.status === 'FAILED';

  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-md min-w-[250px] overflow-hidden shadow-lg font-mono text-[11px] text-gray-300">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-gray-500 border-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#444]">
        <div className="flex items-center gap-2 text-gray-200">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-bold tracking-wide">TERMINAL</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isRunning && <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />}
          {isSuccess && <CheckCircle2 className="w-3 h-3 text-green-500" />}
          {isFailed && <XCircle className="w-3 h-3 text-red-500" />}
          {!isRunning && !isSuccess && !isFailed && <div className="w-2 h-2 rounded-full bg-gray-500" />}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="text-gray-400">
          <span className="text-green-400 mr-2">❯</span>
          {(data.command as string) || 'echo "No command configured"'}
        </div>
        
        {data.logs && (
          <div className="mt-2 pt-2 border-t border-[#333] max-h-32 overflow-y-auto whitespace-pre-wrap">
            {String(data.logs)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-gray-500 border-none" />
    </div>
  );
}
