// Dashboard types matching the API response
export type StatsResponse = {
  totalSessions: number;
  totalMessages: number;
  last7Days: Array<{
    date: string;
    messagesCount: number;
  }>;
  recentSessions: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>;
};

