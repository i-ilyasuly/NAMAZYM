import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, Grid, Video, Stars, Loader2, Sparkles, Image as ImageIcon, Plus, X, Upload, FileVideo, FileImage } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { toast } from 'sonner';

interface Wallpaper {
  id: string;
  type: 'image' | 'video' | 'stars';
  url: string;
  thumbnail: string;
  name: string;
  category: string;
}

const ADMIN_EMAILS = ['ilyasuly.isakhan@gmail.com', 'momyn.halal@gmail.com'];

const PRESET_WALLPAPERS: Wallpaper[] = [
  {
    id: 'none',
    type: 'image',
    url: '',
    thumbnail: '',
    name: 'Қарапайым',
    category: 'Классикалық'
  },
  {
    id: 'stars-default',
    type: 'stars',
    url: '',
    thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=300&h=400',
    name: 'Жұлдызды аспан',
    category: 'Классикалық'
  },
  {
    id: 'mosque-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=300&h=400',
    name: 'Көгілдір мешіт',
    category: 'Мешіттер'
  },
  {
    id: 'video-nature',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-background-9052-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=300&h=400',
    name: 'Түнгі аспан (Видео)',
    category: 'Видео'
  },
  {
    id: 'desert-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=300&h=400',
    name: 'Түнгі шөл',
    category: 'Табиғат'
  },
  {
    id: 'kaaba-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=300&h=400',
    name: 'Мекке',
    category: 'Қасиетті орындар'
  },
  {
    id: 'abstract-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=300&h=400',
    name: 'Ислами өрнек',
    category: 'Абстракция'
  }
];

