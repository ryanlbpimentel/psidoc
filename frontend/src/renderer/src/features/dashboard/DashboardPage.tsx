import { CirclePlus, UserPlus } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthContext'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { formatBRL, greeting } from '@/shared/lib/format'
import { clinicalSummary, monthlyRevenue, pendingPayments, todayAgenda } from './dashboard.data'

const card = 'rounded-2xl border border-line bg-white p-5'

export function DashboardPage() {
  const { user } = useAuth()
  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-ink">
            {greeting()}, {user?.name}
          </h1>
          <p className="mt-0.5 text-body text-muted">Aqui está o panorama geral da sua clínica para hoje.</p>
        </div>
        <div className="flex gap-2.5">
          <Button size="sm">
            <CirclePlus className="size-4" aria-hidden /> Nova Consulta
          </Button>
          <Button variant="outline" size="sm">
            <UserPlus className="size-4" aria-hidden /> Novo Paciente
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <section className={card} aria-labelledby="agenda-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="agenda-title" className="text-lead font-semibold">Agenda de Hoje</h2>
              <a href="#/agenda" className="text-body font-medium text-brand-700 hover:underline">Ver agenda completa</a>
            </div>
            <ul className="space-y-2.5">
              {todayAgenda.map((item) => (
                <li key={item.time} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="rounded-lg bg-brand-100 px-2 py-1 text-caption font-semibold text-brand-700">{item.time}</span>
                  <span className="flex-1 text-body font-semibold">{item.patient}</span>
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-caption font-medium text-brand-700">{item.place}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={card} aria-labelledby="pending-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="pending-title" className="text-lead font-semibold">Sessões Pendentes de Pagamento</h2>
              <a href="#/financeiro" className="text-body font-medium text-danger hover:underline">Ver inadimplentes</a>
            </div>
            <ul className="space-y-2.5">
              {pendingPayments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5">
                  <div className="flex-1">
                    <p className="text-body font-semibold">{p.patient}</p>
                    <p className="text-caption text-muted">{p.session}</p>
                  </div>
                  <span className="text-body font-bold">{formatBRL(p.amount)}</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-caption font-medium text-orange-600">Cobrar</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl bg-brand-700 p-5 text-white shadow-[0_16px_32px_-16px_rgba(10,92,168,0.7)]">
            <p className="text-caption tracking-wide text-white/85 uppercase">Faturamento do mês</p>
            <p className="mt-1.5 text-title font-bold">{formatBRL(monthlyRevenue.total)}</p>
            <div className="mt-4 flex items-center justify-between border-t border-white/25 pt-3 text-caption text-white/90">
              <span>{monthlyRevenue.previousMonthLabel}</span>
              <span className="rounded-md bg-white/20 px-1.5 py-0.5 font-semibold">{monthlyRevenue.variation}</span>
            </div>
          </section>

          <section className={card} aria-labelledby="summary-title">
            <h2 id="summary-title" className="mb-3 text-body font-semibold">Resumo Clínico</h2>
            <dl className="space-y-2">
              {clinicalSummary.map((row) => (
                <div key={row.label} className="flex justify-between text-caption">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className={cn('font-bold', row.alert && 'text-danger')}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
