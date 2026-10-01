import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
      <Link href="/" className="text-primary hover:underline">
        Go back to Overview
      </Link>
    </div>
  );
}
