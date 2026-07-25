interface AdsQuery {
  sportId?: string;
  city?: string;
  date?: string;
}

interface AdBody {
  sportId: string;
  city: string;
  date: string;
  startTime: string;
  endTime: string;
  missingPlayers: number;
}

interface AdListItem {
  id: string;
  authorId: string;
  authorName: string;
  sport: {
    id: string;
    name: string;
  };
  city: string;
  date: Date;
  startTime: string;
  endTime: string;
  missingPlayers: number;
  acceptedPlayers: number;
  status: 'active' | 'completed' | 'closed';
  createdAt: Date;
  isOwner: boolean;
  hasRequested: boolean;
}

interface ApplyRequestItem {
  id: string;
  athleteName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface AdRequestsData {
  ad: {
    id: string;
    sportName: string;
    city: string;
    date: Date;
    startTime: string;
    endTime: string;
    missingPlayers: number;
    acceptedPlayers: number;
    status: 'active' | 'completed' | 'closed';
  };
  requests: ApplyRequestItem[];
}

export type {
  AdListItem,
  AdsQuery,
  AdBody,
  AdRequestsData,
  ApplyRequestItem,
};
