export interface Integration {
  name: string;
  status: "connected" | "disconnected";
  account?: string;
  scopes?: string[];
}

export interface RecentActivity {
  timestamp: string;
  duration: string;
  sessionId: string;
}

export interface BotStatus {
  botEmail: string;
  lastSeen: string | null;
  integrations: Integration[];
  recentActivity: RecentActivity[];
  capabilities: string[];
}
