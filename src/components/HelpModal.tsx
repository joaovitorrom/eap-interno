import Icon from './Icon';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface dark:bg-surface border border-outline-variant rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-md border-b border-outline-variant/40 px-8 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="school" className="text-primary" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Central de Ajuda</h2>
              <p className="text-xs text-on-surface-variant">Guia rápido sobre EAP e PERT</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-high/50 rounded-lg transition-all cursor-pointer text-on-surface-variant hover:text-on-surface">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8 text-sm text-on-surface-variant leading-relaxed">

          {/* EAP Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="account_tree" className="text-primary" size={20} />
              <h3 className="text-base font-bold text-on-surface">O que é a EAP?</h3>
            </div>
            <p className="mb-3">
              A <strong className="text-on-surface">Estrutura Analítica de Projeto (EAP)</strong> — ou <em>Work Breakdown Structure (WBS)</em> — é uma decomposição hierárquica do escopo total do projeto em entregas menores e gerenciáveis.
            </p>
            <div className="bg-bg/50 dark:bg-bg/50 rounded-lg p-4 border border-outline-variant/20 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-xs mt-0.5">1.</span>
                <span><strong className="text-on-surface">Projeto</strong> → O objetivo final (ex: "Sistema de Clínica Médica")</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-xs mt-0.5">2.</span>
                <span><strong className="text-on-surface">Módulos</strong> → Grandes blocos de funcionalidade, equivalentes às <b>Épicos</b> (ex: "Dashboard Financeiro", "Histórico", "Configurações")</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-xs mt-0.5">3.</span>
                <span><strong className="text-on-surface">Tarefas</strong> → Funcionalidades específicas e estimáveis, equivalentes às <b>Histórias de Usuário</b> (ex: "Login com E-mail e Senha", "Esqueci minha senha", "Cadastro de novo usuário", etc)</span>
              </div>
            </div>
          </section>

          {/* PERT Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="calculate" className="text-primary" size={20} />
              <h3 className="text-base font-bold text-on-surface">Estimativa PERT</h3>
            </div>
            <p className="mb-3">
              O método <strong className="text-on-surface">PERT</strong> (Program Evaluation and Review Technique) usa três estimativas para calcular o esforço esperado de cada tarefa, reduzindo a incerteza.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-bg/50 dark:bg-bg/50 rounded-lg p-3 border border-outline-variant/20 text-center">
                <div className="text-lg font-bold text-on-surface mb-1">O</div>
                <div className="text-[11px] font-medium text-on-surface-variant">Otimista</div>
                <div className="text-[10px] text-outline mt-1">Melhor cenário possível</div>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
                <div className="text-lg font-bold text-primary mb-1">M</div>
                <div className="text-[11px] font-medium text-primary">Mais Provável</div>
                <div className="text-[10px] text-outline mt-1">Cenário realista (peso 4x)</div>
              </div>
              <div className="bg-bg/50 dark:bg-bg/50 rounded-lg p-3 border border-outline-variant/20 text-center">
                <div className="text-lg font-bold text-on-surface mb-1">P</div>
                <div className="text-[11px] font-medium text-on-surface-variant">Pessimista</div>
                <div className="text-[10px] text-outline mt-1">Pior cenário plausível</div>
              </div>
            </div>

            {/* Formula */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
              <div className="text-xs text-primary uppercase tracking-wider font-bold mb-2">Fórmula PERT</div>
              <div className="text-2xl font-bold text-on-surface tracking-wide">
                TE = (O + 4M + P) / 6
              </div>
              <div className="text-xs text-on-surface-variant mt-2">
                TE = Tempo Esperado em horas
              </div>
            </div>
          </section>

          {/* Buffer Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="shield" className="text-primary" size={20} />
              <h3 className="text-base font-bold text-on-surface">Buffer de Segurança (35%)</h3>
            </div>
            <p className="mb-3">
              A Unect aplica um <strong className="text-on-surface">buffer de 35%</strong> sobre o total de horas líquidas para absorver imprevistos, revisões e ajustes de escopo.
            </p>
            <div className="bg-bg/50 dark:bg-bg/50 rounded-lg p-4 border border-outline-variant/20">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-on-surface-variant">Horas Líquidas</span>
                <span className="text-on-surface font-semibold">100h</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-primary">+ Buffer (35%)</span>
                <span className="text-primary font-semibold">+35h</span>
              </div>
              <div className="border-t border-outline-variant/20 pt-2 flex items-center justify-between text-xs">
                <span className="text-on-surface font-bold">Total Estimado</span>
                <span className="text-primary font-bold text-base">135h</span>
              </div>
            </div>
          </section>

          {/* Variance Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="trending_up" className="text-primary" size={20} />
              <h3 className="text-base font-bold text-on-surface">Variância e Desvio Padrão</h3>
            </div>
            <p className="mb-3">
              Na aba <strong className="text-on-surface">Revisão</strong>, o sistema calcula métricas estatísticas adicionais:
            </p>
            <div className="bg-bg/50 dark:bg-bg/50 rounded-lg p-4 border border-outline-variant/20 space-y-3">
              <div>
                <span className="text-on-surface font-semibold text-xs">Variância (σ²)</span>
                <span className="text-on-surface-variant text-xs ml-2">= ((P - O) / 6)²</span>
              </div>
              <div>
                <span className="text-on-surface font-semibold text-xs">Desvio Padrão (σ)</span>
                <span className="text-on-surface-variant text-xs ml-2">= √(Σ das variâncias)</span>
              </div>
              <div>
                <span className="text-on-surface font-semibold text-xs">Intervalo 95%</span>
                <span className="text-on-surface-variant text-xs ml-2">= TE ± 1.96σ</span>
              </div>
            </div>
          </section>

          {/* Workflow */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="route" className="text-primary" size={20} />
              <h3 className="text-base font-bold text-on-surface">Fluxo de Trabalho</h3>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { step: '1', icon: 'add_circle', text: 'Crie um novo projeto no Dashboard' },
                { step: '2', icon: 'view_module', text: 'Adicione módulos (blocos de funcionalidade)' },
                { step: '3', icon: 'edit_note', text: 'Cadastre tarefas com valores O, M e P' },
                { step: '4', icon: 'visibility', text: 'Use a aba Revisão para ver a análise completa' },
                { step: '5', icon: 'download', text: 'Exporte em CSV para a planilha de precificação' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg/30 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-xs font-bold">{item.step}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name={item.icon} className="text-outline" size={16} />
                    <span className="text-on-surface text-xs">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface/95 backdrop-blur-md border-t border-outline-variant/40 px-8 py-4 flex justify-between items-center rounded-b-2xl">
          <span className="text-[11px] text-outline">Unect Jr. © 2026</span>
          <button onClick={onClose} className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-medium hover:bg-primary-dim transition-all cursor-pointer">
            Entendi!
          </button>
        </div>
      </div>
    </div>
  );
}
