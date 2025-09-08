'use client';

import React, { useState } from 'react';
import { Shield, User, Check, AlertCircle } from 'lucide-react';

interface Admin {
  _id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function AdminSetupPage() {
  const [email, setEmail] = useState('');
  const [clerkId, setClerkId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);

  const setUserAsAdmin = async () => {
    if (!email && !clerkId) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email hoặc Clerk ID' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, clerkId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `User ${data.user.email} has been granted admin privileges!` });
        setEmail('');
        setClerkId('');
        fetchAdmins(); // Refresh admin list
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/set-admin');
      const data = await response.json();
      if (response.ok) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  React.useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Admin Setup
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Grant admin privileges to users
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              OR
            </div>

            <div>
              <label htmlFor="clerkId" className="block text-sm font-medium text-gray-700">
                Clerk ID
              </label>
              <div className="mt-1">
                <input
                  id="clerkId"
                  name="clerkId"
                  type="text"
                  value={clerkId}
                  onChange={(e) => setClerkId(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user_xxx..."
                />
              </div>
            </div>

            {message && (
              <div className={`flex items-center p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.type === 'success' ? (
                  <Check className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <div>
              <button
                onClick={setUserAsAdmin}
                disabled={loading || (!email && !clerkId)}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading || (!email && !clerkId)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Grant Admin Access
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Current Admins List */}
        {admins.length > 0 && (
          <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Current Admins ({admins.length})
              </h3>
              <div className="space-y-3">
                {admins.map((admin, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {admin.fullName || `${admin.firstName} ${admin.lastName}` || 'No name'}
                        </p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
