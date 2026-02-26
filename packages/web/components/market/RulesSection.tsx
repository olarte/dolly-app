import { UI } from '@/lib/strings'
import type { RulesData } from '@/hooks/useMockMarketDetail'

interface RulesSectionProps {
  rules: RulesData
}

export default function RulesSection({ rules }: RulesSectionProps) {
  return (
    <section className="mt-8">
      {/* Centered RULES header */}
      <h2 className="text-sm font-bold text-text-primary tracking-widest text-center mb-5">
        {UI.market.rules}
      </h2>

      {/* Fechas clave */}
      <h3 className="text-[13px] font-bold text-text-primary mb-2.5">
        Fechas clave
      </h3>
      <ul className="space-y-2 text-[13px] text-text-secondary mb-5">
        <li className="flex gap-2">
          <span className="text-text-muted mt-0.5">•</span>
          <span>
            <span className="text-text-muted">{UI.market.period}: </span>
            <span className="font-medium text-text-primary">{rules.period}</span>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-text-muted mt-0.5">•</span>
          <span>
            <span className="text-text-muted">{UI.market.closeDate}: </span>
            <span className="font-medium text-text-primary">{rules.closeDate}</span>
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-text-muted mt-0.5">•</span>
          <span>
            <span className="text-text-muted">{UI.market.resolutionTime}: </span>
            <span className="font-medium text-text-primary">{rules.resolutionTime}</span>
          </span>
        </li>
      </ul>

      {/* Criterios de Resolución */}
      <h3 className="text-[13px] font-bold text-sube-green mb-2.5">
        Criterios de Resolución
      </h3>
      <ul className="space-y-2 text-[13px] text-text-secondary mb-5">
        <li className="flex gap-2">
          <span className="text-sube-green mt-0.5">•</span>
          <span>{rules.subeCondition}</span>
        </li>
        <li className="flex gap-2">
          <span className="text-baja-red mt-0.5">•</span>
          <span>{rules.bajaCondition}</span>
        </li>
      </ul>

      {/* Detalles de Resolución */}
      <h3 className="text-[13px] font-bold text-text-primary mb-2.5">
        Detalles de Resolución
      </h3>
      <p className="text-[12px] text-text-muted leading-relaxed mb-5">
        {rules.details}
      </p>

      {/* Fuente de Resolución */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-text-muted font-medium">
          {UI.market.resolutionSource}:
        </span>
        <div className="w-5 h-5 rounded-full bg-nav-dark flex items-center justify-center flex-shrink-0">
          <span className="text-[9px] text-white font-bold">BR</span>
        </div>
        <a
          href={rules.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-semibold text-blue-600 hover:underline"
        >
          {rules.source}
        </a>
      </div>
    </section>
  )
}
