'use client';

import { Card, CardHeader, CardTitle, Badge, Button } from '@neurobridge/ui';

export default function VisitPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Visit: {params.id}</h1>
          <div className="flex gap-2">
            <Badge variant="warning">In Progress</Badge>
            <span className="text-sm text-gray-600">15:23 elapsed</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Patient: John Doe</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-600">Age:</span> 34</div>
              <div><span className="text-gray-600">Diagnosis:</span> MDD, GAD</div>
              <div><span className="text-gray-600">Allergies:</span> None</div>
              <div><span className="text-gray-600">Current Meds:</span> Prozac 20mg</div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>SOAP Notes</CardTitle></CardHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subjective</label>
                <textarea className="w-full border rounded p-2" rows={3} placeholder="Patient reports..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Objective</label>
                <textarea className="w-full border rounded p-2" rows={2} placeholder="Vital signs, appearance..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assessment</label>
                <textarea className="w-full border rounded p-2" rows={2} placeholder="Clinical impression..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plan</label>
                <textarea className="w-full border rounded p-2" rows={3} placeholder="Treatment plan..." />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>🤖 AI Suggestions</CardTitle></CardHeader>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-primary-50 rounded border border-primary-200">
                <p className="font-medium text-primary-900">Next Question</p>
                <p className="text-primary-700">"Have you experienced any suicidal ideation?"</p>
              </div>
              <div className="p-3 bg-warning-50 rounded border border-warning-200">
                <p className="font-medium text-warning-900">⚠️ Safety Alert</p>
                <p className="text-warning-700">PDMP check required before prescribing</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <div className="space-y-2">
              <Button className="w-full" variant="secondary">Check PDMP</Button>
              <Button className="w-full" variant="secondary">Create Prescription</Button>
              <Button className="w-full" variant="secondary">Order Labs</Button>
              <Button className="w-full">Complete Visit</Button>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">15 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recommended CPT:</span>
                <Badge variant="info">99212</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
