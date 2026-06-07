const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Replace all #79542e with #7B2FBE globally
content = content.replace(/#79542e/gi, '#7B2FBE');

// 2. Remove the 'Lista' button from the mobile header toggle
content = content.replace(
  /<button\s+onClick={\(\) => setAgendaView\('lista'\)}[\s\S]*?<\/button>\s*/g,
  ''
);

// 3. Update Card Colors to use the new pink and blue classes
content = content.replace(
  /let cardColorClass = 'bg-emerald-50\/60 border-emerald-300 text-emerald-900';\s*if\s*\(appt\.professional\.toLowerCase\(\)\.includes\('ricardo'\)\)\s*{\s*cardColorClass = 'bg-blue-50\/60 border-blue-300 text-blue-900';\s*}\s*else\s*if\s*\(appt\.professional\.toLowerCase\(\)\.includes\('helena'\)\)\s*{\s*cardColorClass = 'bg-pink-50\/60 border-pink-300 text-pink-900';\s*}/,
  `let cardColorClass = 'bg-surface-container border-outline-variant text-on-surface';
                        if (appt.professional.toLowerCase().includes('ricardo')) {
                          cardColorClass = 'bg-card-blue border-transparent';
                        } else if (appt.professional.toLowerCase().includes('helena')) {
                          cardColorClass = 'bg-card-pink border-transparent';
                        }`
);

// 4. Hide the inline "Novo agendamento" button and Date string
const dateHeaderBlock = `<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                      <p className="text-[14px] font-medium text-primary text-center sm:text-left">
                        {(() => {
                          const d = agendaNavDate;
                          const isToday = d.toDateString() === new Date().toDateString();
                          const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                          const day = d.getDate();
                          const month = d.toLocaleDateString('pt-BR', { month: 'long' });
                          const year = d.getFullYear();
                          return \`\${isToday ? 'Hoje, ' : ''}\${day} de \${month.charAt(0).toUpperCase() + month.slice(1)}, \${year}\`;
                        })()}
                      </p>
                      <button
                        onClick={() => {
                          setEditingAppointment(null);
                          setNewApptPatient(patients[0]?.name || '');
                          setNewApptProcedure(services[0]?.name || '');
                          setNewApptTime('09:00');
                          setNewApptDate(agendaNavDate.toISOString().split('T')[0]);
                          setIsNewAppointmentOpen(true);
                        }}
                        className="self-center sm:self-auto flex items-center gap-2 bg-primary text-white-pure px-4 py-2 rounded-xl font-bold text-[13px] hover:opacity-90 transition-opacity shadow-sm min-h-[36px]"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Novo agendamento
                      </button>
                    </div>`;

const newDateHeaderBlock = `<div className="flex flex-col gap-3 mb-4 mt-2">
                      <p className="text-[14px] font-bold text-on-surface-variant text-center">
                        {(() => {
                          const d = agendaNavDate;
                          const isToday = d.toDateString() === new Date().toDateString();
                          const day = d.getDate();
                          const month = d.toLocaleDateString('pt-BR', { month: 'long' });
                          const year = d.getFullYear();
                          return \`\${isToday ? 'Hoje, ' : ''}\${day} de \${month.charAt(0).toUpperCase() + month.slice(1)}, \${year}\`;
                        })()}
                      </p>
                    </div>`;

content = content.replace(dateHeaderBlock, newDateHeaderBlock);

// 5. Inject the FAB right before the Modals (search for "Modals Container")
const fabCode = `
      {/* Floating Action Button (FAB) */}
      {currentTab === 'agenda' && agendaView !== 'mensal' && (
        <button
          onClick={() => {
            setEditingAppointment(null);
            setNewApptPatient(patients[0]?.name || '');
            setNewApptProcedure(services[0]?.name || '');
            setNewApptTime('09:00');
            setNewApptDate(agendaNavDate.toISOString().split('T')[0]);
            setIsNewAppointmentOpen(true);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white-pure rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-40 active:scale-95"
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      )}

      {/* Modals Container`;

content = content.replace('{/* Modals Container', fabCode);

// Optional: remove desktop layout (hidden lg:block w-60... Sidebar)
// We will just leave it there for now as it's hidden on mobile.

fs.writeFileSync('app/page.tsx', content, 'utf8');
console.log('Mobile agenda UI modifications applied successfully.');
