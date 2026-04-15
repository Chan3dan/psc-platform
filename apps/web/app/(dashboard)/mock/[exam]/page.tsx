import { Suspense } from 'react';
import { MockTestPageInner } from '@/components/exam/MockTestPageInner';

export default function MockTestPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading test…</p>
        </div>
      </div>
    }>
      <MockTestPageInner />
    </Suspense>
  );
}
