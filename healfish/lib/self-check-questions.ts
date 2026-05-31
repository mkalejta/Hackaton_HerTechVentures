export type SelfCheckQuestion = {
  id: string;
  section: string;
  shortLabel: string;
  fullLabel: string;
  placeholder: string;
};

export const SELF_CHECK_SECTIONS = [
  "Aspekty fizyczne i energia",
  "Zdrowie psychiczne i emocjonalne",
  "Codzienne nawyki i profilaktyka",
] as const;

export const selfCheckQuestions: SelfCheckQuestion[] = [
  {
    id: "energy_level",
    section: "Aspekty fizyczne i energia",
    shortLabel: "Poziom energii",
    fullLabel:
      "Jak w skali od 1 do 10 oceniasz swój ogólny poziom energii w ciągu dnia i czy często odczuwasz nagłe spadki sił?",
    placeholder: "Np. 7/10 — rano dobrze, po południu duży spadek energii...",
  },
  {
    id: "sleep_quality",
    section: "Aspekty fizyczne i energia",
    shortLabel: "Jakość snu",
    fullLabel:
      "Czy budzisz się rano z poczuciem pełnego wypoczęcia, czy masz trudności z nocną regeneracją (np. problemy z zasypianiem, częste wybudzanie)?",
    placeholder: "Opisz swoją jakość snu...",
  },
  {
    id: "body_signals",
    section: "Aspekty fizyczne i energia",
    shortLabel: "Sygnały z ciała",
    fullLabel:
      "Czy w ostatnim czasie towarzyszy Ci jakikolwiek przewlekły dyskomfort fizyczny, nawracający ból lub napięcie mięśniowe?",
    placeholder: "Opisz ewentualne dolegliwości fizyczne...",
  },
  {
    id: "stress_level",
    section: "Zdrowie psychiczne i emocjonalne",
    shortLabel: "Poziom stresu",
    fullLabel:
      "Jak często w ciągu ostatnich dwóch tygodni odczuwałeś/aś przytłoczenie lub trudności z opanowaniem stresu w codziennych sytuacjach?",
    placeholder: "Opisz swój poziom stresu...",
  },
  {
    id: "mood",
    section: "Zdrowie psychiczne i emocjonalne",
    shortLabel: "Ogólny nastrój",
    fullLabel:
      "Jak ocenił(a)byś swój codzienny nastrój oraz zdolność do czerpania satysfakcji i radości z rutynowych aktywności?",
    placeholder: "Opisz swój ogólny nastrój...",
  },
  {
    id: "cognitive",
    section: "Zdrowie psychiczne i emocjonalne",
    shortLabel: "Funkcje poznawcze",
    fullLabel:
      "Czy zauważasz u siebie tzw. mgłę mózgową, odczuwalne spadki motywacji lub nawracające problemy ze skupieniem uwagi?",
    placeholder: "Opisz ewentualne trudności z koncentracją lub motywacją...",
  },
  {
    id: "digestion",
    section: "Codzienne nawyki i profilaktyka",
    shortLabel: "Układ pokarmowy",
    fullLabel:
      "Czy po posiłkach regularnie odczuwasz dyskomfort (np. uczucie ciężkości, wzdęcia, spadki energii), czy Twoje trawienie przebiega bezproblemowo?",
    placeholder: "Opisz swoje trawienie...",
  },
  {
    id: "appetite",
    section: "Codzienne nawyki i profilaktyka",
    shortLabel: "Apetyt i odżywianie",
    fullLabel:
      "Czy zaobserwowałeś/aś u siebie ostatnio niepokojące lub nieplanowane zmiany w apetycie bądź wahania masy ciała?",
    placeholder: "Opisz zmiany w apetycie lub masie ciała...",
  },
  {
    id: "balance",
    section: "Codzienne nawyki i profilaktyka",
    shortLabel: "Równowaga i regeneracja",
    fullLabel:
      "Czy czujesz, że w Twoim obecnym harmonogramie jest zachowany zdrowy balans między wysiłkiem (zarówno fizycznym, jak i umysłowym) a czasem na świadomy odpoczynek?",
    placeholder: "Opisz swój balans między pracą a odpoczynkiem...",
  },
  {
    id: "long_term",
    section: "Codzienne nawyki i profilaktyka",
    shortLabel: "Perspektywa długoterminowa",
    fullLabel:
      "Biorąc pod uwagę wszystkie powyższe aspekty, czy masz poczucie, że Twój obecny styl życia aktywnie wspiera Twoje zdrowie na przyszłość?",
    placeholder: "Opisz swoje ogólne odczucia dotyczące stylu życia...",
  },
];

export const questionsBySection = SELF_CHECK_SECTIONS.map((section) => ({
  section,
  questions: selfCheckQuestions.filter((q) => q.section === section),
}));
