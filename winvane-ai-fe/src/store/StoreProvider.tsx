'use client';

import * as React from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './index';

export interface IStoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: IStoreProviderProps) {
  const [store] = React.useState(() => makeStore());

  return <Provider store={store}>{children}</Provider>;
}
