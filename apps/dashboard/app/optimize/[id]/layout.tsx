'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  FileSearch,
  Wrench,
  Search,
  Rocket,
  ArrowLeft,
} from 'lucide-react';

const steps = [
  { id: 'analyze', label: 'Analyze', icon: FileSearch },
  { id: 'optimize', label: 'Optimize', icon: Wrench },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'publish', label: 'Publish', icon: Rocket },
];

export default function OptimizeLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const articleId = params.id as string;
  const currentStep = pathname.split('/').pop() || 'analyze';

  const getStepIndex = (stepId: string) => {
    return steps.findIndex(s => s.id === stepId);
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/articles')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Articles</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = index < currentIndex;
              const isDisabled = index > currentIndex;

              return (
                <div key={step.id} className="flex items-center">
                  {index > 0 && (
                    <div className={`w-8 h-0.5 ${
                      isPast ? 'bg-blue-500' : 'bg-gray-200'
                    }`} />
                  )}
                  <button
                    onClick={() => !isDisabled && router.push(`/optimize/${articleId}/${step.id}`)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                    {isActive && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {index + 1}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
