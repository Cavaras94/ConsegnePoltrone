import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import itLocale from '@fullcalendar/core/locales/it';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { lavoriService } from '../services/lavori.service';
import { squadreService } from '../services/squadre.service';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { X, MapPin, User, Tag, Calendar } from 'lucide-react';
import { StatoLavoroBadge, PrioritaBadge } from '../components/ui/LavoroBadges';
import type { StatoLavoro, PrioritaLavoro } from '../types';

const TIPO_LABELS: Record<string, string> = {
  Bagno: '🛁 Bagno', VascaInDoccia: '🚿 Vasca→Doccia', Clima: '❄️ Clima',
  Cucina: '🍳 Cucina', Pavimenti: '🪵 Pavimenti', Elettrico: '⚡ Elettrico',
  Idraulica: '🔧 Idraulica', Altro: '📋 Altro',
};

export default function Calendario() {
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(), end: new Date(),
  });
  const [filtroSquadra, setFiltroSquadra] = useState<number | undefined>();
  const [popupEvent, setPopupEvent] = useState<EventClickArg | null>(null);

  const { data: squadre } = useQuery({
    queryKey: ['squadre'],
    queryFn: () => squadreService.getSquadre(true),
    enabled: isAdmin || isManager,
  });

  const { data: eventi = [] } = useQuery({
    queryKey: ['calendario', dateRange, filtroSquadra],
    queryFn: () => lavoriService.getCalendario(
      format(dateRange.start, "yyyy-MM-dd'T'HH:mm:ss"),
      format(dateRange.end, "yyyy-MM-dd'T'HH:mm:ss"),
      filtroSquadra,
    ),
    enabled: dateRange.start < dateRange.end,
  });

  const handleDatesSet = (arg: DatesSetArg) => {
    setDateRange({ start: arg.start, end: arg.end });
  };

  const handleEventClick = (info: EventClickArg) => {
    setPopupEvent(info);
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario lavori</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {eventi.length} lavori nel periodo visualizzato
          </p>
        </div>

        {/* Filtro squadra */}
        {(isAdmin || isManager) && squadre && squadre.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFiltroSquadra(undefined)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !filtroSquadra
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tutte le squadre
            </button>
            {squadre.map(s => (
              <button
                key={s.id}
                onClick={() => setFiltroSquadra(filtroSquadra === s.id ? undefined : s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filtroSquadra === s.id ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: filtroSquadra === s.id ? s.colore : `${s.colore}20`,
                  color: filtroSquadra === s.id ? '#fff' : s.colore,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.colore }}
                />
                {s.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legenda stati */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
        {[
          { label: 'Pianificato', color: '#3b82f6' },
          { label: 'In corso', color: '#8b5cf6' },
          { label: 'Completato', color: '#22c55e' },
          { label: 'Sospeso', color: '#f59e0b' },
          { label: 'Annullato', color: '#6b7280' },
        ].map(s => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 [&_.fc-button]:!bg-blue-600 [&_.fc-button]:!border-blue-600 [&_.fc-button:hover]:!bg-blue-700 [&_.fc-button-active]:!bg-blue-800 [&_.fc-today-button]:!bg-gray-200 [&_.fc-today-button]:!border-gray-300 [&_.fc-today-button]:!text-gray-700">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={itLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek',
          }}
          buttonText={{
            today: 'Oggi',
            month: 'Mese',
            week: 'Settimana',
            list: 'Lista',
          }}
          events={eventi}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventDisplay="block"
          dayMaxEvents={4}
          height="auto"
          eventClassNames="cursor-pointer rounded-md text-xs font-medium px-1"
          dayCellClassNames="hover:bg-gray-50"
          moreLinkClassNames="text-blue-600 font-medium text-xs"
        />
      </div>

      {/* Popup dettaglio evento */}
      {popupEvent && (
        <EventPopup
          info={popupEvent}
          onClose={() => setPopupEvent(null)}
          onNavigate={(id) => {
            setPopupEvent(null);
            navigate(`/lavori/${id}`);
          }}
        />
      )}
    </div>
  );
}

function EventPopup({
  info, onClose, onNavigate
}: {
  info: EventClickArg;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const { event } = info;
  const props = event.extendedProps;

  // Posiziona il popup vicino al click
  const rect = info.el.getBoundingClientRect();
  const left = Math.min(rect.left, window.innerWidth - 320);
  const top = rect.bottom + 8;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-72 p-4"
        style={{ left: Math.max(8, left), top: Math.min(top, window.innerHeight - 300) }}
      >
        {/* Header colorato */}
        <div
          className="flex items-start justify-between -m-4 mb-3 px-4 py-3 rounded-t-xl"
          style={{ backgroundColor: event.backgroundColor }}
        >
          <p className="text-white font-semibold text-sm leading-tight pr-6">
            {event.title}
          </p>
          <button onClick={onClose} className="text-white/70 hover:text-white flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Tag size={13} className="text-gray-400" />
            <span>{TIPO_LABELS[props.tipo] ?? props.tipo}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={13} className="text-gray-400" />
            <span>{props.clienteCitta}</span>
          </div>
          {props.squadraNome && (
            <div className="flex items-center gap-2 text-gray-600">
              <User size={13} className="text-gray-400" />
              <span>{props.squadraNome}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={13} className="text-gray-400" />
            <span>
              {event.startStr}
              {event.endStr && event.endStr !== event.startStr ? ` → ${event.endStr}` : ''}
            </span>
          </div>

          <div className="flex gap-2 mt-1">
            <StatoLavoroBadge stato={props.stato as StatoLavoro} />
            <PrioritaBadge priorita={props.priorita as PrioritaLavoro} />
          </div>
        </div>

        <button
          onClick={() => onNavigate(event.id)}
          className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Apri dettaglio →
        </button>
      </div>
    </>
  );
}
