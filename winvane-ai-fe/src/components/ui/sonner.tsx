'use client';

import * as React from 'react';
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      duration={5000}
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4 text-[#77DCC2]" aria-hidden="true" />,
        info: <InfoIcon className="size-4 text-[#A0C1D8]" aria-hidden="true" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" aria-hidden="true" />,
        error: <OctagonXIcon className="size-4 text-[#F05252]" aria-hidden="true" />,
        loading: <Loader2Icon className="size-4 animate-spin text-[#77DCC2]" aria-hidden="true" />,
      }}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[#191E22] group-[.toaster]:text-[#EEF2F3] group-[.toaster]:border-[#2B3339] group-[.toaster]:shadow-2xl group-[.toaster]:rounded-md font-sans text-xs sm:text-sm font-medium',
          title: 'group-[.toast]:text-[#EEF2F3] font-semibold text-xs sm:text-sm',
          description: 'group-[.toast]:text-[#B4BEC5] text-xs font-normal',
          actionButton:
            'group-[.toast]:bg-[#77DCC2] group-[.toast]:text-[#10251F] font-semibold text-xs rounded hover:bg-[#77DCC2]/90',
          cancelButton:
            'group-[.toast]:bg-[#20262B] group-[.toast]:text-[#EEF2F3] text-xs rounded hover:bg-[#20262B]/80',
          closeButton:
            'group-[.toast]:bg-[#191E22] group-[.toast]:text-[#B4BEC5] group-[.toast]:border-[#2B3339] hover:group-[.toast]:text-[#EEF2F3] hover:group-[.toast]:bg-[#20262B]',
          success: 'group-[.toaster]:border-[#77DCC2]/40',
          error: 'group-[.toaster]:border-[#F05252]/50',
          warning: 'group-[.toaster]:border-amber-500/40',
          info: 'group-[.toaster]:border-[#A0C1D8]/40',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
