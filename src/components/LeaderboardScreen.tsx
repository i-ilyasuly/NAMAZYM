import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { RefreshCw, User } from "lucide-react";
import { db } from "../firebase";
import { useStore } from "../store";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "../lib/utils";

export function LeaderboardScreen() {
  const { user } = useStore();
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const q = query(
        collection(db, "users"), 
        where("isPrivate", "==", false),
        orderBy("lastNI", "desc"), 
        limit(50)
      );
      const snap = await getDocs(q);
      setLeaderboardUsers(snap.docs.map(d => d.data()));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6 pb-24 px-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Рейтинг</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Ең үздік құлшылық иелері</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={fetchLeaderboard} disabled={isLoadingLeaderboard}>
          <RefreshCw className={cn("w-5 h-5", isLoadingLeaderboard && "animate-spin")} />
        </Button>
      </div>

      <div className="space-y-3">
        {isLoadingLeaderboard ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-3xl border bg-card animate-pulse">
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
              <div className="h-6 w-12 bg-muted rounded" />
            </div>
          ))
        ) : leaderboardUsers.length > 0 ? (
          leaderboardUsers.map((u, i) => (
            <motion.div 
              key={u.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-3xl border bg-card transition-all",
                u.uid === user?.uid && "border-primary ring-2 ring-primary/10 bg-primary/5"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                i === 0 ? "bg-amber-100 text-amber-600" : 
                i === 1 ? "bg-slate-100 text-slate-600" :
                i === 2 ? "bg-orange-100 text-orange-600" : "text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                <AvatarImage src={u.photoURL} />
                <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{u.displayName || "User"}</p>
                <p className="text-[10px] text-indigo-500 font-mono font-bold">{u.username || "@anonymous"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {u.lastNI?.toFixed(2) || "0.00"}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">NI</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            Рейтинг әлі бос
          </div>
        )}
      </div>
    </div>
  );
}
