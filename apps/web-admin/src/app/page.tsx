import Link from 'next/link';
import { Button } from '@neurobridge/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-primary-600">NeuroBridge Admin Portal</h1>
        <p className="text-gray-600">AI-enhanced clinical decision support</p>
        <Link href="/login">
          <Button size="lg">Admin Login</Button>
        </Link>
      </div>
    </div>
  );
}
