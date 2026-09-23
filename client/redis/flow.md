[ Cliente (Next.js) ]
       │
       ▼  POST /api/vote { candidateId: 1 }
[ Middleware / JWT Validado ]
       │
       ▼
[ Redis Check 1 ]: ¿Existe cooldown:usr_123? ──► SÍ ──► Error 429 ("Espera 60s")
       │
       NO
       ▼
[ Redis Check 2 ]: DECRBY user:usr_123:votes_left 1 ──► ¿Es < 0? ──► Error 400 ("Sin votos")
       │
       OK (Votos restantes >= 0)
       ▼
[ Redis Exec ]: SET cooldown:usr_123 "active" EX 60
       │
       ▼
[ Redis Exec ]: INCRBY candidate:1:votes 1  (Suma al conteo global en vivo)
       │
       ▼
[ SQS Producer ]: Enviar mensaje { userId, candidateId, timestamp } a la Cola SQS