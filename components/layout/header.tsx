'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-semibold text-xl">
          Script2Video
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/script2vd">
            <Button variant="ghost">Create Video</Button>
          </Link>
          <Link href="/complete">
            <Button variant="ghost">My Videos</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
