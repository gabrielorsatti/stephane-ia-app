import { useCallback, useEffect, useState } from "react";
import {
  getExistingSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "../lib/pushNotifications";

export function usePushSubscription(userId: string | undefined) {
  const [supported] = useState(isPushSupported);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supported || !userId) return;
    getExistingSubscription().then((sub) => {
      setSubscribed(!!sub);
    });
  }, [supported, userId]);

  const toggle = useCallback(async () => {
    if (!userId || loading) return;
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush(userId);
        setSubscribed(false);
      } else {
        const ok = await subscribeToPush(userId);
        setSubscribed(ok);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, subscribed, loading]);

  return { supported, subscribed, loading, toggle };
}
