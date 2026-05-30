export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  location: string;
  znanyLekarzUrl: string;
  imageUrl?: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  author: Doctor;
  date: string;
  modifiedDate?: string;
  field: "Endokrynologia" | "Stomatologia" | "Fizjoterapia";
  excerpt: string;
  content: string;
  studyUrl?: string;
  relatedQuizSlug?: string;
  forWomen?: boolean;
};

export type QuizQuestion = {
  question: string;
  answers: [string, string, string, string];
  correct: number;
};

export type Quiz = {
  id: string;
  slug: string;
  title: string;
  field: "Endokrynologia" | "Stomatologia" | "Fizjoterapia";
  date: string;
  relatedArticleSlug?: string;
  questions: QuizQuestion[];
  forWomen?: boolean;
};

export type Curiosity = {
  id: string;
  title: string;
  content: string;
};

export const doctors: Doctor[] = [
  {
    id: "1",
    name: "dr n. med. Anna Kowalska",
    specialization: "Endokrynologia",
    location: "Warszawa",
    znanyLekarzUrl: "https://www.znanylekarz.pl",
  },
  {
    id: "2",
    name: "lek. dent. Piotr Nowak",
    specialization: "Stomatologia",
    location: "Kraków",
    znanyLekarzUrl: "https://www.znanylekarz.pl",
  },
  {
    id: "3",
    name: "mgr Magdalena Wiśniewska",
    specialization: "Fizjoterapia",
    location: "Wrocław",
    znanyLekarzUrl: "https://www.znanylekarz.pl",
  },
  {
    id: "4",
    name: "dr hab. Tomasz Zieliński",
    specialization: "Endokrynologia",
    location: "Gdańsk",
    znanyLekarzUrl: "https://www.znanylekarz.pl",
  },
  {
    id: "5",
    name: "lek. Katarzyna Lewandowska",
    specialization: "Stomatologia",
    location: "Poznań",
    znanyLekarzUrl: "https://www.znanylekarz.pl",
  },
  {
    id: "6",
    name: "dr n. fiz. Marek Dąbrowski",
    specialization: "Fizjoterapia",
    location: "Łódź",
    znanyLekarzUrl: "https://www.znanylekarz.pl",
  },
];

