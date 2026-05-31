Poniżej lista zmian do wprowadzenia w aplikacji HealFish:

## 1. Poprawka podkreślenia na stronie głównej

W pierwszym paragrafie na stronie głównej słowo "Chyba" nie powinno być podkreślone. Usuń podkreślenie/wyróżnienie tego słowa.

## 2. Poprawka nazwy aplikacji

Wszędzie w aplikacji nazwa powinna być pisana jako "Healfish", a nie "healFISH". Sprawdź wszystkie miejsca gdzie pojawia się nazwa i ujednolicaj zapis.

## 3. Tytuły naukowe specjalistów

W sekcji Specjaliści (karuzela i lista lekarzy) dodaj tytuły naukowe przy imionach i nazwiskach lekarzy (np. dr, dr hab., prof.). Upewnij się, że dane w bazie/mock data zawierają tytuły i są wyświetlane w UI.

## 4. Poprawka specjalizacji — Farmakologia

Farmakologia nie jest specjalizacją lekarską — usuń ją z listy dostępnych specjalizacji lekarskich w całej aplikacji (rejestracja, filtry, baza danych).

## 5. Ikonka rybki przy saldzie rybbsów

Przy wyświetlaniu liczby rybbsów (np. w navbarze, w sekcji zniżek) powinny być widoczne zarówno ikonka rybki, jak i napis z liczbą punktów — upewnij się, że oba elementy są zawsze renderowane razem.

## 6. Zniżki — jedna zniżka na konsultację dla każdej dziedziny

W sekcji `/znizki` utwórz zniżki na konsultacje. Dla każdej dziedziny medycznej dostępnej w aplikacji dodaj jedną zniżkę na konsultację. Zniżki powinny być widoczne jako kafelki z nazwą specjalizacji i opisem oferty.

## 7. Ciekawostki w formie karuzeli na widoku "Dla kobiet"

Sekcja z ciekawostkami na stronie "Dla kobiet" powinna być wyświetlana jako karuzela (nie lista statyczna). Użytkownik powinien móc przewijać ciekawostki poziomo.

## 8. Ukrycie sekcji logowania na stronie głównej dla zalogowanych

Gdy użytkownik jest zalogowany, sekcja logowania na stronie głównej nie powinna być widoczna. Ukryj ją warunkowo na podstawie stanu sesji/autoryzacji.