export default function WallpaperGallery({ onBack }: { onBack: () => void }) {
  const { 
    user,
    backgroundType, 
    setBackgroundType, 
    backgroundUrl, 
    setBackgroundUrl,
    backgroundName,
    setBackgroundName,
    setIsStarrySky
  } = useStore();
  
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>(PRESET_WALLPAPERS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const handleDelete = async (e: React.MouseEvent, wallpaperId: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (!window.confirm("Бұл тұсқағазды өшіруді растайсыз ба?")) return;

    try {
      await deleteDoc(doc(db, 'wallpapers', wallpaperId));
      toast.success("Өшірілді");
    } catch (error) {
      toast.error("Қате шықты");
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'wallpapers'), 
      orderBy('id', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fbWallpapers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallpaper));
      setWallpapers([...PRESET_WALLPAPERS, ...fbWallpapers]);
    }, (error) => {
      console.error("Error fetching wallpapers:", error);
      // If error (like missing index), fallback to simple query
      const fallbackUnsubscribe = onSnapshot(collection(db, 'wallpapers'), (snapshot) => {
        const fbWallpapers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallpaper));
        setWallpapers([...PRESET_WALLPAPERS, ...fbWallpapers]);
      });
      return () => fallbackUnsubscribe();
    });

    return () => unsubscribe();
  }, []);

  const filteredWallpapers = wallpapers.filter(w => {
    if (activeTab === 'all') return true;
    return w.type === activeTab;
  });

  const handleSelect = (w: Wallpaper) => {
    if (w.id === 'none') {
      setBackgroundType('image');
      setBackgroundUrl(null);
      setBackgroundName('Қарапайым');
      setIsStarrySky(false);
      return;
    }
    
    setBackgroundType(w.type);
    setBackgroundUrl(w.url);
    setBackgroundName(w.name);
    if (w.type === 'stars') {
      setIsStarrySky(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors">
          <ChevronLeft className="w-6 h-6 text-zinc-100" />
        </button>
        <span className="text-lg font-bold text-zinc-100">Тұсқағаздар галереясы</span>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="ml-auto p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Add Wallpaper Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Жаңа тусқағаз қосу</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-zinc-800">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <AddWallpaperForm 
                onSuccess={() => {
                  setShowAddModal(false);
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex px-4 py-2 gap-2 bg-zinc-950/50">
        {[
          { id: 'all', label: 'Барлығы', icon: Grid },
          { id: 'image', label: 'Фото', icon: ImageIcon },
          { id: 'video', label: 'Видео', icon: Video },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div className="grid grid-cols-2 gap-4">
          {filteredWallpapers.map((w) => {
            const isActive = w.id === 'none' 
              ? (!backgroundUrl && backgroundType === 'image')
              : (w.type === backgroundType && (w.type === 'stars' || w.url === backgroundUrl));
            
            return (
              <motion.div
                key={w.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(w)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 ring-2 ring-transparent transition-all hover:ring-emerald-500/50 cursor-pointer"
              >
                {/* Background Image/Thumbnail */}
                {w.id === 'none' ? (
                  <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800">
                    <X className="w-10 h-10 text-zinc-700 mb-2" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center px-2">Фонсыз (Стандарт)</span>
                  </div>
                ) : (
                  <>
                    {w.thumbnail ? (
                      <img 
                        src={w.thumbnail} 
                        alt={w.name}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                          isActive ? "opacity-40" : "opacity-80"
                        )}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement?.classList.add('bg-zinc-800');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        {w.type === 'video' ? <Video className="w-10 h-10 text-zinc-700" /> : <ImageIcon className="w-10 h-10 text-zinc-700" />}
                      </div>
                    )}
                  </>
                )}
                
                {/* Fallback Icon if image fails */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-[.bg-zinc-800]:opacity-100">
                   {w.type === 'video' ? <Video className="w-8 h-8 text-zinc-600" /> : <ImageIcon className="w-8 h-8 text-zinc-600" />}
                </div>
                {/* Type Icon overlay */}
                <div className="absolute top-3 left-3 p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
                  {w.id === 'none' ? <X className="w-3 h-3 text-white" /> : 
                   w.type === 'stars' ? <Stars className="w-3 h-3 text-white" /> : 
                   w.type === 'video' ? <Video className="w-3 h-3 text-white" /> : 
                   <ImageIcon className="w-3 h-3 text-white" />}
                </div>

                {/* Selection indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="p-3 rounded-full bg-emerald-500 text-white shadow-xl">
                        <Check className="w-6 h-6 stroke-[3px]" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{w.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{w.category}</p>
                    </div>
                    {isAdmin && !PRESET_WALLPAPERS.find(p => p.id === w.id) && (
                      <button 
                        onClick={(e) => handleDelete(e, w.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white transition-all ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Жаңа тұсқағаздар қосу</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Өз тұсқағаздарыңызды немесе видеоларыңызды қосу үшін <b>Firebase Console</b>-ге кіріп, 
                <code className="bg-black/40 px-1 rounded mx-1 text-emerald-400">wallpapers</code> 
                коллекциясына жаңа құжат қоссаңыз жеткілікті. Өзгерістер бірден іске асады!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddWallpaperForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: 'image' as 'image' | 'video',
    url: '',
    thumbnail: ''
  });
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = async (selectedFile: File) => {
    const storageRef = ref(storage, `wallpapers/${Date.now()}_${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error(error);
          toast.error("Жүктеу кезінде қате шықты");
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Атауын енгізіңіз");
      return;
    }
    
    if (!file && !formData.url) {
      toast.error("Файлды жүктеңіз немесе сілтемесін қойыңыз");
      return;
    }

    setLoading(true);
    try {
      let finalUrl = formData.url;
      if (file) {
        finalUrl = await handleFileUpload(file);
      }

      await addDoc(collection(db, 'wallpapers'), {
        ...formData,
        url: finalUrl,
        thumbnail: formData.thumbnail || finalUrl, // Fallback to main URL if no thumbnail
        id: Date.now().toString(),
        createdAt: new Date()
      });
      
      toast.success("Тұсқағаз сәтті қосылды!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Сақтау кезінде қате шықты");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Атауы</label>
        <input 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="w-full h-12 bg-zinc-800 border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
          placeholder="Мысалы: Көгілдір мешіт"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Категория</label>
        <input 
          value={formData.category}
          onChange={e => setFormData({...formData, category: e.target.value})}
          className="w-full h-12 bg-zinc-800 border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
          placeholder="Табиғат, Мешіттер т.б."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Түрі</label>
          <div className="flex bg-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setFormData({...formData, type: 'image'});
                setFile(null);
              }}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                formData.type === 'image' ? "bg-zinc-700 text-white" : "text-zinc-500"
              )}
            >Фото</button>
            <button
              type="button"
              onClick={() => {
                setFormData({...formData, type: 'video'});
                setFile(null);
              }}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                formData.type === 'video' ? "bg-zinc-700 text-white" : "text-zinc-500"
              )}
            >Видео</button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
          {formData.type === 'image' ? 'Фото жүктеу' : 'Видео жүктеу'}
        </label>
        
        {!file ? (
          <label className="flex flex-col items-center justify-center w-full h-32 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-2xl cursor-pointer hover:bg-zinc-800 hover:border-emerald-500/50 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-zinc-500 group-hover:text-emerald-500 mb-2" />
              <p className="text-xs text-zinc-500">Файлды таңдаңыз</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept={formData.type === 'image' ? "image/*" : "video/*"}
              onChange={(e) => {
                const sFile = e.target.files?.[0];
                if (sFile) setFile(sFile);
              }}
            />
          </label>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              {formData.type === 'image' ? <FileImage className="w-5 h-5 text-emerald-500" /> : <FileVideo className="w-5 h-5 text-emerald-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-100 truncate">{file.name}</p>
              <p className="text-[10px] text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button 
              type="button"
              onClick={() => setFile(null)}
              className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Превью URL (Thumbnail) - Міндетті емес</label>
        <input 
          value={formData.thumbnail}
          onChange={e => setFormData({...formData, thumbnail: e.target.value})}
          className="w-full h-12 bg-zinc-800 border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
          placeholder="Кішірейтілген сурет (jpg/png) сілтемесі"
        />
        {formData.type === 'video' && (
          <p className="text-[10px] text-zinc-500 ml-1">Видеолар үшін мұқаба (сурет) сілтемесін қойған дұрыс.</p>
        )}
      </div>

      {loading && uploadProgress > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Жүктелуде...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      )}

      <button
        disabled={loading}
        className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-bold mt-6 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Жүктелуде...</span>
          </>
        ) : 'Сақтау'}
      </button>
    </form>
  );
}

