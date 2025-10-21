'use client';

import { Card, CardHeader, CardTitle, Badge, Button } from '@neurobridge/ui';

export default function ProviderDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">NeuroBridge Provider</h1>
          <div className="flex items-center gap-4">
            <Badge variant="success">Active</Badge>
            <p className="text-sm text-gray-600">Dr. Provider, PMHNP</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Today's Visits</CardTitle></CardHeader>
            <p className="text-4xl font-bold text-primary-600">8</p>
            <p className="text-sm text-gray-600">3 completed, 5 remaining</p>
          </Card>

          <Card>
            <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Empathy Score</span>
                <span className="font-semibold">0.92</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Safety Score</span>
                <span className="font-semibold">0.98</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>AI Alerts</CardTitle></CardHeader>
            <Badge variant="info">2 active alerts</Badge>
            <p className="text-sm text-gray-600 mt-2">Drug interaction warnings</p>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Upcoming Visits</CardTitle></CardHeader>
          <div className="space-y-3">
            {[
              { patient: 'John D.', time: '2:00 PM', type: 'Follow-up' },
              { patient: 'Jane S.', time: '2:30 PM', type: 'Med Management' },
              { patient: 'Mike R.', time: '3:00 PM', type: 'Initial Eval' },
            ].map((visit, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{visit.patient}</p>
                  <p className="text-sm text-gray-600">{visit.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{visit.time}</p>
                  <Button size="sm" className="mt-2">Start Visit</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