export const articles: Article[] = [
  {
    id: "1",
    slug: "tarczyca-a-codzienne-samopoczucie",
    title: "Tarczyca a codzienne samopoczucie – co warto wiedzieć po 35.",
    author: doctors[0],
    date: "2025-03-15",
    modifiedDate: "2025-04-02",
    field: "Endokrynologia",
    excerpt:
      "Zaburzenia tarczycy dotykają co dziesiątą osobę po 35. roku życia. Dowiedz się, jakie objawy powinny skłonić Cię do wizyty u endokrynologa.",
    content: `## Czym jest tarczyca i dlaczego jest tak ważna?

Tarczyca to niewielki gruczoł w kształcie motyla, zlokalizowany u podstawy szyi. Produkuje hormony – tyroksynę (T4) i trijodotyroninę (T3) – które regulują niemal każdy proces metaboliczny w organizmie.

## Niedoczynność vs. nadczynność

**Niedoczynność tarczycy (hypothyroidism)** to stan, gdy gruczoł produkuje zbyt mało hormonów. Objawy obejmują chroniczne zmęczenie, przyrost masy ciała, uczucie zimna, depresję i problemy z koncentracją.

**Nadczynność tarczycy (hyperthyroidism)** jest odwrotna – gruczoł pracuje zbyt intensywnie. Efekty to nerwowość, utrata wagi, kołatanie serca i nadmierne pocenie.

## Kiedy wykonać badanie?

Badanie TSH (hormon tyreotropowy) jest podstawowym testem diagnostycznym. Zaleca się je wykonywać profilaktycznie co 3-5 lat po 35. roku życia, a co roku jeśli w rodzinie występowały choroby tarczycy.

## Wpływ diety na pracę tarczycy

Jod jest kluczowym składnikiem do syntezy hormonów tarczycy. Jego niedobór może prowadzić do wola. Dobre źródła jodu to ryby morskie, owoce morza i sól jodowana.`,
    studyUrl: "https://pubmed.ncbi.nlm.nih.gov",
    relatedQuizSlug: "quiz-tarczyca",
  },
  {
    id: "2",
    slug: "profilaktyka-stomatologiczna-dla-doroslych",
    title: "Profilaktyka stomatologiczna – dlaczego wizyta co 6 miesięcy ma sens",
    author: doctors[1],
    date: "2025-02-10",
    field: "Stomatologia",
    excerpt:
      "Wiele osób odkłada wizytę u stomatologa do momentu bólu. Tymczasem regularne kontrole mogą oszczędzić Ci kosztownego leczenia.",
    content: `## Stan jamy ustnej a zdrowie ogólne

Badania naukowe potwierdzają związek między zdrowiem jamy ustnej a chorobami układu krążenia, cukrzycą i chorobami układu oddechowego. Bakterie z jamy ustnej mogą przedostawać się do krwiobiegu.

## Co sprawdza stomatolog podczas wizyty kontrolnej?

- Stan szkliwa i obecność próchnicy
- Stan dziąseł (ocena pod kątem paradontozy)
- Zgryz i ustawienie zębów
- Obecność kamienia nazębnego

## Jak dbać o zęby między wizytami?

Szczotkowanie dwa razy dziennie przez minimum 2 minuty, nitkowanie raz dziennie oraz stosowanie płukanki z fluorem to absolutna podstawa. Warto też ograniczyć słodkie napoje i kwasowe pokarmy.`,
    studyUrl: "https://pubmed.ncbi.nlm.nih.gov",
    relatedQuizSlug: "quiz-stomatologia",
  },
  {
    id: "3",
    slug: "bol-kregoslupa-fizjoterapia",
    title: "Ból kręgosłupa u osób pracujących siedząco – co możesz zrobić sam?",
    author: doctors[2],
    date: "2025-01-20",
    field: "Fizjoterapia",
    excerpt:
      "8 na 10 Polaków doświadczy bólu kręgosłupa w ciągu życia. Fizjoterapeutka wyjaśnia, które ćwiczenia naprawdę pomagają.",
    content: `## Dlaczego kręgosłup boli?

Siedzący tryb życia prowadzi do osłabienia mięśni głębokich stabilizujących kręgosłup. Długotrwałe siedzenie w złej pozycji przeciąża krążki międzykręgowe i więzadła.

## Podstawowe ćwiczenia profilaktyczne

**Aktywacja mięśni core:**
- Ćwiczenie "deski" (plank) – 3 serie po 30 sekund
- Mostek biodrowy – 3 serie po 15 powtórzeń

**Rozciąganie:**
- Pozycja dziecka (child's pose) – 60 sekund
- Rozciąganie mięśni biodrowo-lędźwiowych

## Ergonomia miejsca pracy

Krzesło powinno być ustawione tak, by kolana były na poziomie 90 stopni, a stopy płasko spoczywały na podłodze. Monitor na poziomie oczu.`,
    studyUrl: "https://pubmed.ncbi.nlm.nih.gov",
    relatedQuizSlug: "quiz-fizjoterapia",
  },
  {
    id: "4",
    slug: "hormony-kobiety-po-35",
    title: "Hormony po 35. – zmiany, które warto rozumieć",
    author: doctors[0],
    date: "2025-04-05",
    field: "Endokrynologia",
    excerpt:
      "Perimenopauza może zaczynać się nawet dekadę przed menopauzą. Jakie zmiany hormonalne czekają kobiety po 35. i jak się do nich przygotować?",
    content: `## Oś HPG – jak działa gospodarka hormonalna kobiety?

Oś podwzgórze-przysadka-gonady (HPG) reguluje cykl miesiączkowy poprzez serię precyzyjnych sygnałów hormonalnych. Po 35. roku życia rezerwa jajnikowa zaczyna się zmniejszać.

## Objawy zaburzeń hormonalnych

Nieregularne miesiączki, wahania nastroju, problemy ze snem i uderzenia gorąca mogą wskazywać na zmiany hormonalne wymagające konsultacji lekarskiej.

## Badania profilaktyczne dla kobiet po 35.

- AMH (hormon antymüllerowski) – ocena rezerwy jajnikowej
- FSH i LH w 3. dniu cyklu
- Estradiol
- Prolaktyna`,
    studyUrl: "https://pubmed.ncbi.nlm.nih.gov",
    relatedQuizSlug: "quiz-tarczyca",
    forWomen: true,
  },
  {
    id: "5",
    slug: "zeby-a-ciaza",
    title: "Zdrowie jamy ustnej w ciąży – o czym ginekolog nie zawsze powie",
    author: doctors[4],
    date: "2025-03-28",
    field: "Stomatologia",
    excerpt:
      "Ciąża dramatycznie zmienia stan jamy ustnej. Zapalenie dziąseł ciążowych dotyka nawet 70% kobiet w ciąży.",
    content: `## Ciążowe zapalenie dziąseł

Wzrost poziomu progesteronu i estrogenów w ciąży powoduje nadwrażliwość dziąseł na płytkę bakteryjną. Dziąsła mogą krwawić nawet przy delikatnym szczotkowaniu.

## Czy leczenie stomatologiczne w ciąży jest bezpieczne?

Tak – leczenie zachowawcze (wypełnienia, leczenie kanałowe) jest bezpieczne szczególnie w II trymestrze. Odkładanie leczenia może być groźniejsze niż sama procedura.

## Zalecenia

Wizyta u stomatologa powinna być standardem w pierwszym trymestrze ciąży. Higiena jamy ustnej nabiera w tym czasie jeszcze większego znaczenia.`,
    studyUrl: "https://pubmed.ncbi.nlm.nih.gov",
    relatedQuizSlug: "quiz-stomatologia",
    forWomen: true,
  },
  {
    id: "6",
    slug: "fizjoterapia-dna-miednicy",
    title: "Fizjoterapia dna miednicy – temat, o którym nie mówimy dość głośno",
    author: doctors[2],
    date: "2025-05-01",
    field: "Fizjoterapia",
    excerpt:
      "Co trzecia kobieta po porodzie zmaga się z problemami z kontrolą pęcherza. Fizjoterapia uroginekologiczna może skutecznie pomóc.",
    content: `## Czym jest dno miednicy?

Dno miednicy to grupa mięśni i więzadeł tworzących "hamak" podtrzymujący pęcherz, macicę i odbytnicę. Osłabienie tych mięśni prowadzi do problemów z inkontynencją, obniżenia narządów i bólu.

## Kiedy zgłosić się do fizjoterapeuty uroginekologicznego?

- Po każdym porodzie (profilaktycznie)
- Przy objawach wysiłkowego nieotrzymania moczu
- Przy bólu podczas stosunku
- Przy uczuciu parcia lub ciężkości w podbrzuszu

## Ćwiczenia Kegla – jak je wykonywać poprawnie?

Zaciskanie i rozluźnianie mięśni dna miednicy przez 10 sekund, 3 serie po 10 powtórzeń. Ważne: nie wstrzymywać oddechu, nie angażować pośladków ani ud.`,
    studyUrl: "https://pubmed.ncbi.nlm.nih.gov",
    forWomen: true,
  },
  {
    id: "7",
    slug: "insulinoopornosc-objawy",
    title: "Insulinooporność – cicha epidemia wśród trzydziestolatków",
    author: doctors[3],
    date: "2025-04-20",
    field: "Endokrynologia",
    excerpt:
      "Insulinooporność to stan poprzedzający cukrzycę typu 2, który przez lata może nie dawać wyraźnych objawów. Jakie sygnały warto obserwować?",
    content: `## Czym jest insulinooporność?

Insulinooporność to obniżona wrażliwość komórek na insulinę. Trzustka produkuje coraz więcej insuliny, by utrzymać prawidłowy poziom glukozy, co z czasem prowadzi do jej wyczerpania.

## Objawy, które możesz ignorować

- Przewlekłe zmęczenie, szczególnie po posiłkach
- Trudności z utratą wagi mimo diety
- Ciągła ochota na słodycze
- Acanthosis nigricans (ciemniejsza skóra w fałdach ciała)

## Diagnostyka

Krzywa glukozowo-insulinowa (test OGTT z oznaczeniem insuliny) jest złotym standardem diagnozy. Wskaźnik HOMA-IR powyżej 2,5 sugeruje insulinooporność.`,
    studyUrl: "https://pubmed.ncbi.nlm.nih.gov",
    relatedQuizSlug: "quiz-tarczyca",
  },
  {
    id: "8",
    slug: "terapia-manualna-kark",
    title: "Bóle karku i głowy – kiedy pomaga terapia manualna?",
    author: doctors[5],
    date: "2025-05-10",
    field: "Fizjoterapia",
    excerpt:
      "Bóle głowy wywołane napięciem mięśni szyi to problem powszechny wśród pracowników biurowych. Dowiedz się, kiedy terapia manualna jest wskazana.",
    content: `## Napięciowe bóle głowy a kręgosłup szyjny

Przeciążenie mięśni szyi i stawów kręgosłupa szyjnego może powodować bóle głowy promieniujące od karku do skroni. Są one często mylone z migreną.

## Terapia manualna – na czym polega?

Fizjoterapeuta stosuje techniki mobilizacji stawów i tkanek miękkich, by przywrócić prawidłowe zakresy ruchu i zmniejszyć napięcie mięśniowe. Sesja trwa zazwyczaj 45-60 minut.

## Kiedy NIE stosować terapii manualnej?

Przeciwwskazaniami są: osteoporoza zaawansowana, stan po urazie kręgosłupa, choroba nowotworowa i niestabilność kręgosłupa. Zawsze wymagana jest wcześniejsza konsultacja lekarska.`,
    studyUrl: "https://pubmed.ncbi.nlm.nih.gov",
    relatedQuizSlug: "quiz-fizjoterapia",
  },
];

