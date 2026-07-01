'use client';

import { 
  LayoutDashboard, 
  FileText, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  Settings,
  Wand2
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'new-article', label: 'New Article', icon: FileText, href: '/new-article' },
  { id: 'optimize', label: 'Optimize', icon: Sparkles, href: '/optimize' },
  { id: 'topic-planner', label: 'Topic Planner', icon: Calendar, href: '/topic-planner' },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen, href: '/knowledge' },
  { id: 'prompt-studio', label: 'Prompt Studio', icon: Wand2, href: '/prompt-studio' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Health Content AI</h1>
        <p className="text-sm text-gray-500 mt-1">AI Editorial Platform</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">AI</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">AI Editor</p>
            <p className="text-xs text-gray-500">Local Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
