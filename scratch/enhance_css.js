const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');

// Update globals.css for a more premium look
css = css.replace('--color-surface-container-lowest: #ffffff;', '--color-surface-container-lowest: #fcfbfa;'); // slightly softer white
css = css.replace('--color-surface-container: #f1edea;', '--color-surface-container: #f4efea;'); // warmer, cleaner gray
css = css.replace('--color-primary: #7b2fbe;', '--color-primary: #6d22a8;'); // richer purple

// Add some premium utility classes
const newClasses = `
.card-premium {
  background: linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(252,251,250,0.9) 100%);
  border: 1px solid rgba(130, 117, 106, 0.1);
  box-shadow: 0 4px 20px rgba(109, 34, 168, 0.03), 0 1px 3px rgba(0,0,0,0.02);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}
.card-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(109, 34, 168, 0.06), 0 2px 5px rgba(0,0,0,0.03);
  border-color: rgba(109, 34, 168, 0.2);
}
.btn-premium {
  background: linear-gradient(135deg, var(--color-primary) 0%, #8a36d6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(109, 34, 168, 0.2);
  transition: all 0.2s ease;
}
.btn-premium:hover {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 6px 16px rgba(109, 34, 168, 0.3);
}
`;

if (!css.includes('.card-premium')) {
  css += newClasses;
}

fs.writeFileSync('app/globals.css', css);
console.log('CSS Premium Refined');
