export interface AdFilters {
  sportId?: string;
  city?: string;
  date?: string;
}

export interface CreateAdRequest {
  sportId: string;
  city: string;
  date: string;
  startTime: string;
  endTime: string;
  missingPlayers: number;
}

export interface AdListItem {
  id: string;
  authorId: string;
  authorName: string;
  sport: {
    id: string;
    name: string;
  };
  city: string;
  date: string;
  startTime: string;
  endTime: string;
  missingPlayers: number;
  acceptedPlayers: number;
  status: 'active' | 'completed' | 'closed';
  createdAt: string;
  isOwner: boolean;
  hasRequested: boolean;
}

export interface ApplyRequestItem {
  id: string;
  athleteName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface AdDetails {
  id: string;
  sportName: string;
  city: string;
  date: string;
  startTime: string;
  endTime: string;
  missingPlayers: number;
  acceptedPlayers: number;
  status: 'active' | 'completed' | 'closed';
}

export interface AdListResponseData {
  ads: AdListItem[];
}

export interface AdCreateResponseData {
  ad: {
    id: string;
  };
}

export interface ApplyToAdResponseData {
  request: {
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
}

export interface AdRequestsResponseData {
  ad: AdDetails;
  requests: ApplyRequestItem[];
}
