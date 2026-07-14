import { useLocalSearchParams } from "expo-router";

import { ChatThread } from "@/features/chat/ChatThread";

/** Chat thread route — full message thread + composer for a conversation. */
export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatThread id={id} />;
}
