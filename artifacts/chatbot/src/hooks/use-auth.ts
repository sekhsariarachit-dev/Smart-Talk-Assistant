import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const USER_ID_KEY = "chatbot_user_id";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let stored = localStorage.getItem(USER_ID_KEY);
    if (!stored) {
      stored = uuidv4();
      localStorage.setItem(USER_ID_KEY, stored);
    }
    setUserId(stored);
  }, []);

  return { userId, isReady: userId !== null };
}
