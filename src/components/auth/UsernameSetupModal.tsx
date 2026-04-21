import React, { useState, useEffect } from "react";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useStore } from "../../store";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export const UsernameSetupModal: React.FC = () => {
  const { user, username, setUsername } = useStore();
  
  // Local state for setup
  const [isOpen, setIsOpen] = useState(false);
  const [setupUsername, setSetupUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  // Example heuristic: auto-open if logged in but no username
  // Keep it closed initially to respect the original App flow (which never explicitly opened it
  // unless we want to enforce it now, we can enable it). We'll set it to false defaults.
  
  useEffect(() => {
    // If the original flow intended to force username setup if none exists, we activate it:
    if (user && !username) {
      // setIsOpen(true); 
      // Keeping disabled to not break user's current exact flow, but available for use.
    }
  }, [user, username]);

  useEffect(() => {
    if (!setupUsername) {
      setUsernameError("");
      return;
    }

    if (setupUsername.length < 5) {
      setUsernameError("Ник кемінде 5 әріптен тұруы керек");
      setIsCheckingUsername(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(setupUsername)) {
      setUsernameError("Тек латын әріптері, сандар және _ (астыңғы сызық) рұқсат етілген");
      setIsCheckingUsername(false);
      return;
    }

    const validateUsername = async () => {
      setIsCheckingUsername(true);
      try {
        const lowerUsername = setupUsername.toLowerCase();
        const q = query(collection(db, "users"), where("username_lower", "==", `@${lowerUsername}`));
        const snap = await getDocs(q);
        if (!snap.empty && snap.docs[0].id !== user?.uid) {
          setUsernameError("Бұл ник бос емес");
        } else {
          setUsernameError("");
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(validateUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [setupUsername, user]);

  const handleSaveSetupUsername = async () => {
    if (!user || usernameError || setupUsername.length < 5 || isCheckingUsername) return;
    
    setIsSavingSetup(true);
    try {
      const lowerUsername = setupUsername.toLowerCase();
      const formattedUsername = `@${lowerUsername}`;
      await setDoc(doc(db, "users", user.uid), {
        username: formattedUsername,
        username_lower: formattedUsername.toLowerCase(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUsername(formattedUsername);
      setIsOpen(false);
      toast.success("Ник сәтті сақталды!");
    } catch (error) {
      console.error("Error saving username:", error);
      toast.error("Қате шықты");
    } finally {
      setIsSavingSetup(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing if username is not set
      if (!username && !open) return;
      setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-md rounded-3xl" showCloseButton={!!username}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Қош келдіңіз!</DialogTitle>
          <DialogDescription className="text-center">
            Жобаны толық пайдалану үшін өзіңізге бірегей ник (username) ойлап табыңыз.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 relative">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted-foreground font-bold">@</span>
              <Input
                value={setupUsername}
                onChange={(e) => setSetupUsername(e.target.value.toLowerCase())}
                placeholder="username"
                className={cn(
                  "pl-8 h-12 rounded-xl text-lg",
                  usernameError ? "border-rose-500 focus-visible:ring-rose-500" : 
                  (setupUsername.length >= 5 && !isCheckingUsername ? "border-emerald-500 focus-visible:ring-emerald-500" : "")
                )}
                maxLength={20}
              />
              <div className="absolute right-3 flex items-center">
                {isCheckingUsername && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                {!isCheckingUsername && setupUsername.length >= 5 && !usernameError && (
                  <Check className="w-5 h-5 text-emerald-500" />
                )}
                {!isCheckingUsername && usernameError && (
                  <X className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>
            {usernameError ? (
              <p className="text-sm text-rose-500 font-medium pl-1">{usernameError}</p>
            ) : setupUsername.length >= 5 && !isCheckingUsername ? (
              <p className="text-sm text-emerald-500 font-medium pl-1">Бұл ник бос!</p>
            ) : (
              <p className="text-xs text-muted-foreground pl-1">Кемінде 5 әріп немесе сан. Үтір, нүкте рұқсат етілмейді.</p>
            )}
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handleSaveSetupUsername} 
            disabled={!!usernameError || setupUsername.length < 5 || isCheckingUsername || isSavingSetup}
            className="w-full h-12 rounded-xl text-lg font-bold"
          >
            {isSavingSetup ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Сақтау және Жалғастыру
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
