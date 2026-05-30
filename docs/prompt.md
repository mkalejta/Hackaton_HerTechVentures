# Prompt – Frontend Next.js (Hackathon)

## Kontekst projektu

Tworzę frontend edukacyjno-informacyjnej strony o profilaktyce zdrowotnej skierowanej do milenialsów (35+). Strona nazywa się roboczo **"Healfish"**.

Użytkownicy: osoby, które bagatelizują zdrowie, boją się lekarzy, szukają wiarygodnych informacji. Partnerzy: Luxmed, Medicover. Lekarze piszą artykuły naukowe, użytkownicy rozwiązują quizy i zdobywają punkty na rabaty na badania profilaktyczne.

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **shadcn/ui**

---

## Podstrony do zbudowania (każda jako osobna strona w App Router)

### 1. Strona główna `/`
- Nawigacja: Logo + zakładki (Artykuły / Self check / Quizy / Dla kobiet) + przyciski Zaloguj/Zarejestruj
- Sekcja hero: ikony partnerów (Luxmed, Medicover), nagłówek zachęcający, krótki opis strony
- Karuzela specjalistów: poziomy pasek z kafelkami lekarzy (imię, nazwisko, specjalizacja, lokalizacja, link do Znany Lekarz)
- 4 kafelki informacyjne – opis każdej zakładki nawigacji
- CTA: Zaloguj/Zarejestruj + zapis do Newslettera (pole email)
- Stopka: Polityka prywatności / Kontakt

### 2. Strona Artykuły `/artykuly`
- Nagłówek + opis sekcji
- Pasek filtrowania i sortowania:
  - wyszukiwanie po nazwie
  - filtr po autorze (lista lekarzy)
  - filtr po dziedzinie (Endokrynologia, Stomatologia, Fizjoterapia)
  - sortowanie po dacie (rosnąco/malejąco)
- Lista artykułów (karty z tytułem, autorem, datą, dziedziną)

### 3. Podstrona artykułu `/artykuly/[slug]`
- Modal/sekcja tytułowa: tytuł, autor, data publikacji / modyfikacji, link do Znany Lekarz
- Treść artykułu (naukowa)
- Linki: do badania naukowego + do powiązanego quizu
- Sekcja promująca wizytę u autora artykułu

### 4. Strona Self-Check `/self-check`
- Nagłówek + opis (wyjaśnienie funkcjonalności RAG – "dopasowujemy artykuły do Twoich objawów")
- Lista predefiniowanych pytań z polami tekstowymi
- Przycisk "Znajdź" → po kliknięciu: lista dopasowanych artykułów (placeholder, właściwa logika to RAG po stronie backendu)

### 5. Strona Quizy `/quizy`
- Nagłówek + opis
- Pasek filtrowania i sortowania (jak w artykułach)
- Lista quizów (karty)

### 6. Podstrona quizu `/quizy/[slug]`
- Dostęp po zalogowaniu (guard)
- Tytuł quizu
- Kafelek z pytaniem ABCD + nawigacja poprzednie/następne pytanie
- Karuzela specjalistów na dole

### 7. Strona Dla kobiet `/dla-kobiet`
- Sekcja ciekawostek: kafelki 3 w rzędzie z możliwością przewijania (carousel/swipe)
- Sekcja artykułów z paskiem filtrowania
- Sekcja quizów z paskiem filtrowania
- Karuzela specjalistów

### 8. Logowanie `/logowanie`
- Formularz: email + hasło
- Link do rejestracji

### 9. Rejestracja `/rejestracja`
- Formularz: imię, nazwisko, email, hasło
- Checkbox: zapis do Newslettera
- Link do logowania

---

## Komponenty wielokrotnego użytku

### Karuzela specjalistów
- Poziomy, przewijalny pasek
- Kafelek: imię/nazwisko, specjalizacja, lokalizacja, link do Znany Lekarz

### Pasek filtrowania i sortowania
- Wyszukiwarka tekstowa
- Dropdown: autorzy artykułów
- Dropdown: dziedzina (Endokrynologia, Stomatologia, Fizjoterapia)
- Toggle sortowania po dacie

---

## Dane mockowe (używaj placeholderów)

Użyj realistycznych danych zastępczych:
- 5–8 artykułów z tytułami, autorami, datami
- 3–5 quizów powiązanych z artykułami
- 4–6 lekarzy w karuzeli
- 3 ciekawostki w sekcji "Dla kobiet"

---

## Wymagania techniczne

- Wszystkie komponenty w TypeScript
- Responsive design (mobile-first)
- Każda podstrona jako osobny plik w `app/` (App Router)
- Komponenty wielokrotnego użytku w `components/`
- Dane mockowe w `lib/mock-data.ts`
- Brak połączenia z backendem na tym etapie – wszystko na mockach
- Placeholder dla logiki RAG w Self-Check (formularz działa, wyniki są mockowane)
- Quiz guard: jeśli nie zalogowany → redirect do `/logowanie`

---

## Uwagi

- Priorytet: strona główna, artykuły, self-check, quizy
- Dla kobiet i podstrona artykułu w drugiej kolejności
- Strona powinna wyglądać profesjonalnie i wzbudzać zaufanie (kontekst medyczny)
- w katalogu /images masz szatę grafinczą oraz zdjęcia/logo
