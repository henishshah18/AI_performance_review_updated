import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getNavigationItems } from '../../utils/routes';

// Icons
import {
  HomeIcon,
  TargetIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import {
  HomeIcon as HomeSolidIcon,
  TargetIcon as TargetSolidIcon,
  UsersIcon as UsersSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  StarIcon as StarSolidIcon,
  DocumentTextIcon as DocumentSolidIcon,
  ChartBarIcon as ChartSolidIcon,
  ClipboardDocumentListIcon as ClipboardSolidIcon,
  CalendarIcon as CalendarSolidIcon,
  Cog6ToothIcon as CogSolidIcon,
} from '@heroicons/react/24/solid';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap = {
  home: { outline: HomeIcon, solid: HomeSolidIcon },
  target: { outline: TargetIcon, solid: TargetSolidIcon },
  users: { outline: UsersIcon, solid: UsersSolidIcon },
  chat: { outline: ChatBubbleLeftRightIcon, solid: ChatSolidIcon },
  star: { outline: StarIcon, solid: StarSolidIcon },
  document: { outline: DocumentTextIcon, solid: DocumentSolidIcon },
  chart: { outline: ChartBarIcon, solid: ChartSolidIcon },
  clipboard: { outline: ClipboardDocumentListIcon, solid: ClipboardSolidIcon },
  calendar: { outline: CalendarIcon, solid: CalendarSolidIcon },
  cog: { outline: Cog6ToothIcon, solid: CogSolidIcon },
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navigationItems = getNavigationItems(user.role);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getIcon = (iconName: string, active: boolean) => {
    const icons = iconMap[iconName as keyof typeof iconMap];
    if (!icons) return null;
    
    const IconComponent = active ? icons.solid : icons.outline;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Sidebar content */}
            <SidebarContent 
              navigationItems={navigationItems} 
              isActive={isActive} 
              getIcon={getIcon}
              onItemClick={onClose}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <SidebarContent 
            navigationItems={navigationItems} 
            isActive={isActive} 
            getIcon={getIcon}
          />
        </div>
      </div>
    </>
  );
}

interface SidebarContentProps {
  navigationItems: Array<{
    path: string;
    label: string;
    icon: string;
  }>;
  isActive: (path: string) => boolean;
  getIcon: (iconName: string, active: boolean) => React.ReactNode;
  onItemClick?: () => void;
}

function SidebarContent({ navigationItems, isActive, getIcon, onItemClick }: SidebarContentProps) {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      {/* User info section */}
      <div className="flex items-center flex-shrink-0 px-4 mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600">
              {user?.first_name?.charAt(0).toUpperCase()}
              {user?.last_name?.charAt(0).toUpperCase() || ''}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navigationItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                active
                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`mr-3 flex-shrink-0 ${
                active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
              }`}>
                {getIcon(item.icon, active)}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section - Role indicator */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-2 w-2 rounded-full ${
              user?.role === 'hr_admin' ? 'bg-purple-400' :
              user?.role === 'manager' ? 'bg-blue-400' : 'bg-green-400'
            }`} />
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-900 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
            <p className="text-xs text-gray-500">
              {user?.department?.name || 'No Department'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar; 