# HealFish

<p align="center">
  <img src="images/ryba%20hybba.png" alt="Hybba – maskotka HealFish" width="200"/>
</p>

Edukacyjno-profilaktyczna platforma zdrowotna zbudowana podczas **HTV Hackathon** (HerTechVentures Hackathon, 30–31 maja 2026, Uniwersytet Gdański). Pomaga użytkownikom odnajdywać wiarygodne artykuły medyczne, rozwiązywać quizy i zamieniać zdobyte punkty na zniżki na wizyty profilaktyczne.

## Problem

Ludzie po 30. roku życia często bagatelizują codzienne objawy i nie mają wyrobionego nawyku profilaktyki. Brakuje im ujednoliconego, wiarygodnego źródła informacji zdrowotnych, a strach lub wstyd powstrzymują ich przed wizytą u lekarza.

## Rozwiązanie

<img src="images/ujecia-ryby-hybby/ujecie2.png" alt="Hybba" width="130" align="right"/>

HealFish łączy trzy mechanizmy:

1. **Artykuły** pisane przez lekarzy — zweryfikowana wiedza medyczna.
2. **Quizy** oparte na artykułach — motywują do czytania i nagradzają punktami.
3. **System zniżek** — punkty można wymienić na rabaty na wizyty profilaktyczne u lekarzy z bazy.

Dodatkowo moduł **Self-Check** (RAG + LLM) dobiera artykuły do aktualnych potrzeb użytkownika na podstawie krótkiego kwestionariusza, a sekcja **Dla kobiet** grupuje treści i ciekawostki adresowane specjalnie do kobiet.

---

## Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python), JWT auth (`python-jose` + `passlib`) |
| Baza danych | PostgreSQL 16 z rozszerzeniem pgvector |
| RAG / embeddingi | `sentence-transformers` (`all-MiniLM-L6-v2`), pgvector |
| LLM | OpenRouter API (model `gpt-4o-mini`) |
| Infrastruktura | Docker + Docker Compose |

---

## Architektura

```
hackaton_htv/
├── backend/            # FastAPI — auth, CRUD, Self-Check (RAG)
│   ├── main.py
│   ├── rag.py
│   ├── self_check_questions.py
│   ├── entrypoint.sh
│   └── Dockerfile
├── healfish/           # Next.js frontend
│   ├── app/
│   │   ├── artykuly/       # lista i podstrony artykułów
│   │   ├── quizy/          # lista i rozwiązywanie quizów
│   │   ├── self-check/     # kwestionariusz + wyniki RAG
│   │   ├── dla-kobiet/     # sekcja dla kobiet
│   │   ├── lekarze/        # katalog specjalistów
│   │   ├── wizyty/         # rezerwacja wizyt
│   │   ├── znizki/         # wymiana punktów na zniżki
│   │   ├── profil/         # profil użytkownika
│   │   ├── panel-lekarza/  # panel dla lekarzy
│   │   ├── logowanie/
│   │   └── rejestracja/
│   └── Dockerfile
├── data/
│   ├── articles/       # treści artykułów (txt)
│   ├── quizes/         # pytania quizów (txt)
│   └── sources/        # źródła artykułów
├── scripts/
│   ├── build_knowledge_base.py   # indeksuje artykuły do pgvector
│   └── run_indexing.sh
└── docker-compose.yml
```

---

## Uruchomienie

### Wymagania