export const quizzes: Quiz[] = [
  {
    id: "1",
    slug: "quiz-tarczyca",
    title: "Czy wiesz, jak działa Twoja tarczyca?",
    field: "Endokrynologia",
    date: "2025-03-20",
    relatedArticleSlug: "tarczyca-a-codzienne-samopoczucie",
    questions: [
      {
        question: "Który hormon produkuje tarczyca?",
        answers: ["Insulina", "Tyroksyna (T4)", "Kortyzol", "Adrenalina"],
        correct: 1,
      },
      {
        question: "Jakie badanie jest podstawowym testem czynności tarczycy?",
        answers: ["Morfologia", "CRP", "TSH", "OB"],
        correct: 2,
      },
      {
        question: "Który składnik mineralny jest niezbędny do produkcji hormonów tarczycy?",
        answers: ["Żelazo", "Wapń", "Magnez", "Jod"],
        correct: 3,
      },
      {
        question: "Niedoczynność tarczycy może powodować:",
        answers: [
          "Utratę wagi i nadpobudliwość",
          "Przyrost wagi i zmęczenie",
          "Tachykardię i potliwość",
          "Drżenie rąk i bezsenność",
        ],
        correct: 1,
      },
      {
        question: "Co ile lat zaleca się profilaktyczne badanie TSH po 35. roku życia?",
        answers: ["Co rok", "Co 2 lata", "Co 3-5 lat", "Co 10 lat"],
        correct: 2,
      },
    ],
  },
  {
    id: "2",
    slug: "quiz-stomatologia",
    title: "Jak dbasz o zęby? Sprawdź swoją wiedzę",
    field: "Stomatologia",
    date: "2025-02-15",
    relatedArticleSlug: "profilaktyka-stomatologiczna-dla-doroslych",
    questions: [
      {
        question: "Jak często należy odwiedzać stomatologa profilaktycznie?",
        answers: ["Co rok", "Co 6 miesięcy", "Co 2 lata", "Tylko gdy boli"],
        correct: 1,
      },
      {
        question: "Ile minut powinno trwać szczotkowanie zębów?",
        answers: ["30 sekund", "1 minuta", "2 minuty", "5 minut"],
        correct: 2,
      },
      {
        question: "Która choroba jamy ustnej jest powiązana z chorobami serca?",
        answers: ["Próchnica", "Paradontoza", "Afty", "Kandydoza"],
        correct: 1,
      },
      {
        question: "W którym trymestrze ciąży leczenie stomatologiczne jest najбезpieczniejsze?",
        answers: ["I trymestr", "II trymestr", "III trymestr", "Po porodzie"],
        correct: 1,
      },
    ],
  },
  {
    id: "3",
    slug: "quiz-fizjoterapia",
    title: "Kręgosłup i ruch – co wiesz o swoim ciele?",
    field: "Fizjoterapia",
    date: "2025-01-25",
    relatedArticleSlug: "bol-kregoslupa-fizjoterapia",
    questions: [
      {
        question: "Które ćwiczenie najlepiej wzmacnia mięśnie core?",
        answers: ["Przysiady", "Plank (deska)", "Pompki", "Bieganie"],
        correct: 1,
      },
      {
        question: "Na jakim poziomie powinien być monitor komputerowy?",
        answers: ["Poniżej oczu", "Na poziomie oczu", "Powyżej oczu", "Nie ma znaczenia"],
        correct: 1,
      },
      {
        question: "Jak długo powinna trwać sesja fizjoterapii manualnej?",
        answers: ["15-20 minut", "45-60 minut", "2 godziny", "10 minut"],
        correct: 1,
      },
      {
        question: "Ćwiczenia Kegla wzmacniają:",
        answers: [
          "Mięśnie brzucha",
          "Mięśnie dna miednicy",
          "Mięśnie pleców",
          "Mięśnie ud",
        ],
        correct: 1,
      },
    ],
  },
  {
    id: "4",
    slug: "quiz-hormony-kobiet",
    title: "Hormony kobiety – sprawdź, co wiesz",
    field: "Endokrynologia",
    date: "2025-04-10",
    relatedArticleSlug: "hormony-kobiety-po-35",
    forWomen: true,
    questions: [
      {
        question: "Co oznacza skrót AMH?",
        answers: [
          "Hormon antymüllerowski",
          "Hormon wzrostu",
          "Hormon luteinizujący",
          "Androgen metylowy",
        ],
        correct: 0,
      },
      {
        question: "Kiedy może rozpocząć się perimenopauza?",
        answers: ["Po 50. roku życia", "Po 45. roku życia", "Nawet po 35. roku życia", "Po 55. roku życia"],
        correct: 2,
      },
      {
        question: "Który hormon ocenia rezerwę jajnikową?",
        answers: ["TSH", "AMH", "Kortyzol", "Insulina"],
        correct: 1,
      },
    ],
  },
  {
    id: "5",
    slug: "quiz-insulinoopornosc",
    title: "Insulinooporność – czy to Ciebie dotyczy?",
    field: "Endokrynologia",
    date: "2025-04-25",
    relatedArticleSlug: "insulinoopornosc-objawy",
    questions: [
      {
        question: "Czym jest insulinooporność?",
        answers: [
          "Niedoborem insuliny",
          "Obniżoną wrażliwością komórek na insulinę",
          "Nadmiarem cukru w diecie",
          "Chorobą trzustki",
        ],
        correct: 1,
      },
      {
        question: "Jaki wskaźnik laboratoryjny ocenia insulinooporność?",
        answers: ["CRP", "OB", "HOMA-IR", "HbA1c"],
        correct: 2,
      },
      {
        question: "Który objaw może wskazywać na insulinooporność?",
        answers: [
          "Chudnięcie bez diety",
          "Ciągłe zmęczenie po posiłkach",
          "Nadmierna energia",
          "Brak apetytu",
        ],
        correct: 1,
      },
    ],
  },
];

export const curiosities: Curiosity[] = [
  {
    id: "1",
    title: "Serce kobiety bije szybciej",
    content:
      "Serce kobiety bije średnio 8-10 uderzeń na minutę szybciej niż serce mężczyzny. Kobiety mają też mniejsze serce proporcjonalnie do masy ciała.",
  },
  {
    id: "2",
    title: "Hormony a ból",
    content:
      "Kobiety odczuwają ból inaczej niż mężczyźni – estrogen wpływa na receptory bólowe, co może powodować większą wrażliwość na ból w określonych fazach cyklu.",
  },
  {
    id: "3",
    title: "Kości kobiet tracą gęstość szybciej",
    content:
      "W pierwszych 5-7 latach po menopauzie kobiety mogą stracić nawet 20% masy kostnej. Suplementacja witaminy D i wapnia jest kluczowa po 40. roku życia.",
  },
];
