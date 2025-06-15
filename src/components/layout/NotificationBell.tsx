import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

// Mock notification type - will be replaced with real types in later phases
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export function NotificationBell() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications - will be replaced with real API calls in later phases
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Welcome to ReviewAI',
        message: 'Complete your profile to get started with performance reviews.',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        read: false,
        actionUrl: '/profile',
      },
      {
        id: '2',
        title: 'System Update',
        message: 'ReviewAI has been updated with new features.',
        type: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: false,
      },
      {
        id: '3',
        title: 'Feedback Reminder',
        message: 'You have pending feedback requests to review.',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true,
        actionUrl: '/feedback',
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsDropdownOpen(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const baseClasses = "h-2 w-2 rounded-full";
    switch (type) {
      case 'success':
        return <div className={`${baseClasses} bg-green-400`} />;
      case 'warning':
        return <div className={`${baseClasses} bg-yellow-400`} />;
      case 'error':
        return <div className={`${baseClasses} bg-red-400`} />;
      default:
        return <div className={`${baseClasses} bg-blue-400`} />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        type="button"
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-primary-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isDropdownOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You're all caught up! Check back later for updates.
                </p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                      notification.read
                        ? 'border-transparent'
                        : 'border-primary-500 bg-primary-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          notification.read ? 'text-gray-900' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm ${
                          notification.read ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-primary-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <Link
                to="/notifications"
                className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => setIsDropdownOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

export default NotificationBell; 