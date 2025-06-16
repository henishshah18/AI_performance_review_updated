import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRouteForRole } from '../../utils/routes';

// Icons
import {
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export function Header({ onMobileMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isGiveFeedbackModalOpen, setIsGiveFeedbackModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoClick = () => {
    if (user) {
      navigate(getDefaultRouteForRole(user.role));
    }
  };

  const getSettingsRoute = () => {
    if (!user) return '/settings';
    
    switch (user.role) {
      case 'hr_admin':
        return '/settings';
      case 'manager':
      case 'individual_contributor':
        return '/settings';
      default:
        return '/settings';
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section: Mobile menu button + Logo */}
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                onClick={onMobileMenuToggle}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>

              {/* Logo */}
              <div className="flex-shrink-0 ml-2 md:ml-0">
                <button
                  onClick={handleLogoClick}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md p-1"
                >
                  <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">R</span>
                  </div>
                  <span className="hidden sm:block text-xl font-bold">ReviewAI</span>
                </button>
              </div>
            </div>

            {/* Right section: Give Feedback + Notifications + Profile */}
            <div className="flex items-center space-x-4">
              {/* Give Feedback Button */}
              <button
                onClick={() => setIsGiveFeedbackModalOpen(true)}
                className="hidden sm:inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Give Feedback
              </button>

              {/* Mobile Give Feedback Button */}
              <button
                onClick={() => setIsGiveFeedbackModalOpen(true)}
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-purple-600 hover:text-purple-700 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                aria-label="Give feedback"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </button>

              {/* Notification Bell */}
              <button
                className="relative inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                aria-label="Notifications"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  aria-label="User menu"
                  aria-expanded={isProfileDropdownOpen}
                >
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    {user?.first_name ? (
                      <span className="text-sm font-medium text-gray-700">
                        {user.first_name.charAt(0).toUpperCase()}
                        {user.last_name?.charAt(0).toUpperCase() || ''}
                      </span>
                    ) : (
                      <UserCircleIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <p className="text-xs text-gray-400 mt-1 capitalize">
                          {user?.role?.replace('_', ' ')}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <UserCircleIcon className="h-4 w-4 mr-3 text-gray-400" />
                        View Profile
                      </Link>

                      <Link
                        to={getSettingsRoute()}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Settings
                      </Link>

                      <Link
                        to="/help"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <QuestionMarkCircleIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Help & Support
                      </Link>

                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {isProfileDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileDropdownOpen(false)}
          />
        )}
      </header>

      {/* Global Feedback Modal - Placeholder for Phase 5 */}
      {isGiveFeedbackModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Give Feedback</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Feedback functionality will be available in Phase 5.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setIsGiveFeedbackModalOpen(false)}
                  className="px-4 py-2 bg-purple-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header; 