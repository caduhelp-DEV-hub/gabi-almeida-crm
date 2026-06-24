# Fix the broken className using regex
$encoding = [System.Text.UTF8Encoding]::new($false)
$content = [System.IO.File]::ReadAllText("app\page.tsx", $encoding)

# Use regex to find and replace all 3 broken classNames
# Pattern: className={px-4 py-2 text-[11px] font-bold transition-all }
# Followed by \n                  >\n                    <view>

# Fix Diaria button
$content = [regex]::Replace($content, 
    "className=\{px-4 py-2 text-\[11px\] font-bold transition-all \}(\s*>[\r\n]+\s*Di)",
    "className={``px-4 py-2 text-[11px] font-bold transition-all `${agendaView === 'diaria' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}``}`$1")

# Fix Semanal button
$content = [regex]::Replace($content, 
    "className=\{px-4 py-2 text-\[11px\] font-bold transition-all \}(\s*>[\r\n]+\s*Sem)",
    "className={``px-4 py-2 text-[11px] font-bold transition-all `${agendaView === 'semanal' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}``}`$1")

# Fix Mensal button
$content = [regex]::Replace($content, 
    "className=\{px-4 py-2 text-\[11px\] font-bold transition-all \}(\s*>[\r\n]+\s*Men)",
    "className={``px-4 py-2 text-[11px] font-bold transition-all `${agendaView === 'mensal' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}``}`$1")

# Check remaining broken patterns
$brokenCount = ([regex]::Matches($content, "className=\{px-4 py-2")).Count
Write-Host "Remaining broken classNames: $brokenCount"

# Verify the new patterns exist
$fixedDiaria = ([regex]::Matches($content, "agendaView === 'diaria'.*bg-primary")).Count
$fixedSemanal = ([regex]::Matches($content, "agendaView === 'semanal'.*bg-primary")).Count
$fixedMensal = ([regex]::Matches($content, "agendaView === 'mensal'.*bg-primary")).Count
Write-Host "Fixed diaria: $fixedDiaria, semanal: $fixedSemanal, mensal: $fixedMensal"

[System.IO.File]::WriteAllText("app\page.tsx", $content, $encoding)
Write-Host "Saved!"
