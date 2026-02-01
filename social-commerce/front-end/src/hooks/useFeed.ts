import {useQuery} from "@tanstack/react-query";

import {api} from "@/lib/api";
import type {FeedResponse} from "@/types/feed";

async function fetchFeed(): Promise<FeedResponse> {
    return api.get<FeedResponse>("/api/v1/feed");
}

export function useFeed() {
    return useQuery({
        queryKey: ["feed"],
        queryFn: fetchFeed,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
