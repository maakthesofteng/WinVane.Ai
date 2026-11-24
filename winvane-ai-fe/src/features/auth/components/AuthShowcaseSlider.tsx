'use client';

import * as React from 'react';
import { CheckCircle2, ChevronRight, Eye, Sparkles, Target, Zap } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

interface ISlideData {
  tag: string;
  headline: string;
  subheadline: string;
  description: string;
  badge: string;
  preview: React.ReactNode;
  principle: string;
}

const SLIDES: readonly ISlideData[] = [
  {
    tag: 'BUILT FOR SOFTWARE BUSINESSES',
    headline: 'Better-fit leads.',
    subheadline: 'Built around your business.',
    description:
      'AI-powered lead discovery for software agencies and freelancers. Your expertise, evidence and availability shape every recommendation.',
    badge: '94% FIT',
    preview: (
      <div className="showcase-lead-box">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded bg-muted flex items-center justify-center text-primary font-mono text-xs font-semibold">
              AS
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Apex Studio</p>
              <p className="text-[11px] text-muted-foreground">Full-Stack React & Node Agency</p>
            </div>
          </div>
          <span className="badge-ref text-[10px] text-primary border-primary/30 bg-primary/10">
            Verified Partner
          </span>
        </div>
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Carepath Health · Web Portal</span>
            <span className="showcase-fit-pill">94% FIT</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            React + Node.js match; your Carepath healthcare build is directly relevant to this RFP.
          </p>
          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-primary">
              <Zap className="size-3" /> Urgent · 3 weeks to MVP
            </span>
            <span>$45k - $60k</span>
          </div>
        </div>
      </div>
    ),
    principle: 'Rules score. AI explains. You decide.',
  },
  {
    tag: 'INTELLIGENT TARGETING',
    headline: 'Train your Company Brain.',
    subheadline: 'Never pitch blind.',
    description:
      'Store your tech stack, case studies, past wins, and rate preferences. WinVane scores opportunities against your exact team capabilities.',
    badge: '100% CALIBRATED',
    preview: (
      <div className="showcase-lead-box space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" /> Active Capabilities
          </span>
          <span className="showcase-fit-pill">BRAIN ACTIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded bg-muted/40 border border-border/60">
            <p className="text-muted-foreground text-[10px]">Primary Tech</p>
            <p className="font-medium text-foreground">Next.js, TypeScript, Nest</p>
          </div>
          <div className="p-2 rounded bg-muted/40 border border-border/60">
            <p className="text-muted-foreground text-[10px]">Target Budget</p>
            <p className="font-medium text-foreground">$30k – $150k</p>
          </div>
        </div>
        <div className="p-2 rounded bg-muted/30 border border-border/50 text-[11px] flex items-center gap-2">
          <CheckCircle2 className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">4 FinTech & HealthTech case studies verified</span>
        </div>
      </div>
    ),
    principle: 'Zero hallucinations. Verified proof only.',
  },
  {
    tag: 'CONTINUOUS MONITORING',
    headline: 'Daily qualified matches.',
    subheadline: 'Directly to your workspace.',
    description:
      'Automated signals track RFPs, job boards, and founder inquiries. Fast-track outreach with AI-generated tailored positioning angles.',
    badge: '3 NEW TODAY',
    preview: (
      <div className="showcase-lead-box space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Target className="size-3.5 text-primary" /> Today&apos;s Discoveries
          </span>
          <span className="badge-ref text-primary">3 New Leads</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between p-1.5 rounded bg-muted/40 border border-border/60 text-xs">
            <span className="font-medium text-foreground truncate max-w-[180px]">Aster Health · Migration</span>
            <span className="text-primary font-mono text-[11px]">92% Match</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-muted/40 border border-border/60 text-xs">
            <span className="font-medium text-foreground truncate max-w-[180px]">Veritas Fin · API Portal</span>
            <span className="text-primary font-mono text-[11px]">88% Match</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
          <ChevronRight className="size-3 text-primary" /> Tailored outreach pitch ready for review
        </p>
      </div>
    ),
    principle: 'First to identify. First to respond.',
  },
];

export function AuthShowcaseSlider() {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = SLIDES[activeIdx];

  return (
    <aside
      className="showcase-sidebar"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Platform Highlights"
    >
      <div className="showcase-header">
        <Logo size="md" />
      </div>

      <div className="showcase-content">
        <div className="space-y-3">
          <span className="showcase-tag">{slide.tag}</span>
          <h2 className="showcase-headline">
            {slide.headline}
            <span className="block text-primary">{slide.subheadline}</span>
          </h2>
          <p className="showcase-description">{slide.description}</p>
        </div>

        <div className="showcase-preview-wrapper">{slide.preview}</div>

        <div className="showcase-principle">
          <Eye className="size-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs text-muted-foreground font-medium">{slide.principle}</span>
        </div>
      </div>

      <div className="showcase-footer">
        <div className="flex items-center gap-2" role="tablist" aria-label="Slide indicators">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === activeIdx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setActiveIdx(idx)}
              className={`showcase-dot ${idx === activeIdx ? 'showcase-dot-active' : ''}`}
            />
          ))}
        </div>
        <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
          WinVane.ai / Platform
        </p>
      </div>
    </aside>
  );
}
