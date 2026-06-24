const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');

const replacements = {
  '\\.pronoun': '.pronome',
  '\\.lastVisit': '.ultimaVisita',
  '\\.totalSpent': '.totalGasto',
  '\\.proceduresCount': '.qtdeProcedimentos',
  '\\.lastPhotoDate': '.dataUltimaFoto',
  '\\.allergies': '.alergias',
  '\\.medications': '.medicacoes',
  '\\.previousProcedures': '.procedimentosAnteriores',
  '\\.evolutionNotes': '.notasEvolucao',
  '\\.beforePhoto': '.fotoAntes',
  '\\.afterPhoto': '.fotoDepois',
  '\\.evolutionPhotos': '.fotosEvolucao',
  '\\.timeline': '.historico',
  '\\.detailsAvatar': '.fotoDetalhes'
};

for (const [key, val] of Object.entries(replacements)) {
  c = c.replace(new RegExp(key, 'g'), val);
}

fs.writeFileSync('app/page.tsx', c);
console.log('Final fixes applied.');
