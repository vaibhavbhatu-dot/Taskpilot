import { useQuery } from '@tanstack/react-query';
import { myWorkApi } from '../api';

type Tab = 'due' | 'today' | 'tomorrow';

interface UseMyWorkTicketsParams {
  tab: Tab;
  userId?: string;
  teamId?: string;
}

export function useMyWorkTickets({ tab, userId, teamId }: UseMyWorkTicketsParams) {
  return useQuery({
    queryKey: ['my-work', tab, userId, teamId],
    queryFn: async () => {
      const params: Record<string, string> = { tab };
      if (userId) params.userId = userId;
      if (teamId) params.teamId = teamId;
      const { data } = await myWorkApi.getTickets(params);
      return data;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useMyWorkTeams() {
  return useQuery({
    queryKey: ['my-work-teams'],
    queryFn: async () => {
      const { data } = await myWorkApi.getTeams();
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useMyWorkMembers(teamId?: string) {
  return useQuery({
    queryKey: ['my-work-members', teamId],
    queryFn: async () => {
      const { data } = await myWorkApi.getMembers(teamId);
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
