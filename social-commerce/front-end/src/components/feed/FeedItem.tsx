import {useEffect, useRef, useState, useCallback} from "react";

import CuteFace from "@/components/chat/CuteFace";
import SpeechBubble from "@/components/feed/SpeechBubble";
import VoiceCommentButton from "@/components/feed/VoiceCommentButton";
import CommentsList from "@/components/feed/CommentsList";
import {useTextToSpeech} from "@/hooks/useTextToSpeech";
import {useComments} from "@/hooks/useComments";
import type {FeedItem as FeedItemType} from "@/types/feed";
import type {DogId} from "@/config/dogs";

// Mock current user (in production, get from auth context)
const CURRENT_USER = "@nguoidung_vn";

interface FeedItemProps {
    item: FeedItemType;
    isActive: boolean;
    dogId: DogId;
    onDogChange: (dogId: DogId) => void;
}

export default function FeedItem({item, isActive, dogId, onDogChange}: FeedItemProps) {
    const {speakWithMood, stop, isSpeaking, isLoading} = useTextToSpeech();
    const {comments, isLoading: commentsLoading, addComment} = useComments(item.id);
    const [showBubble, setShowBubble] = useState(false);
    const hasSpokenRef = useRef(false);

    useEffect(() => {
        if (isActive && !hasSpokenRef.current) {
            hasSpokenRef.current = true;

            // Small delay before showing bubble and speaking
            const timer = setTimeout(() => {
                setShowBubble(true);
                // Use mood-based TTS with Google Cloud voices
                speakWithMood(item.greeting, item.mood);
            }, 400);

            return () => clearTimeout(timer);
        }

        if (!isActive) {
            hasSpokenRef.current = false;
            setShowBubble(false);
            stop();
        }
    }, [isActive, item.greeting, item.mood, speakWithMood, stop]);

    // Hide bubble after speaking finishes (with delay)
    useEffect(() => {
        if (showBubble && !isSpeaking && !isLoading && hasSpokenRef.current) {
            const timer = setTimeout(() => {
                setShowBubble(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isSpeaking, isLoading, showBubble]);

    const handleComment = useCallback(
        async (text: string) => {
            await addComment(text, CURRENT_USER);
        },
        [addComment]
    );

    return (
        <div
            className="relative w-full h-screen snap-start snap-always flex-shrink-0"
            style={{backgroundColor: item.background_color}}
        >
            <SpeechBubble
                text={item.greeting}
                isVisible={showBubble}
                isSpeaking={isSpeaking || isLoading}
            />

            <CuteFace
                mood={item.mood}
                backgroundColor={item.background_color}
                size={280}
                dogId={dogId}
                onDogChange={onDogChange}
            />

            {/* Voice comment button - right side */}
            <div className="absolute right-4 bottom-48 z-10">
                <VoiceCommentButton onComment={handleComment} disabled={!isActive}/>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                {/* Comments list */}
                <div className="mb-4">
                    <CommentsList comments={comments} isLoading={commentsLoading}/>
                </div>

                {/* Creator info */}
                <div className="flex items-center gap-2 mb-3">
                    <div
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {item.creator.charAt(1).toUpperCase()}
            </span>
                    </div>
                    <span className="text-white font-medium drop-shadow-md">
            {item.creator}
          </span>
                </div>

                {/* Title and greeting */}
                <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                    {item.title}
                </h2>
                <p className="text-base text-white/90 drop-shadow-md">
                    {item.greeting}
                </p>
            </div>
        </div>
    );
}
