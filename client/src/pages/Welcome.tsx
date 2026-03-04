import { Button } from "@/components/ui/button";
import { Music, Mic2, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-purple-950 dark:via-purple-900 dark:to-blue-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-20 left-1/2 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Logo/Title Section */}
        <div className="mb-8 animate-bounce" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
              Vivioke
            </h1>
            <Mic2 className="w-12 h-12 text-pink-600 dark:text-pink-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            Seu Videokê Interativo
          </p>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            Cante, divirta-se e receba pontuação em tempo real!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-purple-900/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700 hover:shadow-lg transition-shadow">
            <Music className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100 mb-2">
              Centenas de Músicas
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Escolha entre seus sucessos favoritos
            </p>
          </div>

          <div className="bg-white/80 dark:bg-pink-900/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-pink-200 dark:border-pink-700 hover:shadow-lg transition-shadow">
            <Mic2 className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-pink-900 dark:text-pink-100 mb-2">
              Cante ao Vivo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Use seu microfone e cante com a música
            </p>
          </div>

          <div className="bg-white/80 dark:bg-blue-900/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-shadow">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-2">
              Pontuação Inteligente
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              IA analisa seu canto e dá feedback
            </p>
          </div>

          <div className="bg-white/80 dark:bg-green-900/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-200 dark:border-green-700 hover:shadow-lg transition-shadow">
            <Users className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-green-900 dark:text-green-100 mb-2">
              Diversão em Família
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Perfeito para confraternizações
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/songs">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Começar a Cantar 🎤
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-bold text-lg px-8 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30"
          >
            Saiba Mais
          </Button>
        </div>

        {/* Footer text */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sem necessidade de login • Totalmente gratuito • Compatível com desktop e web
        </p>
      </div>
    </div>
  );
}
