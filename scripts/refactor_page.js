const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Imports
content = content.replace(
  /import type { AppUser, Patient, Appointment, Transaction, ServiceObj, InventoryItem } from '\.\.\/lib\/types';/,
  "import type { AppUser, Cliente as Patient, Agendamento as Appointment, Cobranca as Transaction, Servico as ServiceObj, InventoryItem } from '../lib/types';"
);
content = content.replace(
  /import type { AppUser, Patient, Appointment, ServiceObj, InventoryItem } from '\.\.\/lib\/types';/,
  "import type { AppUser, Cliente as Patient, Agendamento as Appointment, Servico as ServiceObj, InventoryItem, Cobranca as Transaction } from '../lib/types';"
);

// If imports are different, just globally replace the type names inside the import block from lib/types
content = content.replace(/Patient(?=[\s,}])/g, 'Cliente');
content = content.replace(/Appointment(?=[\s,}])/g, 'Agendamento');
content = content.replace(/Transaction(?=[\s,}])/g, 'Cobranca');
content = content.replace(/ServiceObj(?=[\s,}])/g, 'Servico');

// 2. Mappers
content = content.replace(/mapPatientToFrontend/g, 'mapClienteToFrontend');
content = content.replace(/mapPatientToBackend/g, 'mapClienteToBackend');
content = content.replace(/mapAppointmentToFrontend/g, 'mapAgendamentoToFrontend');
content = content.replace(/mapAppointmentToBackend/g, 'mapAgendamentoToBackend');
content = content.replace(/mapTransactionToFrontend/g, 'mapCobrancaToFrontend');
content = content.replace(/mapTransactionToBackend/g, 'mapCobrancaToBackend');

// 3. Supabase tables
content = content.replace(/\.from\('patients'\)/g, ".from('clientes')");
content = content.replace(/\.from\('appointments'\)/g, ".from('agendamentos')");
content = content.replace(/\.from\('services'\)/g, ".from('servicos')");
content = content.replace(/\.from\('transactions'\)/g, ".from('cobrancas')");
content = content.replace(/table: 'patients'/g, "table: 'clientes'");
content = content.replace(/table: 'appointments'/g, "table: 'agendamentos'");
content = content.replace(/table: 'services'/g, "table: 'servicos'");
content = content.replace(/table: 'transactions'/g, "table: 'cobrancas'");

// Revert the Patient, Appointment, Transaction variable types back if they were changed inappropriately outside of lib/types context
// Actually, since I renamed the interface in lib/types, it's correct to use Cliente instead of Patient in the generic type parameters.
// E.g. useState<Cliente[]>([]), so global replace is mostly fine for Types.
// BUT we have variables like `patients`, `appointments`. Let's leave them as they are in English to minimize breaking changes in the React component logic. They will just hold `Cliente[]` and `Agendamento[]`.

// However, let's fix any occurrences where the DB fields were hardcoded in the frontend.
// `patient_id` -> `cliente_id`
// `patient_name` -> `cliente_nome`
// `patient_avatar` -> `cliente_avatar`
content = content.replace(/patient_id/g, 'cliente_id');
content = content.replace(/patient_name/g, 'cliente_nome');
content = content.replace(/patient_avatar/g, 'cliente_avatar');

fs.writeFileSync('app/page.tsx', content, 'utf8');
console.log('page.tsx refactored');
