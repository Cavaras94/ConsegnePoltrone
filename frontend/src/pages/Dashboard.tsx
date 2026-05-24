import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, Clock, TrendingUp, AlertCircle, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/report.service';
import { consegneService } from '../services/consegne.service';
import { StatoBadge } from '../components/ui/StatoBadge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { StatoConsegna } from '../types';

export default function Dashboard() {
  const { user, isAdmin, isManager, isTrasportatore } = useAuth();

  // Admin/Manager: mostra statistiche globali
  const { data: stats } = useQuery({
    queryKey: ['statistiche'],
    queryFn: reportService.getStatistiche,
    enabled: isAdmin || isManager,
  });

  // Trasportatore: mostra le sue consegne di oggi/prossime
  const { data: consegneResult } = useQuery({
    queryKey: ['consegne', 'dashboard'],
    queryFn: () => consegneService.getConsegne({ perPagina: 5 }),
    enabled: isTrasportatore,
  });

  const oggi = format(new Date(), 'EEEE d MMMM yyyy', { locale: it });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Ciao, {user?.nome}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{oggi}</p>
      </div>

      {/* Admin/Manager: statistiche */}
      {(isAdmin || isManager) && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Package}
              label="Totale consegne"
              value={stats.totaleConsegne}
              color="blue"
            />
            <StatCard
              icon={Clock}
              label="Da pianificare"
              value={stats.daPianificare}
              color="gray"
            />
            <StatCard
              icon={Truck}
              label="In transito"
              value={stats.inTransito}
              color="yellow"
            />
            <StatCard
              icon={CheckCircle}
              label="Consegnate"
              value={stats.consegnate}
              color="green"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard icon={AlertCircle} label="Non consegnate" value={stats.nonConsegnate} color="red" />
            <StatCard icon={TrendingUp} label="Questo mese" value={stats.consegneMese} color="purple" />

            {/* Consegne oggi */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">Consegne oggi</h3>
                <span className="text-2xl font-bold text-blue-600">{stats.consegneOggi}</span>
              </div>
              <p className="text-xs text-gray-500">Pianificate per la data odierna</p>
              <Link to="/consegne" className="mt-4 block text-center text-xs font-medium text-blue-600 hover:text-blue-700">
                Vedi tutte le consegne →
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Trasportatore: le sue prossime consegne */}
      {isTrasportatore && consegneResult && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Le mie consegne</p>
              <p className="text-3xl font-bold text-blue-700">{consegneResult.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium mb-1">Da completare</p>
              <p className="text-3xl font-bold text-yellow-700">
                {consegneResult.data.filter(c =>
                  c.stato !== 'Consegnata' && c.stato !== 'Annullata'
                ).length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Ultime consegne</h3>
              <Link to="/consegne" className="text-xs text-blue-600 font-medium hover:text-blue-700">
                Vedi tutte →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {consegneResult.data.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to={`/consegne/${c.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.clienteNome}</p>
                    <p className="text-xs text-gray-500 truncate">{c.clienteCitta} • #{c.numeroOrdine}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatoBadge stato={c.stato as StatoConsegna} />
                    {c.dataPrevistaConsegna && (
                      <p className="text-xs text-gray-400">
                        {format(new Date(c.dataPrevistaConsegna), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  small = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'orange';
  small?: boolean;
}) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   val: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500',  val: 'text-green-700' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    val: 'text-red-700' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-500', val: 'text-yellow-700' },
    gray:   { bg: 'bg-gray-50',   icon: 'text-gray-400',   val: 'text-gray-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', val: 'text-purple-700' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500', val: 'text-orange-700' },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex p-2 rounded-lg ${c.bg} mb-3`}>
        <Icon size={18} className={c.icon} />
      </div>
      <p className={`${small ? 'text-xl' : 'text-2xl'} font-bold ${c.val}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
