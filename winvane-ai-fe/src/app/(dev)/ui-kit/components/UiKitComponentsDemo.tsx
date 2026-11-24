'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function UiKitComponentsDemo() {
  const [progressVal] = React.useState(65);
  const [switchVal, setSwitchVal] = React.useState(true);

  return (
    <div className="space-y-8">
      {/* Buttons */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Button Variants & States</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="default">Default Mint</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="default" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* Badges & Inputs */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Badges & Inputs</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">Active Mint</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Alert</Badge>
        </div>
        <div className="grid max-w-md gap-3 pt-2">
          <Input placeholder="Default Input" />
          <Input placeholder="Disabled Input" disabled />
          <Input aria-invalid="true" placeholder="Error state input" />
        </div>
      </section>

      {/* Card, Tabs, Progress, Switch */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Surface Card</CardTitle>
            <CardDescription>Container with card background and border tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Notification Toggle</span>
              <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Pipeline Completion</span>
                <span>{progressVal}%</span>
              </div>
              <Progress value={progressVal} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Avatar>
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  WV
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabbed Panels</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1">
                  Analytics
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4 text-sm text-muted-foreground">
                Overview tab content rendered on dark theme.
              </TabsContent>
              <TabsContent value="analytics" className="pt-4 text-sm text-muted-foreground">
                Lead discovery analytics graphs and charts.
              </TabsContent>
            </Tabs>

            <div className="pt-6">
              <Alert>
                <AlertTitle>System Alert</AlertTitle>
                <AlertDescription>
                  This is a standard alert box using the design tokens.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

