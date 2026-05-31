Poniżej lista zmian do wprowadzenia w aplikacji HealFish:

## 1. Sekcja Lekarze

Dodaj stronę `/lekarze` z listą wszystkich lekarzy. Strona powinna zawierać:
- Siatka/lista kart lekarzy (imię, nazwisko, specjalizacja, zdjęcie)
- Filtrowanie po specjalizacji
- Sortowanie (np. po nazwisku, specjalizacji)

## 2. Sekcja Zniżki (kupony za rybki)

Dodaj stronę `/znizki` dostępną tylko dla zalogowanych pacjentów. Zasady:
- Lista kafelków z dostępnymi zniżkami na konsultacje lekarskie
- Zniżki dotyczą wyłącznie konsultacji z lekarzami specjalizacji z bazy danych
- Trzy progi cenowe: 500, 700 i 1000 rybbsów (w zależności od specjalizacji)
- Po zakupie/aktywacji zniżki wyświetl kod QR aktywny przez 20 minut (analogicznie do McDonald's)

## 3. Ograniczenia konta lekarza

Konta lekarzy NIE powinny mieć dostępu do:
- Rybbsów
- Sekcji Quizów
- Sekcji Self-check
- Widocznych umówionych wizyt (panel wizyt pacjenta)

Konta lekarzy powinny mieć dostęp wyłącznie do:
- Profil
- Panel wizyt (własnych przyjęć, nie pacjenta)
- Sekcja "Dla kobiet"
- Artykuły

## 4. Rejestracja lekarza

W formularzu rejestracji lekarza:
- Dodaj pole na numer PWZ (Prawo Wykonywania Zawodu) — obowiązkowe
- Pole "specjalizacja" zmień z wolnego pola tekstowego na dropdown z listą specjalizacji istniejących w bazie danych

## 5. Sekcja "Dla kobiet"

W sekcji "Dla kobiet" wszystkie elementy muszą być filtrowane pod kątem płci/tematyki kobiecej:
- Listy lekarzy i karuzela lekarzy — wyświetlaj tylko lekarki (kobiety)
- Artykuły — wyświetlaj tylko artykuły, których autorkami są kobiety
- Quizy — wyświetlaj tylko quizy z tematyką kobiecą

## 6. Usuwanie artykułów przez lekarza

Lekarze powinni mieć możliwość usunięcia swoich własnych artykułów (np. przycisk "Usuń" widoczny tylko dla autora artykułu).

## 7. Poprawka nawigacji po quizie (redirect po logowaniu)

Gdy niezalogowany użytkownik chce rozwiązać quiz i zostaje przekierowany do ekranu logowania/rejestracji, po pomyślnym wypełnieniu formularza rejestracji lub logowania aplikacja powinna wrócić do poprzedniego widoku (quiz), a nie na stronę główną. Użyj parametru `redirect` lub `callbackUrl` w URL.

## 8. Animacja rybbsów

Po udanym quizie dodaj jakąś animację przy rybbsach aby to było widoczne, że wpadły na twoje konto.