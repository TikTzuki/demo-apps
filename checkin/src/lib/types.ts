export interface Member {
    id: string;
    name: string;
    email?: string;
    checkedIn: boolean;
    checkedInAt?: string;
}

export interface Team {
    id: string;
    name: string;
    color: string;
    members: Member[];
}

export interface Database {
    teams: Team[];
}

export interface CheckinStats {
    totalMembers: number;
    checkedIn: number;
    percentage: number;
    teamStats: TeamStats[];
}

export interface TeamStats {
    teamId: string;
    teamName: string;
    color: string;
    totalMembers: number;
    checkedIn: number;
    isComplete: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
