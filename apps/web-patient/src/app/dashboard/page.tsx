'use client';

import { Card, CardHeader, CardTitle, Badge } from '@neurobridge/ui';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">NeuroBridge</h1>
          <Badge variant="success">Active</Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Patient!</h2>
          <p className="text-gray-600">Manage your appointments, track progress, and earn rewards.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Points & Streaks</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-3xl font-bold text-primary-600">1,250</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold">7 days 🔥</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Appointment</CardTitle>
            </CardHeader>
            <div>
              <p className="text-lg font-semibold">Dr. Smith</p>
              <p className="text-gray-600">Tomorrow at 2:00 PM</p>
              <p className="text-sm text-primary-600 mt-2">Video Call</p>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges Earned</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">🎯 First Visit</Badge>
              <Badge variant="success">💪 7-Day Streak</Badge>
              <Badge variant="warning">📚 Education Pro</Badge>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Completed check-in</p>
                <p className="text-sm text-gray-600">+25 points</p>
              </div>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Video visit with Dr. Smith</p>
                <p className="text-sm text-gray-600">+50 points</p>
              </div>
              <p className="text-sm text-gray-500">Yesterday</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