- Docker i Docker Compose
- Klucz API do [OpenRouter](https://openrouter.ai)

### 1. Skonfiguruj zmienne środowiskowe

```bash
cp .env.example .env
# uzupełnij .env:
# OPEN_ROUTER_API_KEY=sk-...
# SECRET_KEY=twoj_tajny_klucz
```

### 2. Uruchom kontenery

```bash
docker compose up --build
```

Serwisy:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 3. Zaindeksuj bazę wiedzy (RAG)

Po uruchomieniu kontenerów zbuduj bazę wektorową artykułów:

```bash
bash scripts/run_indexing.sh
```

Skrypt uruchamia `build_knowledge_base.py` wewnątrz kontenera backendu — dzieli artykuły na chunki i zapisuje embeddingi do pgvector.

---

## Główne funkcjonalności

### Artykuły
Lekarze publikują artykuły zdrowotne po zalogowaniu się na konto lekarza. Artykuł jest przypisany do specjalizacji i może być oznaczony flagą „dla kobiet".

### Quizy
- od 3 do 5 pytań ABCD na podstawie konkretnego artykułu
- Próg zdawalności: 2/3 pytań (≈ 67%)
- Maks. 3 próby dziennie na quiz
- Po zaliczeniu: +100 punktów na konto (jednorazowo)

### Self-Check (RAG)
Użytkownik wypełnia krótki kwestionariusz dotyczący samopoczucia. System:
1. Wektoryzuje odpowiedzi modelem `all-MiniLM-L6-v2`
2. Wyszukuje najbliższe fragmenty artykułów w pgvector
3. Wysyła kontekst do LLM (OpenRouter), który generuje ciepłe, niemedyczne podsumowanie
4. Zwraca dopasowane artykuły i listę specjalistów z Gdańska/Gdyni

### System punktów i zniżek
- Punkty zdobywane za zaliczone quizy
- Wymiana punktów na rabaty procentowe na wizyty profilaktyczne
- Progi: 500–1000 pkt → 10–20% zniżki (zależnie od specjalizacji)

### Rezerwacja wizyt
- Lekarze ustawiają dostępność (dni tygodnia + godziny)
- Pacjenci rezerwują 20-minutowe sloty
- Możliwość przełożenia i anulowania wizyty

### Sekcja dla kobiet
Wyfiltrowane artykuły i quizy oznaczone flagą `for_women` oraz karuzela ciekawostek zdrowotnych adresowanych do kobiet.

---

## API — wybrane endpointy

| Metoda | Endpoint | Opis |
|---|---|---|
| `POST` | `/auth/register` | rejestracja pacjenta |
| `POST` | `/auth/register/doctor` | rejestracja lekarza |
| `POST` | `/auth/login` | logowanie (JWT) |
| `GET` | `/articles` | lista artykułów (filtrowanie po specjalizacji, for_women) |
| `GET` | `/articles/{slug}` | szczegóły artykułu |
| `POST` | `/articles` | dodaj artykuł (tylko lekarz) |
| `GET` | `/quizzes` | lista quizów |
| `POST` | `/quiz/{slug}/attempt` | prześlij odpowiedzi quizu |
| `POST` | `/self-check` | kwestionariusz RAG |
| `GET` | `/specialists` | lista specjalistów |
| `GET` | `/doctors/{id}/slots` | wolne sloty lekarza w danym dniu |
| `POST` | `/appointments` | zarezerwuj wizytę |
| `GET` | `/discounts` | lista zniżek |
| `POST` | `/discounts/{id}/redeem` | wymień punkty na zniżkę |

Pełna dokumentacja interaktywna: http://localhost:8000/docs

---

## Role użytkowników

**Pacjent**
- czyta artykuły, rozwiązuje quizy, zbiera punkty
- wypełnia Self-Check, przegląda lekarzy, rezerwuje wizyty
- wymienia punkty na zniżki

**Lekarz**
- publikuje i usuwa artykuły
- ustawia harmonogram dostępności
- zarządza wizytami w panelu lekarza

---

## Dane testowe

Projekt zawiera preładowane artykuły w `data/articles/` (ortopedia, fizjoterapia, kardiologia, ginekologia) oraz gotowe quizy w `data/quizes/`. Po uruchomieniu skryptu indeksowania są one dostępne przez Self-Check.

---

<p align="center">
  <img src="images/rybbs.png" alt="Hybba" width="100"/>
  <br/>
  <em>Dbaj o siebie z Hybbą!</em>
</p>
