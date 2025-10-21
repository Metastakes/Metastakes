import Link from 'next/link';
import { Button } from '@neurobridge/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-5xl font-bold text-primary-600">NeuroBridge</h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          HIPAA-compliant telepsychiatry and metabolic health platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Patient Login</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="secondary">Sign Up</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
