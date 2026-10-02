export function StepProgress({ step, total = 2 }: { step: number; total?: number }) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex justify-between text-caption">
        <span className="font-bold text-brand-900">
          Etapa {step} de {total}
        </span>
        <span className="text-muted">{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < step ? 'h-1 flex-1 rounded-full bg-brand-900' : 'h-1 flex-1 rounded-full bg-slate-200'} />
        ))}
      </div>
    </div>
  )
}
