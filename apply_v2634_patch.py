from pathlib import Path
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.')
def repl(name, pairs):
 p=root/name
 if not p.exists():
  print('[MANCANTE]',name); return
 s=p.read_text(encoding='utf-8')
 for old,new in pairs:
  s=s.replace(old,new)
 p.write_text(s,encoding='utf-8'); print('[OK]',name)
repl('v2629-flow-report.js',[('FAC SIMILE TABELLINO','TABELLINO')])
repl('v2631-complete.js',[('FAC SIMILE TABELLINO','TABELLINO')])
repl('v2633-data-manager.js',[("appVersion:'26.3.3'","appVersion:'26.3.4-test'")])
print('Patch v26.3.4-test completata.')
