import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { reportService } from '../services/report.service';
import { TrendingUp, Package, Users } from 'lucide-react';

const COLORS = {
  Consegnate: '#22c55e',
  NonConsegnate: '#ef4444',
  Totale: '#3b82f6',
};

export default function Report() {
  const [mesi, setMesi] = useState(6);

  const { data: stats } = useQuery({
    queryKey: ['statistiche'],
    queryFn: reportService.getStatistiche,
  });

  const { data: mensile } = useQuery({
    queryKey: ['mensile', mesi],
    queryFn: () => reportService.getMensile(mesi),
  });

  const { data: trasportatori } = useQuery({
    queryKey: ['statsTrasportatori'],
    queryFn: reportService.getStatsTrasportatori,
  });

  const pieData = stats ? [
    { name: 'Consegnate', value: stats.consegnate, color: '#22c55e' },
    { name: 'In transito', value: stats.inTransito, color: '#eab308' },
    { name: 'Pianificate', value: stats.pianificate, color: '#3b82f6' },
    { name: 'Da pianificare', value: stats.daPianificare, color: '#94a3b8' },
    { name: 'Non consegnate', value: stats.nonConsegnate, color: '#ef4444' },
    { name: 'Annullate', value: stats.annullate, color: '#d1d5db' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Report & Statistiche</h1>
        <p className="text-sm text-gray-500 mt-0.5">Panoramica delle performance di consegna</p>
      </div>

      {/* KPI cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <KpiCard icon={Package} label="Totale consegne" value={stats.totaleConsegne} color="blue" />
          <KpiCard icon={TrendingUp} label="Tasso successo" value={
            stats.totaleConsegne > 0
              ? `${Math.round(stats.consegnate / stats.totaleConsegne * 100)}%`
              : '—'
          } color="green" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Grafico mensile */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Consegne mensili</h3>
            <select
              value={mesi}
              onChange={e => setMesi(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
            >
              <option value={3}>Ultimi 3 mesi</option>
              <option value={6}>Ultimi 6 mesi</option>
              <option value={12}>Ultimo anno</option>
            </select>
          </div>
          {mensile && mensile.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mensile} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="nomeMese"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(v: string) => v.split(' ')[0].slice(0, 3)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  labelStyle={{ fontWeight: '600' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="totale" name="Totale" fill="#dbeafe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consegnate" name="Consegnate" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonConsegnate" name="Non consegnate" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Nessun dato disponibile
            </div>
          )}
        </div>

        {/* Grafico a torta */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuzione stati</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Nessun dato</div>
          )}
        </div>
      </div>

      {/* Tabella trasportatori */}
      {trasportatori && trasportatori.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Performance trasportatori</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">Trasportatore</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">Totale</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">Consegnate</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">Non conseg.</th>
                  <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">% Successo</th>
                </tr>
              </thead>
              <tbody>
                {trasportatori.map((t) => (
                  <tr key={t.trasportatoreId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-800">{t.nome}</td>
                    <td className="py-3 px-3 text-right text-gray-600">{t.totale}</td>
                    <td className="py-3 px-3 text-right text-green-600 font-medium">{t.consegnate}</td>
                    <td className="py-3 px-3 text-right text-red-500">{t.nonConsegnate}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-semibold ${
                        t.percentualeSuccesso >= 90 ? 'text-green-600' :
                        t.percentualeSuccesso >= 70 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {t.percentualeSuccesso}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, color
}: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
