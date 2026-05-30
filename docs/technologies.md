# Stack technologiczny – Hackathon

## Serwisy Docker

### Frontend — **Next.js 14** (React + App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui – gotowe komponenty (karuzela, karty, formularze)
- **Dlaczego:** SSR przydatny przy artykułach (SEO), App Router upraszcza routing dla wielu podstron, szybki do postawienia

### Backend — **FastAPI** (Python)
- **Dlaczego:** Python = ten sam ekosystem co sentence-transformers i qdrant-client, minimalna konfiguracja, automatyczny Swagger UI do testowania endpointów podczas hackathonu

### Agent AI / RAG — **osobny serwis FastAPI** lub moduł backendu
- `sentence-transformers` – embeddingi (model `all-MiniLM-L6-v2`)
- `qdrant-client` – klient do Qdrant
- Anthropic API / OpenAI API – generowanie odpowiedzi
- LangChain (opcjonalnie) – do chunkingu i orkiestracji RAG pipeline
- **Dlaczego oddzielny serwis:** izolacja zależności ML (duże paczki), niezależny restart, łatwiejsze skalowanie

### Baza danych — **PostgreSQL** + **Qdrant**
- PostgreSQL – dane użytkowników, artykuły, quizy, punkty, autorzy
- Qdrant – baza wektorowa dla RAG (Self-Check)
- **Dlaczego Postgres:** relacyjne dane (użytkownicy ↔ quizy ↔ punkty) idealnie pasują do SQL; rozważcie `SQLAlchemy` jako ORM po stronie Pythona

---

## Dodatkowe narzędzia

| Narzędzie | Zastosowanie |
|---|---|
| `Alembic` | Migracje bazy danych (PostgreSQL) |
| `python-jose` + `passlib` | JWT auth w FastAPI |
| `axios` | HTTP client w Next.js |
| `zod` | Walidacja formularzy frontend |

---

## Struktura projektu

```
hackaton_htv/
├── docker-compose.yml
├── frontend/          # Next.js
│   └── Dockerfile
├── backend/           # FastAPI – logika biznesowa, auth, CRUD
│   └── Dockerfile
├── ai-agent/          # FastAPI – RAG, embeddingi, Qdrant
│   └── Dockerfile
└── scripts/           # skrypty do indeksowania bazy wiedzy
```

---

## Uwagi

- Na hackathon możesz połączyć `backend` i `ai-agent` w jeden serwis jeśli brakuje czasu
- Qdrant i PostgreSQL mają oficjalne obrazy Docker – zero konfiguracji
- Next.js z App Routerem pozwala szybko zrobić wiele podstron (artykuły, quizy, dla-kobiet) przez system plików
