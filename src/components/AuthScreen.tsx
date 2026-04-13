import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Moon, Mail, Lock, Loader2 } from 'lucide-react';

export function AuthScreen() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || "Қателік кетті");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Электрондық пошта мен құпиясөзді енгізіңіз");
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError("Құпиясөз немесе пошта қате");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError("Барлық жолақтарды толтырыңыз");
      return;
    }
    if (password !== confirmPassword) {
      setError("Құпиясөздер сәйкес келмейді");
      return;
    }
    if (password.length < 6) {
      setError("Құпиясөз кем дегенде 6 таңбадан тұруы керек");
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError("Желілік қате немесе Электрондық пошта арқылы тіркелу Firebase консолінде қосылмаған. Баптауларды тексеріңіз.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Бұл электрондық пошта тіркелген. Кіру бөлімін пайдаланыңыз.");
      } else {
        setError(err.message || "Тіркелу кезінде қателік кетті");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Құпиясөзді қалпына келтіру үшін электрондық поштаңызды енгізіңіз");
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      setResetMessage('');
      await sendPasswordResetEmail(auth, email);
      setResetMessage("Құпиясөзді қалпына келтіру сілтемесі поштаңызға жіберілді!");
    } catch (err: any) {
      setError(err.message || "Қателік кетті");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Moon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('app_name', { defaultValue: 'Намаз Трекер' })}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Жалғастыру үшін жүйеге кіріңіз немесе тіркеліңіз
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full" onValueChange={() => { setError(''); setResetMessage(''); setPassword(''); setConfirmPassword(''); }}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Кіру</TabsTrigger>
            <TabsTrigger value="register">Тіркелу</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Қош келдіңіз!</CardTitle>
                <CardDescription>
                  Өз аккаунтыңызға кіру үшін мәліметтеріңізді енгізіңіз.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</div>}
                {resetMessage && <div className="p-3 text-sm text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">{resetMessage}</div>}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Электрондық пошта</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@example.com" 
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Құпиясөз</Label>
                      <button 
                        type="button" 
                        onClick={handleResetPassword}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Құпиясөзді ұмыттыңыз ба?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        className="pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Кіру
                  </Button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Немесе
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google арқылы кіру
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Жаңа аккаунт ашу</CardTitle>
                <CardDescription>
                  Тіркелу үшін төмендегі мәліметтерді толтырыңыз.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">{error}</div>}
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Электрондық пошта</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="name@example.com" 
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Құпиясөз</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="register-password" 
                        type="password" 
                        className="pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Құпиясөзді қайталаңыз</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="register-confirm-password" 
                        type="password" 
                        className="pl-9"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Тіркелу
                  </Button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Немесе
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google арқылы тіркелу
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
