'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiGet, apiPost } from '@/lib/api/apiClient';
import { getErrorMessage } from '@/lib/api/apiError';

export function UiKitLiveTest() {
  const [loading, setLoading] = React.useState(false);

  const handleTestHealth = async () => {
    try {
      setLoading(true);
      const data = await apiGet<{ status: string }>('/health');
      toast.success(`Backend Health: ${data.status.toUpperCase()}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTestCsrfPost = async () => {
    try {
      setLoading(true);
      // Calls a sample mutating endpoint to trigger CSRF double-submit fetch and verification
      await apiPost('/test-csrf', { test: true });
      toast.success('Test POST succeeded with valid CSRF token');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={handleTestHealth} disabled={loading} variant="outline">
        Test Backend GET /health
      </Button>
      <Button onClick={handleTestCsrfPost} disabled={loading} variant="default">
        Test Mutating POST (CSRF Verify)
      </Button>
    </div>
  );
}

