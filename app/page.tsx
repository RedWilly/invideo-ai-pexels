'use client';

import { ArrowRight, Video, Wand2, Clock, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { PageContainer } from '@/components/layout';

export default function Home() {
  const features = [
    {
      icon: <Video className="w-8 h-8 mb-4 text-primary" />,
      title: "High-Quality Stock Footage",
      description: "Access a vast library of professional stock videos that perfectly match your script"
    },
    {
      icon: <Wand2 className="w-8 h-8 mb-4 text-primary" />,
      title: "AI-Powered Voiceovers",
      description: "Choose from multiple natural-sounding AI voices to narrate your content"
    },
    {
      icon: <Clock className="w-8 h-8 mb-4 text-primary" />,
      title: "Quick Generation",
      description: "Transform your script into a complete video in minutes, not hours"
    },
    {
      icon: <Share2 className="w-8 h-8 mb-4 text-primary" />,
      title: "Easy Sharing",
      description: "Download and share your videos instantly across any platform"
    }
  ];

  return (
    <main className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background pt-24 pb-32">
        <PageContainer>
          <div className="flex flex-col items-center text-center space-y-8">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">
              Transform Scripts into Engaging Videos
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Using AI-powered voiceovers and high-quality stock footage, turn your words into professional videos in minutes.
            </p>
            <Link href="/script2vd">
              <Button size="lg" className="group">
                Visit S2V
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </PageContainer>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <PageContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-lg border hover:shadow-lg transition-shadow"
              >
                {feature.icon}
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-primary/5">
        <PageContainer>
          <div className="flex flex-col items-center text-center space-y-8">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tighter">
              See It in Action
            </h2>
            <div className="w-full max-w-4xl aspect-video rounded-lg overflow-hidden bg-black/10">
              <img
                src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1600&h=900"
                alt="Video Creation Demo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </PageContainer>
      </section>
    </main>
  );
}