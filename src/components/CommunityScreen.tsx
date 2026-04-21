import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, UserProfile, FriendRequest } from '../lib/friends';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '../lib/utils';
import { Search, UserPlus, UserCheck, UserX, Clock, Check, X, Users, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function CommunityScreen() {
  const { user, isStarrySky, backgroundType, isDarkMode } = useStore();
  const isSpecialBg = backgroundType !== 'stars' || (isDarkMode && isStarrySky);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  
  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests'>('friends');

  // Listen to friends
  useEffect(() => {
    if (!user) return;
    const friendsRef = collection(db, "users", user.uid, "friends");
    const unsubscribe = onSnapshot(friendsRef, async (snap) => {
      const friendIds = snap.docs.map(d => d.id);
      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }
      
      // Fetch profiles for these friends
      // Note: In a real app with many friends, you'd want to batch this or use a cloud function to sync data.
      // For now, we'll fetch them individually or in chunks.
      const profiles: UserProfile[] = [];
      for (const id of friendIds) {
        const { fetchUserProfile } = await import('../lib/friends');
        const profile = await fetchUserProfile(id);
        if (profile) profiles.push(profile);
      }
      setFriends(profiles);
    });
    return unsubscribe;
  }, [user]);

  // Listen to friend requests
  useEffect(() => {
    if (!user) return;
    const requestsRef = collection(db, "friend_requests");
    
    // Incoming
    const qIncoming = query(requestsRef, where("receiverId", "==", user.uid), where("status", "==", "pending"));
    const unsubIncoming = onSnapshot(qIncoming, async (snap) => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
      // Fetch sender profiles
      for (const req of reqs) {
        const { fetchUserProfile } = await import('../lib/friends');
        const profile = await fetchUserProfile(req.senderId);
        if (profile) req.senderProfile = profile;
      }
      setIncomingRequests(reqs);
    });

    // Outgoing
    const qOutgoing = query(requestsRef, where("senderId", "==", user.uid), where("status", "==", "pending"));
    const unsubOutgoing = onSnapshot(qOutgoing, async (snap) => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
      for (const req of reqs) {
        const { fetchUserProfile } = await import('../lib/friends');
        const profile = await fetchUserProfile(req.receiverId);
        if (profile) req.receiverProfile = profile;
      }
      setOutgoingRequests(reqs);
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.length < 3) {
      toast.error("Кем дегенде 3 әріп жазыңыз");
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter(r => r.uid !== user?.uid));
    } catch (error) {
      console.error(error);
      toast.error("Іздеу кезінде қате шықты");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;
    try {
      await sendFriendRequest(user.uid, receiverId);
      toast.success("Достық өтінім жіберілді!");
    } catch (error: any) {
      toast.error(error.message || "Қате шықты");
    }
  };

  const handleAccept = async (requestId: string, senderId: string) => {
    if (!user) return;
    try {
      await acceptFriendRequest(requestId, senderId, user.uid);
      toast.success("Өтінім қабылданды!");
    } catch (error) {
      toast.error("Қате шықты");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      toast.success("Өтінім қабылданбады");
    } catch (error) {
      toast.error("Қате шықты");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    if (!confirm("Бұл қолданушыны достар тізімінен өшіргіңіз келе ме?")) return;
    try {
      await removeFriend(user.uid, friendId);
      toast.success("Дос өшірілді");
    } catch (error) {
      toast.error("Қате шықты");
    }
  };

  return (
    <div className={cn(
      "space-y-6 max-w-full mx-auto w-full pb-24 transition-all duration-500",
      isSpecialBg && "bg-transparent"
    )}>
      <div className="flex flex-col space-y-4">
        <div className={cn(
          "p-4 rounded-[2.5rem] bg-card border shadow-sm transition-all duration-500",
          isSpecialBg && "bg-card/40 backdrop-blur-md"
        )}>
          <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Қауымдастық
          </h1>
        </div>

        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl overflow-x-auto no-scrollbar">
          <Button 
            variant={activeTab === 'friends' ? 'default' : 'ghost'} 
            className="rounded-lg flex-1 min-w-[100px]"
            onClick={() => setActiveTab('friends')}
          >
            <Users className="w-4 h-4 mr-2" />
            Достар ({friends.length})
          </Button>
          <Button 
            variant={activeTab === 'requests' ? 'default' : 'ghost'} 
            className="rounded-lg flex-1 min-w-[100px] relative"
            onClick={() => setActiveTab('requests')}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Өтінімдер
            {incomingRequests.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </Button>
          <Button 
            variant={activeTab === 'search' ? 'default' : 'ghost'} 
            className="rounded-lg flex-1 min-w-[100px]"
            onClick={() => setActiveTab('search')}
          >
            <Search className="w-4 h-4 mr-2" />
            Іздеу
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Username (@ilyas) немесе Email арқылы іздеу..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-12 rounded-xl"
                  />
                </div>
                <Button type="submit" className="h-12 rounded-xl px-6" disabled={isSearching}>
                  {isSearching ? "..." : "Іздеу"}
                </Button>
              </form>

              <div className="space-y-3">
                {searchResults.map(profile => {
                  const isFriend = friends.some(f => f.uid === profile.uid);
                  const isPendingOut = outgoingRequests.some(r => r.receiverId === profile.uid);
                  const isPendingIn = incomingRequests.some(r => r.senderId === profile.uid);

                  return (
                    <div key={profile.uid} className={cn("flex items-center justify-between p-4 bg-card border rounded-2xl shadow-sm", isStarrySky && "bg-card/40 backdrop-blur-md")}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile.photoURL} />
                          <AvatarFallback>{profile.displayName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{profile.displayName || "Пайдаланушы"}</p>
                          <p className="text-xs text-muted-foreground">{profile.username || profile.email}</p>
                        </div>
                      </div>
                      
                      {isFriend ? (
                        <Button variant="secondary" size="sm" disabled className="rounded-full">
                          <Check className="w-4 h-4 mr-1" /> Доссыз
                        </Button>
                      ) : isPendingOut ? (
                        <Button variant="outline" size="sm" disabled className="rounded-full">
                          <Clock className="w-4 h-4 mr-1" /> Күтілуде
                        </Button>
                      ) : isPendingIn ? (
                        <Button size="sm" className="rounded-full" onClick={() => setActiveTab('requests')}>
                          Жауап беру
                        </Button>
                      ) : (
                        <Button size="sm" className="rounded-full" onClick={() => handleSendRequest(profile.uid)}>
                          <UserPlus className="w-4 h-4 mr-1" /> Қосу
                        </Button>
                      )}
                    </div>
                  );
                })}
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-10 text-muted-foreground">
                    Қолданушы табылмады
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div 
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h3 className="font-bold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Келген өтінімдер ({incomingRequests.length})</h3>
                {incomingRequests.length === 0 ? (
                  <div className="p-6 bg-muted/20 rounded-2xl text-center text-sm text-muted-foreground border border-dashed">
                    Жаңа өтінімдер жоқ
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingRequests.map(req => (
                      <div key={req.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-2xl shadow-sm gap-4", isStarrySky && "bg-card/40 backdrop-blur-md")}>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={req.senderProfile?.photoURL} />
                            <AvatarFallback>{req.senderProfile?.displayName?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{req.senderProfile?.displayName || "Пайдаланушы"}</p>
                            <p className="text-xs text-muted-foreground">{req.senderProfile?.username || "Дос болғысы келеді"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 sm:flex-none rounded-full" onClick={() => handleAccept(req.id, req.senderId)}>
                            <Check className="w-4 h-4 mr-1" /> Қабылдау
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 sm:flex-none rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleReject(req.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Жіберілген өтінімдер ({outgoingRequests.length})</h3>
                <div className="space-y-3">
                  {outgoingRequests.map(req => (
                    <div key={req.id} className={cn("flex items-center justify-between p-4 bg-card border rounded-2xl shadow-sm opacity-70", isStarrySky && "bg-card/40 backdrop-blur-md")}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={req.receiverProfile?.photoURL} />
                          <AvatarFallback>{req.receiverProfile?.displayName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{req.receiverProfile?.displayName || "Пайдаланушы"}</p>
                          <p className="text-[10px] text-muted-foreground">Күтілуде...</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleReject(req.id)}>
                        Болдырмау
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'friends' && (
            <motion.div 
              key="friends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {friends.length === 0 ? (
                <div className={cn("text-center py-12 px-4 bg-card border rounded-3xl shadow-sm", isStarrySky && "bg-card/40 backdrop-blur-md")}>
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Достар тізімі бос</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                    Достарыңызды қосып, олардың жетістіктерін көріңіз және бірге жарысыңыз.
                  </p>
                  <Button onClick={() => setActiveTab('search')} className="rounded-full px-8">
                    Дос іздеу
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map(friend => (
                    <div key={friend.uid} className={cn("flex flex-col p-5 bg-card border rounded-3xl shadow-sm gap-4 relative overflow-hidden", isStarrySky && "bg-card/40 backdrop-blur-md")}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
                      
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-14 h-14 border-2 border-background shadow-sm">
                            <AvatarImage src={friend.photoURL} />
                            <AvatarFallback>{friend.displayName?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-lg leading-tight">{friend.displayName || "Пайдаланушы"}</p>
                            <p className="text-xs text-primary font-medium">{friend.username || "Дос"}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveFriend(friend.uid)}>
                          <UserX className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-muted/30 rounded-2xl p-3 flex flex-col items-center justify-center">
                          <Activity className="w-5 h-5 text-primary mb-1" />
                          <span className="text-xs text-muted-foreground">Namaz Index</span>
                          <span className="font-bold text-lg">{friend.lastNI ? friend.lastNI.toFixed(1) : "—"}</span>
                        </div>
                        <div className="bg-muted/30 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                          <span className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                            {friend.bio ? `"${friend.bio}"` : "Био толтырылмаған"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
}
