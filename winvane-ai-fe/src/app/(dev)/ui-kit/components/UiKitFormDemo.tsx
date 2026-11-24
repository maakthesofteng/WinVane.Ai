'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { emailSchema } from '@/shared/schemas/common.schema';

const demoFormSchema = z.object({
  email: emailSchema,
  agencyName: z.string().min(2, 'Agency name must be at least 2 characters'),
});

type TDemoFormValues = z.infer<typeof demoFormSchema>;

export function UiKitFormDemo() {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<TDemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      email: '',
      agencyName: '',
    },
  });

  const onSubmit = (values: TDemoFormValues) => {
    // Demo error simulation if demo@error.com is provided
    if (values.email === 'demo@error.com') {
      setServerError('This email address is already registered in another workspace.');
      return;
    }
    setServerError(null);
    form.reset();
  };

  return (
    <div className="max-w-md space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@agency.com" {...field} />
                </FormControl>
                <FormDescription>We will never share your email address.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agencyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agency Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Software Labs" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" variant="default" className="w-full">
            Submit Demo Form
          </Button>
        </form>
      </Form>
    </div>
  );
}

