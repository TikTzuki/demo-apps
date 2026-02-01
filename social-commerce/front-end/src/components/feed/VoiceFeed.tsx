import {useCallback, useEffect, useRef, useState} from "react";

import FeedItem from "@/components/feed/FeedItem";
import PoseIndicator from "@/components/feed/PoseIndicator";
import {useFeed} from "@/hooks/useFeed";
import {useDogSelection} from "@/hooks/useDogSelection";
import {useGestureControl} from "@/hooks/useGestureControl";

export default function VoiceFeed() {
    const {data, isLoading, error} = useFeed();
    const {dogId, setDogId} = useDogSelection();
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Feed items - no duplication needed for true infinite loop
    const feedItems = data?.data ?? [];
    const totalItems = feedItems.length;

    // Scroll to specific index with smooth animation
    const scrollToIndex = useCallback((index: number) => {
        const container = containerRef.current;
        if (!container || totalItems === 0) return;

        const viewportHeight = window.innerHeight;
        container.scrollTo({
            top: index * viewportHeight,
            behavior: "smooth",
        });
    }, [totalItems]);

    // Scroll up (previous feed) - loop to last item if at first
    const scrollUp = useCallback(() => {
        if (totalItems === 0) return;

        const newIndex = activeIndex === 0 ? totalItems - 1 : activeIndex - 1;
        setActiveIndex(newIndex);
        scrollToIndex(newIndex);
    }, [activeIndex, totalItems, scrollToIndex]);

    // Scroll down (next feed) - loop to first item if at last
    const scrollDown = useCallback(() => {
        if (totalItems === 0) return;

        const newIndex = activeIndex === totalItems - 1 ? 0 : activeIndex + 1;
        setActiveIndex(newIndex);
        scrollToIndex(newIndex);
    }, [activeIndex, totalItems, scrollToIndex]);

    // Gesture control integration
    const {
        cameraPermission,
        isActive: isPoseActive,
        isLoading: isPoseLoading,
        currentGesture,
        requestCameraAccess,
        videoRef,
    } = useGestureControl({
        cooldownMs: 1200, // Slightly longer cooldown for swipe gestures
        onScrollUp: scrollUp,
        onScrollDown: scrollDown,
        enabled: true,
    });

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "j") {
            e.preventDefault();
            scrollDown();
        } else if (e.key === "ArrowUp" || e.key === "k") {
            e.preventDefault();
            scrollUp();
        }
    }, [scrollDown, scrollUp]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Intersection Observer to track active item (for manual scroll)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const index = Number(entry.target.getAttribute("data-index"));
                        if (!isNaN(index)) {
                            setActiveIndex(index);
                        }
                    }
                });
            },
            {
                root: containerRef.current,
                threshold: 0.5,
            }
        );

        itemRefs.current.forEach((element) => {
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, [feedItems]);

    const setItemRef = useCallback((index: number, element: HTMLDivElement | null) => {
        if (element) {
            itemRefs.current.set(index, element);
        } else {
            itemRefs.current.delete(index);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-yellow-400">
                <div className="text-white text-2xl font-semibold animate-pulse">
                    Loading...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-red-400">
                <div className="text-white text-2xl font-semibold">
                    Failed to load feed
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Hidden video element for pose detection */}
            <video
                ref={videoRef}
                className="hidden"
                playsInline
                muted
                autoPlay
            />

            {/* Pose indicator in top-left corner */}
            <div className="fixed top-4 left-4 z-50">
                <PoseIndicator
                    permission={cameraPermission}
                    isActive={isPoseActive}
                    isLoading={isPoseLoading}
                    currentGesture={currentGesture}
                    onEnableClick={requestCameraAccess}
                />
            </div>

            {/* Main feed container */}
            <div
                ref={containerRef}
                className="w-full h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{scrollSnapType: "y mandatory"}}
            >
                {feedItems.map((item, index) => (
                    <div
                        key={item.id}
                        ref={(el) => setItemRef(index, el)}
                        data-index={index}
                    >
                        <FeedItem
                            item={item}
                            isActive={index === activeIndex}
                            dogId={dogId}
                            onDogChange={setDogId}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}
