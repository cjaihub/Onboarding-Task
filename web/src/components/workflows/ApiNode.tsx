import { Handle, Position } from '@xyflow/react';
import { Globe, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function ApiNode({ data }: { data: Record<string, unknown> }) {
  const isRunning = data.status === 'RUNNING';
  const isSuccess = data.status === 'SUCCESS';
  const isFailed = data.status === 'FAILED';

  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-md min-w-[200px] overflow-hidden shadow-lg font-mono text-[11px] text-gray-300">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-gray-500 border-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#444]">
        <div className="flex items-center gap-2 text-gray-200">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold tracking-wide">HTTP REQUEST</span>
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
        <div className="flex items-center gap-2">
          <span className={`font-bold px-1.5 py-0.5 rounded ${data.method === 'POST' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'}`}>
            {(data.method as string) || 'GET'}
          </span>
          <span className="text-gray-400 truncate max-w-[150px]" title={(data.url as string) || 'No URL configured'}>
            {(data.url as string) || 'No URL configured'}
          </span>
        </div>
        
        {data.logs ? (
          <div className="mt-2 pt-2 border-t border-[#333] max-h-32 overflow-y-auto whitespace-pre-wrap">
            {String(data.logs)}
          </div>
        ) : null}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-gray-500 border-none" />
    </div>
  );
}
