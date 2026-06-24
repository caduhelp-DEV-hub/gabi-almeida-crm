const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');

c = c.replace(/\.patientName/g, '.clienteNome');
c = c.replace(/\.patientId/g, '.clienteId');
c = c.replace(/\.patientAvatar/g, '.clienteAvatar');
c = c.replace(/\.professional/g, '.profissional');
c = c.replace(/\.procedure/g, '.procedimento');
c = c.replace(/\.time/g, '.hora');
// Only replace .date on appointments/transactions where it was missed
c = c.replace(/a\.date/g, 'a.data');
c = c.replace(/appt\.date/g, 'appt.data');

fs.writeFileSync('app/page.tsx', c);
console.log('Fixed properties in page.tsx');
