'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getWorkflows } from '@/api/workflows';
import { fetchWorkItems } from '@/api/workItems';
import { Network, Search, X, Briefcase } from 'lucide-react';

// Debounce hook for smooth typing search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  
  const debouncedSearch = useDebounce(search, 300);

  // Search workflows (backend filtering via ?search=)
  const { data: workflows, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['workflows', 'search', debouncedSearch],
    queryFn: () => getWorkflows(debouncedSearch),
    enabled: open,
  });

  // Search work items (backend filtering via ?search=)
  const { data: workItemsData, isLoading: loadingWorkItems } = useQuery({
    queryKey: ['workItems', 'search', debouncedSearch],
    queryFn: () => fetchWorkItems(debouncedSearch ? { search: debouncedSearch } : undefined),
    enabled: open,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    
    // Custom event to open from the Header
    const handleOpenSearch = (e: CustomEvent) => {
      setOpen(true);
      if (e.detail?.query !== undefined) {
        setSearch(e.detail.query);
      }
    };
    document.addEventListener('open-command-palette', handleOpenSearch as EventListener);
    
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('open-command-palette', handleOpenSearch as EventListener);
    };
  }, []);

  if (!open) return null;

  const workItems = workItemsData?.results || [];
  const wfItems = workflows || [];
  
  const isLoading = loadingWorkflows || loadingWorkItems;
  const noResults = !isLoading && workItems.length === 0 && wfItems.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center md:pt-[20vh] bg-black/50 backdrop-blur-sm">
      <div className="bg-[#16181d] md:border md:border-gray-800 md:rounded-xl w-full h-full md:h-auto md:max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex items-center px-4 py-4 md:py-3 border-b border-gray-800 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-3 shrink-0">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-white focus:outline-none placeholder:text-gray-500"
            placeholder="Search work items or workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => setOpen(false)} className="p-2 md:p-1 rounded-md hover:bg-gray-800 text-gray-500 hover:text-white">
            <X className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        </div>
        <div className="flex-1 md:max-h-[60vh] overflow-y-auto p-2">
          {isLoading && (
            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
          )}
          
          {!isLoading && noResults && (
            <div className="p-4 text-center text-sm text-gray-500">No results found for &quot;{search}&quot;.</div>
          )}
          
          {!isLoading && !noResults && (
            <div className="space-y-4">
              {workItems.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Tasks</div>
                  {workItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setOpen(false);
                        router.push(`/work-items/${item.id}`);
                      }}
                      className="w-full text-left flex items-center px-3 py-2.5 rounded-lg hover:bg-gray-800 hover:text-white text-gray-400 group transition-colors"
                    >
                      <Briefcase className="w-4 h-4 mr-3 group-hover:text-red-500 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-white truncate">{item.reference_number}</span>
                        <span className="text-xs text-gray-500 truncate">{item.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {wfItems.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflows</div>
                  {wfItems.map(w => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setOpen(false);
                        router.push(`/workflows/${w.id}`);
                      }}
                      className="w-full text-left flex items-center px-3 py-2.5 rounded-lg hover:bg-gray-800 hover:text-white text-gray-400 group transition-colors"
                    >
                      <Network className="w-4 h-4 mr-3 group-hover:text-red-500 shrink-0" />
                      <span className="font-medium truncate">{w.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
