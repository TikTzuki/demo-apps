import {QueryProvider} from "@/providers/QueryProvider";
import VoiceFeed from "@/components/feed/VoiceFeed.tsx";

function App() {
    return (
        <QueryProvider>
            <VoiceFeed/>
        </QueryProvider>
    );
}

export default App;
