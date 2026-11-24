'use client';

import * as React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { Laptop, Smartphone, Tablet, Monitor, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSessions } from '../hooks/useSessions';
import { useRevokeSession } from '../hooks/useRevokeSession';
import { useRevokeOtherSessions } from '../hooks/useRevokeOtherSessions';
import type { ISessionView, TPortal } from '../types/securityApi.types';

export interface IActiveSessionsCardProps {
  portal: TPortal;
}

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" aria-hidden="true" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" aria-hidden="true" />;
    case 'desktop':
      return <Laptop className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Monitor className="h-4 w-4" aria-hidden="true" />;
  }
}

export function ActiveSessionsCard({ portal }: IActiveSessionsCardProps) {
  const { data: sessions = [], isLoading } = useSessions(portal);
  const revokeSessionMutation = useRevokeSession(portal);
  const revokeOthersMutation = useRevokeOtherSessions(portal);

  const [sessionToRevoke, setSessionToRevoke] = React.useState<ISessionView | null>(null);
  const [isRevokeOthersOpen, setIsRevokeOthersOpen] = React.useState(false);

  const otherSessions = sessions.filter((s) => !s.current);

  const handleConfirmRevoke = async () => {
    if (!sessionToRevoke) return;
    try {
      await revokeSessionMutation.mutateAsync(sessionToRevoke.id);
      toast.success('Session revoked successfully.');
    } catch {
      toast.error('Failed to revoke session.');
    } finally {
      setSessionToRevoke(null);
    }
  };

  const handleConfirmRevokeOthers = async () => {
    try {
      const res = await revokeOthersMutation.mutateAsync();
      toast.success(`Signed out ${res.revokedCount} other active session${res.revokedCount === 1 ? '' : 's'}.`);
    } catch {
      toast.error('Failed to revoke other sessions.');
    } finally {
      setIsRevokeOthersOpen(false);
    }
  };

  return (
    <>
      <Card className="border-border/70 bg-card">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Laptop className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Active Sessions</CardTitle>
                <CardDescription className="text-xs">
                  Devices currently signed in to your account.
                </CardDescription>
              </div>
            </div>

            {otherSessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRevokeOthersOpen(true)}
                className="gap-2 text-xs font-semibold self-start sm:self-auto"
              >
                <LogOut className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                Sign out other devices
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
              Loading active sessions...
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted/60 p-2 text-muted-foreground mt-0.5">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {session.browser} on {session.os}
                        </span>
                        {session.current && (
                          <Badge
                            variant="outline"
                            className="border-primary/40 bg-primary/10 text-primary text-[10px] font-semibold"
                          >
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            This device
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>{session.ipAddress}</span>
                        <span>•</span>
                        <span>
                          Active {formatDistanceToNow(new Date(session.lastSeenAt), { addSuffix: true })}
                        </span>
                        <span>•</span>
                        <span>Signed in {format(new Date(session.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSessionToRevoke(session)}
                      disabled={revokeSessionMutation.isPending}
                      className="self-end sm:self-auto text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              ))}

              {otherSessions.length === 0 && sessions.length > 0 && (
                <p className="pt-3 text-xs text-muted-foreground italic">
                  No other active sessions.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke single session dialog */}
      <Dialog open={Boolean(sessionToRevoke)} onOpenChange={(open) => !open && setSessionToRevoke(null)}>
        <DialogContent className="max-w-sm border-border/80 bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Sign out device?</DialogTitle>
            <DialogDescription className="text-xs">
              This will revoke the session for {sessionToRevoke?.browser} on {sessionToRevoke?.os} ({sessionToRevoke?.ipAddress}).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setSessionToRevoke(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmRevoke}>Sign out device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke all others dialog */}
      <Dialog open={isRevokeOthersOpen} onOpenChange={setIsRevokeOthersOpen}>
        <DialogContent className="max-w-sm border-border/80 bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Sign out all other devices?</DialogTitle>
            <DialogDescription className="text-xs">
              All other active sessions will be revoked. You will remain signed in on this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsRevokeOthersOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmRevokeOthers}>Sign out all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

