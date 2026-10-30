import React, { useState } from 'react';
import { Cloud, GitBranch, Terminal, Check, Copy, X, Cpu, Zap, ShieldCheck } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const wranglerConfig = `name = "mini-cod"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"`;

  const copyConfig = () => {
    navigator.clipboard.writeText(wranglerConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Cloud className="w-6 h-6 text-orange-400" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                DÉPLOIEMENT GRATUIT SUR CLOUDFLARE PAGES
              </h2>
              <p className="text-xs text-neutral-400">
                La solution la plus adaptée pour jouer en multijoueur 100% gratuitement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-xs text-neutral-300">
          {/* Why Cloudflare is superior to Render */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">Pourquoi Cloudflare Pages plutôt que Render ?</h4>
              <p className="text-neutral-300 leading-relaxed">
                Render met les serveurs gratuits en veille au bout de 15 minutes d'inactivité (temps de démarrage lent de 50s). 
                À l'inverse, <strong>Cloudflare Pages est 100% gratuit, permanent, sans mise en veille et avec bande passante illimitée</strong> sur le réseau mondial le plus rapide au monde.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-[11px] pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Multijoueur WebRTC P2P direct : 0 € de coût serveur pour vous !</span>
              </div>
            </div>
          </div>

          {/* Step 1: Git Push */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> 1. Pousser le code sur votre GitHub
            </h3>
            <div className="p-3 rounded-lg bg-black/80 border border-neutral-800 space-y-1 font-mono text-[11px] text-neutral-300">
              <p><span className="text-amber-400">$</span> git init</p>
              <p><span className="text-amber-400">$</span> git add .</p>
              <p><span className="text-amber-400">$</span> git commit -m "Mini CoD Multiplayer Cloudflare"</p>
              <p><span className="text-amber-400">$</span> git branch -M main</p>
              <p><span className="text-amber-400">$</span> git remote add origin https://github.com/votre-compte/mini-cod.git</p>
              <p><span className="text-amber-400">$</span> git push -u origin main</p>
            </div>
          </div>

          {/* Step 2: Cloudflare Config */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" /> 2. Lier sur Cloudflare Pages (Gratuit)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
              <li>Connectez-vous sur <strong className="text-white">dash.cloudflare.com</strong> (gratuit).</li>
              <li>Allez dans l'onglet <strong className="text-white">Workers & Pages</strong> &gt; <strong className="text-white">Create application</strong> &gt; <strong className="text-white">Pages</strong>.</li>
              <li>Cliquez sur <strong className="text-white">Connect to Git</strong> et sélectionnez votre dépôt.</li>
              <li>Indiquez les paramètres de compilation :</li>
            </ol>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Build Command</span>
                <p className="text-white font-mono font-bold mt-1">npm run build</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Build Output Directory</span>
                <p className="text-amber-400 font-mono font-bold mt-1">dist</p>
              </div>
            </div>
          </div>

          {/* Wrangler config */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 uppercase font-bold">
                Fichier wrangler.toml (Déjà inclus à la racine)
              </span>
              <button
                onClick={copyConfig}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-orange-400 cursor-pointer font-bold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-black/90 border border-neutral-800 text-[11px] text-orange-300/90 overflow-x-auto">
              {wranglerConfig}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs cursor-pointer transition-all"
          >
            Fermer le Guide
          </button>
        </div>
      </div>
    </div>
  );
};
