'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

type UsageMetric = {
  currentUsage: number;
  serviceLimit: number;
  remaining: number;
  canUse: boolean;
  display: string;
};

type UsageResponse = {
  hasActivePackage: boolean;
  selectedPackage?: {
    id: string;
    name: string;
    price: number;
    startDate: string;
    endDate: string;
    type: 'PAID' | 'FREE';
  };
  usage?: {
    avatarInterview: UsageMetric;
    testQuizEQ: UsageMetric;
    jdUpload: UsageMetric;
  };
  timeInfo?: {
    endDate: string;
    daysRemaining: number;
    isTimeValid: boolean;
  };
  error?: string;
  message?: string;
};

type PaymentItem = {
  id: string;
  orderCode: string;
  amount: number;
  refundAmount: number;
  description: string;
  status: string;
  paymentMethod?: string | null;
  transactionId?: string | null;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  paidAt?: string | null;
  createdAt: string;
  servicePackage?: { id: string; name: string; price: number } | null;
};

export default function UsagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  const fetchUsage = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user-package/check-active');
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to load usage');
        setData(null);
        return;
      }
      setData(json as UsageResponse);
    } catch {
      setError('Failed to load usage');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage(true);
    // load payments
    (async () => {
      try {
        const r = await fetch('/api/payments/history');
        const j = await r.json();
        if (r.ok) setPayments(j.data || []);
      } catch {}
    })();
    const id = setInterval(() => {
      setRefreshing(true);
      fetchUsage(false).finally(() => setRefreshing(false));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const renderCard = (title: string, metric?: UsageMetric) => (
    <div className="rounded-xl border bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {metric && (
          <span className={`text-xs px-2 py-1 rounded-full ${metric.canUse ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {metric.canUse ? 'Available' : 'Exhausted'}
          </span>
        )}
      </div>
      {metric ? (
        <>
          <div className="text-2xl font-semibold text-gray-900">{metric.display}</div>
          <div className="text-xs text-gray-500 mt-1">Remaining: {metric.remaining} / Limit: {metric.serviceLimit}</div>
          <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-2 ${metric.canUse ? 'bg-purple-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, (metric.currentUsage / Math.max(1, metric.serviceLimit)) * 100))}%` }}
            />
          </div>
          {!metric.canUse && (
            <div className="mt-3">
              <a href="/Pricing" className="inline-block text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md">Upgrade</a>
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-gray-500">No data</div>
      )}
    </div>
  );

  type PackageListItem = { id: string; name: string; price: number; type: 'PAID' | 'FREE'; isActive: boolean; endDate?: string };
  const hasPaidActive = useMemo(() => {
    const items = (data as { allPackages?: PackageListItem[] } | null | undefined)?.allPackages || [];
    const now = new Date();
    return items.some(pkg => pkg.type === 'PAID' && pkg.isActive && (!pkg.endDate || new Date(pkg.endDate) >= now));
  }, [data]);
  const packageList = useMemo(() => {
    const items = (data as { allPackages?: PackageListItem[] } | null | undefined)?.allPackages;
    if (!items || !items.length) return null;
    const currentId = data?.selectedPackage?.id;
    return (
      <div className="rounded-xl border bg-white shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">All Packages</h3>
          <button
            onClick={() => { setRefreshing(true); fetchUsage(false).finally(() => setRefreshing(false)); }}
            className="text-xs px-3 py-1 border rounded-md hover:bg-gray-50"
          >{refreshing ? 'Refreshing...' : 'Refresh'}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(pkg => (
            <div key={pkg.id} className={`p-4 rounded-lg border ${pkg.id === currentId ? 'border-purple-500 bg-purple-50/50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{pkg.name} <span className="text-xs text-gray-500">({pkg.type})</span></div>
                  <div className="text-xs text-gray-500">Ends: {pkg.endDate ? new Date(pkg.endDate).toLocaleDateString() : '—'}</div>
                </div>
                <div>
                  {pkg.id === currentId ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Current</span>
                  ) : (
                    <a href="/Pricing" className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50">Upgrade</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [data, refreshing]);

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="relative container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Usage</h1>
            <p className="text-sm text-gray-600">Your current package and remaining credits</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
          ) : (
            <>
              {data?.selectedPackage && (
                <div className="rounded-xl border bg-white shadow-sm p-5 mb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-500">Current Package</div>
                      <div className="text-lg font-semibold text-gray-900">{data.selectedPackage.name} ({data.selectedPackage.type})</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Ends on: {data.timeInfo?.endDate ? new Date(data.timeInfo.endDate).toLocaleDateString() : '—'}
                      {typeof data.timeInfo?.daysRemaining === 'number' && (
                        <span className="ml-2">({data.timeInfo.daysRemaining} days left)</span>
                      )}
                    </div>
                    <div>
                      <a href="/Pricing" className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md">
                        {hasPaidActive ? 'Change plan' : 'Upgrade'}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {packageList}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderCard('AI Interview Sessions', data?.usage?.avatarInterview)}
                {renderCard('EQ/Quiz Sessions', data?.usage?.testQuizEQ)}
                {renderCard('JD Uploads', data?.usage?.jdUpload)}
              </div>

              {/* Payment History */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Payment History</h3>
                {payments.length === 0 ? (
                  <div className="text-sm text-gray-500">No payments found</div>
                ) : (
                  <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left p-3">Date</th>
                          <th className="text-left p-3">Order</th>
                          <th className="text-left p-3">Package</th>
                          <th className="text-left p-3">Amount</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id} className="border-t">
                            <td className="p-3 text-gray-700">{new Date(p.createdAt).toLocaleString()}</td>
                            <td className="p-3 text-gray-700">{p.orderCode}</td>
                            <td className="p-3 text-gray-700">{p.servicePackage?.name || p.description}</td>
                            <td className="p-3 text-gray-900 font-medium">{(p.amount - (p.refundAmount || 0)).toLocaleString()}₫</td>
                            <td className="p-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'success' ? 'bg-green-50 text-green-700' : p.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>{p.status}</span>
                            </td>
                            <td className="p-3">
                              {p.checkoutUrl ? (
                                <a className="text-xs text-purple-700 hover:underline" href={p.checkoutUrl} target="_blank">Open</a>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
}


