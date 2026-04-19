import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useStore } from "../store";
import { toast } from "sonner";
import {
  User, Share2, Globe, Trophy, Calculator, Moon, Sun, Sparkles, Bell,
  LineChart, Activity, Target, Users, TrendingUp, Lock, UserX, Database,
  LogOut, Settings2, Loader2, ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "../lib/utils";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">
        {title}
      </h3>
      <div className="bg-card border rounded-3xl overflow-hidden divide-y">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({ 
  icon, 
  bgColor, 
  title, 
  description, 
  onClick, 
  rightElement, 
  showChevron = true,
  disabled = false
}: { 
  icon: React.ReactNode; 
  bgColor: string; 
  title: string; 
  description: string; 
  onClick?: () => void; 
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}) {
  const isClickable = onClick && !disabled;
  const Tag = isClickable && !rightElement ? "button" : "div";

  return (
    <Tag 
      type={Tag === "button" ? "button" : undefined}
      className={cn(
        "w-full flex items-center gap-4 p-4 text-left transition-colors",
        isClickable ? "hover:bg-muted/50 active:bg-muted cursor-pointer" : "cursor-default",
        disabled && "opacity-50"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", bgColor)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-none">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        {showChevron && onClick && !rightElement && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>
    </Tag>
  );
}

interface SettingsScreenProps {
  setActiveTab: (tab: "leaderboard" | "home" | "calendar" | "statistics" | "settings" | "analytics" | "community") => void;
  setIsShareScreenOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  toggleStarrySky: () => void;
  isStarrySky: boolean;
  generateMockData: () => Promise<void>;
  isGeneratingMock: boolean;
  setIsLogoutDialogOpen: (open: boolean) => void;
}

export function SettingsScreen({
  setActiveTab,
  setIsShareScreenOpen,
  toggleDarkMode,
  toggleStarrySky,
  isStarrySky,
  generateMockData,
  isGeneratingMock,
  setIsLogoutDialogOpen
}: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const {
    user,
    username,
    bio,
    calculationMethod,
    setCalculationMethod,
    setPrayerTimes,
    isDarkMode,
    chartType,
    setChartType,
    showChartMarkers,
    setShowChartMarkers,
    showChartPriceLine,
    setShowChartPriceLine,
    showChartCommunity,
    setShowChartCommunity,
    showChartMA,
    setShowChartMA,
    isPrivate,
    setIsPrivate,
    gender,
    setUsername,
    setBio
  } = useStore();

  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || "");
  const [tempBio, setTempBio] = useState(bio || "");

  const handleTogglePrivate = async (checked: boolean) => {
    if (!user) return;
    setIsPrivate(checked);
    try {
      await setDoc(doc(db, "users", user.uid), {
        isPrivate: checked,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating privacy:", error);
      setIsPrivate(!checked); // Revert on error
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSavingProfile(true);
    const lowerUsername = tempUsername.trim().toLowerCase();
    let cleanUsername = lowerUsername;
    if (cleanUsername && !cleanUsername.startsWith("@")) {
      cleanUsername = "@" + cleanUsername;
    }
    
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        username: cleanUsername,
        username_lower: cleanUsername.toLowerCase(),
        bio: tempBio,
        gender: gender,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUsername(cleanUsername);
      setBio(tempBio);
      setIsProfileEditing(false);
      toast.success("Профиль сақталды");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Профильді сақтау кезінде қате шықты");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8 pb-28 px-4 pt-4 max-w-3xl mx-auto w-full">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-4 py-6 bg-card border rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-background shadow-2xl">
            <AvatarImage src={user?.photoURL || ""} referrerPolicy="no-referrer" />
            <AvatarFallback className="bg-muted"><User className="w-12 h-12 text-muted-foreground" /></AvatarFallback>
          </Avatar>
          <Button 
            size="icon" 
            variant="secondary" 
            className="absolute bottom-0 right-0 rounded-full w-9 h-9 shadow-xl border-2 border-background"
            onClick={() => setIsProfileEditing(true)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1 relative z-10">
          <h2 className="text-2xl font-bold tracking-tight">{user?.displayName || "Пайдаланушы"}</h2>
          <p className="text-sm text-indigo-500 font-mono font-bold">{username || "@username"}</p>
          {bio && <p className="text-sm text-muted-foreground max-w-[250px] mx-auto italic mt-2">"{bio}"</p>}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        <SettingsSection title="Профиль және қатынас">
          <SettingsItem 
            icon={<User className="w-5 h-5 text-blue-500" />}
            bgColor="bg-blue-500/10"
            title="Профильді өңдеу"
            description="Логин мен бионы өзгерту"
            onClick={() => setIsProfileEditing(true)}
          />
          <SettingsItem 
            icon={<Share2 className="w-5 h-5 text-emerald-500" />}
            bgColor="bg-emerald-500/10"
            title="Достармен бөлісу"
            description="Қосымшаны басқаларға ұсыну"
            onClick={() => setIsShareScreenOpen(true)}
          />
        </SettingsSection>

        <SettingsSection title="Қолданба баптаулары">
          <SettingsItem 
            icon={<Globe className="w-5 h-5 text-sky-500" />}
            bgColor="bg-sky-500/10"
            title="Тіл / Язык"
            description={i18n.language === "kk" ? "Қазақша" : "Русский"}
            rightElement={
              <Select 
                value={i18n.language} 
                onValueChange={(val) => i18n.changeLanguage(val)}
              >
                <SelectTrigger className="w-[100px] h-8 text-[10px] border-none bg-muted/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kk">Қазақша</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                </SelectContent>
              </Select>
            }
          />
          <SettingsItem 
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            bgColor="bg-yellow-500/10"
            title="Рейтинг"
            description="Пайдаланушылар көшбасшылар тақтасы"
            onClick={() => setActiveTab("leaderboard")}
          />
          <SettingsItem 
            icon={<Calculator className="w-5 h-5 text-indigo-500" />}
            bgColor="bg-indigo-500/10"
            title="Есептеу әдісі"
            description={calculationMethod === 2 ? "Қазақстан (ҚМДБ)" : "Басқа әдіс"}
            rightElement={
              <Select 
                value={calculationMethod.toString()} 
                onValueChange={(val) => {
                  setCalculationMethod(parseInt(val));
                  setPrayerTimes(null, "");
                }}
              >
                <SelectTrigger className="w-[100px] h-8 text-[10px] border-none bg-muted/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">ҚМДБ</SelectItem>
                  <SelectItem value="14">САМР</SelectItem>
                  <SelectItem value="13">Diyanet</SelectItem>
                </SelectContent>
              </Select>
            }
          />
          <SettingsItem 
            icon={isDarkMode ? <Moon className="w-5 h-5 text-purple-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
            bgColor={isDarkMode ? "bg-purple-500/10" : "bg-amber-500/10"}
            title="Түнгі режим"
            description="Көзге жайлы интерфейс"
            rightElement={
              <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            }
          />
          {isDarkMode && (
            <SettingsItem 
              icon={<Sparkles className="w-5 h-5 text-indigo-500" />}
              bgColor="bg-indigo-500/10"
              title="Жұлдызды аспан"
              description="Басты беттегі анимация"
              rightElement={
                <Switch checked={isStarrySky} onCheckedChange={toggleStarrySky} />
              }
            />
          )}
          <SettingsItem 
            icon={<Bell className="w-5 h-5 text-rose-500" />}
            bgColor="bg-rose-500/10"
            title="Хабарламалар"
            description="Намаз уақыттарын ескерту"
            rightElement={<Switch checked={true} />}
          />
        </SettingsSection>

        <SettingsSection title="Аналитика баптаулары">
          <SettingsItem 
            icon={<LineChart className="w-5 h-5 text-indigo-500" />}
            bgColor="bg-indigo-500/10"
            title="График түрі"
            description="Аналитика графигінің стилі"
            rightElement={
              <Select 
                value={chartType} 
                onValueChange={(val: any) => setChartType(val)}
              >
                <SelectTrigger className="w-[120px] h-8 text-[10px] border-none bg-muted/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baseline">Baseline</SelectItem>
                  <SelectItem value="candlestick">Шамдар (Кызыл/Жасыл)</SelectItem>
                  <SelectItem value="realtime">Realtime</SelectItem>
                </SelectContent>
              </Select>
            }
          />
          <SettingsItem 
            icon={<Activity className="w-5 h-5 text-emerald-500" />}
            bgColor="bg-emerald-500/10"
            title="Маркерлер"
            description="Керемет/Қаза белгілері"
            rightElement={
              <Switch checked={showChartMarkers} onCheckedChange={setShowChartMarkers} />
            }
          />
          <SettingsItem 
            icon={<Target className="w-5 h-5 text-teal-500" />}
            bgColor="bg-teal-500/10"
            title="Мақсатты сызық"
            description="80 ұпай деңгейі"
            rightElement={
              <Switch checked={showChartPriceLine} onCheckedChange={setShowChartPriceLine} />
            }
          />
          <SettingsItem 
            icon={<Users className="w-5 h-5 text-purple-500" />}
            bgColor="bg-purple-500/10"
            title="Қауымдастық"
            description="Орташа көрсеткіш"
            rightElement={
              <Switch checked={showChartCommunity} onCheckedChange={setShowChartCommunity} />
            }
          />
          <SettingsItem 
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            bgColor="bg-blue-500/10"
            title="Жылжымалы орташа"
            description="7 күндік тренд (MA)"
            rightElement={
              <Switch checked={showChartMA} onCheckedChange={setShowChartMA} />
            }
          />
        </SettingsSection>

        <SettingsSection title="Құпиялылық және Қауіпсіздік">
          <SettingsItem 
            icon={<Lock className="w-5 h-5 text-rose-500" />}
            bgColor="bg-rose-500/10"
            title="Профиль жабықтығы"
            description="Тек достар ғана көре алады"
            rightElement={<Switch checked={isPrivate} onCheckedChange={handleTogglePrivate} />}
          />
          <SettingsItem 
            icon={<UserX className="w-5 h-5 text-slate-500" />}
            bgColor="bg-slate-500/10"
            title="Блокталған қолданушылар"
            description="Блокталғандар тізімі"
            onClick={() => {}}
          />
        </SettingsSection>

        <SettingsSection title="Деректерді басқару">
          <SettingsItem 
            icon={<Database className="w-5 h-5 text-orange-500" />}
            bgColor="bg-orange-500/10"
            title="Тест деректері"
            description="30 күндік жасанды деректер"
            onClick={generateMockData}
            disabled={isGeneratingMock}
            rightElement={isGeneratingMock ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          />
          <SettingsItem 
            icon={<LogOut className="w-5 h-5 text-slate-500" />}
            bgColor="bg-slate-500/10"
            title="Шығу"
            description="Аккаунттан шығу"
            onClick={() => setIsLogoutDialogOpen(true)}
            showChevron={false}
          />
        </SettingsSection>
      </div>

      {/* Profile Edit Modal */}
      <Dialog open={isProfileEditing} onOpenChange={setIsProfileEditing}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Профильді өңдеу</DialogTitle>
            <DialogDescription className="text-xs">
              Логин мен бионы осы жерде өзгерте аласыз.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Логин (@username)</label>
              <Input 
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder="@username"
                className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Өзіңіз туралы</label>
              <Textarea 
                value={tempBio}
                onChange={(e) => setTempBio(e.target.value)}
                placeholder="Био..."
                className="rounded-2xl min-h-[120px] resize-none bg-muted/30 border-none focus-visible:ring-primary/20 p-4"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-3">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setIsProfileEditing(false)} disabled={isSavingProfile}>
              Бас тарту
            </Button>
            <Button className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20" onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Сақтау"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
