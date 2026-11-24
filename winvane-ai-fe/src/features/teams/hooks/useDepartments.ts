import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { departmentsApi } from '../api/departmentsApi';

export function useDepartments(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.departments.list(search),
    queryFn: () => departmentsApi.getDepartments(search),
  });
}

