import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'maria@example.com', role: 'Participante', color: 'bg-primary' },
    { email: 'carlos@example.com', role: 'Revisor', color: 'bg-info' },
    { email: 'ana@example.com', role: 'Comité', color: 'bg-accent' },
    { email: 'admin@example.com', role: 'Admin', color: 'bg-warning' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f4c5c 100%)' }}>
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg">
              <Beaker className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">SciEvent</h1>
              <p className="text-sm text-gray-300">Gestión de Eventos Científicos</p>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 border-b-2 border-green-500">
              <CardTitle className="text-2xl font-display text-center" style={{ color: '#0f172a' }}>Iniciar Sesión</CardTitle>
              <CardDescription className="text-center">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#0f172a' }}>Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#0f172a' }}>Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-white font-bold hover:opacity-90 transition-opacity" 
                  style={{ background: '#1e40af' }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <p className="text-center text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="font-medium hover:underline" style={{ color: '#1e40af' }}>
                    Regístrate
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-green-500/20">
            <p className="text-xs font-medium text-gray-300 mb-3">
              Cuentas de demostración (clic para usar):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => setEmail(account.email)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-left border border-green-500/10"
                >
                  <div className={`h-2 w-2 rounded-full ${account.color}`} />
                  <div>
                    <p className="text-xs font-medium text-white">{account.role}</p>
                    <p className="text-xs text-gray-300 truncate">{account.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Hero */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-lg text-center text-white animate-fade-in">
          <div className="mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-lg mb-4">
              <Beaker className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-display font-bold mb-4">
              Gestiona tus eventos científicos de forma eficiente
            </h2>
            <div className="h-1 w-32 bg-green-500 mx-auto mb-6"></div>
          </div>
          <p className="text-lg opacity-90 mb-8">
            Plataforma integral para la gestión de congresos, conferencias y eventos académicos.
            Desde el envío de resúmenes hasta la emisión de certificados.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {['Registro Online', 'Revisión por Pares', 'Gestión de Programa', 'Certificados'].map((feature) => (
              <span key={feature} className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-green-500/20">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
