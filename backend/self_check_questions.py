SELF_CHECK_QUESTIONS = [
    {
        "id": "energy_level",
        "section": "Aspekty fizyczne i energia",
        "label": "Poziom energii: Jak w skali od 1 do 10 oceniasz swój ogólny poziom energii w ciągu dnia i czy często odczuwasz nagłe spadki sił?",
    },
    {
        "id": "sleep_quality",
        "section": "Aspekty fizyczne i energia",
        "label": "Jakość snu: Czy budzisz się rano z poczuciem pełnego wypoczęcia, czy masz trudności z nocną regeneracją (np. problemy z zasypianiem, częste wybudzanie)?",
    },
    {
        "id": "body_signals",
        "section": "Aspekty fizyczne i energia",
        "label": "Sygnały z ciała: Czy w ostatnim czasie towarzyszy Ci jakikolwiek przewlekły dyskomfort fizyczny, nawracający ból lub napięcie mięśniowe?",
    },
    {
        "id": "stress_level",
        "section": "Zdrowie psychiczne i emocjonalne",
        "label": "Poziom stresu: Jak często w ciągu ostatnich dwóch tygodni odczuwałeś/aś przytłoczenie lub trudności z opanowaniem stresu w codziennych sytuacjach?",
    },
    {
        "id": "mood",
        "section": "Zdrowie psychiczne i emocjonalne",
        "label": "Ogólny nastrój: Jak ocenił(a)byś swój codzienny nastrój oraz zdolność do czerpania satysfakcji i radości z rutynowych aktywności?",
    },
    {
        "id": "cognitive",
        "section": "Zdrowie psychiczne i emocjonalne",
        "label": "Funkcje poznawcze: Czy zauważasz u siebie tzw. mgłę mózgową, odczuwalne spadki motywacji lub nawracające problemy ze skupieniem uwagi?",
    },
    {
        "id": "digestion",
        "section": "Codzienne nawyki i profilaktyka",
        "label": "Układ pokarmowy: Czy po posiłkach regularnie odczuwasz dyskomfort (np. uczucie ciężkości, wzdęcia, spadki energii), czy Twoje trawienie przebiega bezproblemowo?",
    },
    {
        "id": "appetite",
        "section": "Codzienne nawyki i profilaktyka",
        "label": "Apetyt i odżywianie: Czy zaobserwowałeś/aś u siebie ostatnio niepokojące lub nieplanowane zmiany w apetycie bądź wahania masy ciała?",
    },
    {
        "id": "balance",
        "section": "Codzienne nawyki i profilaktyka",
        "label": "Równowaga i regeneracja: Czy czujesz, że w Twoim obecnym harmonogramie jest zachowany zdrowy balans między wysiłkiem (zarówno fizycznym, jak i umysłowym) a czasem na świadomy odpoczynek?",
    },
    {
        "id": "long_term",
        "section": "Codzienne nawyki i profilaktyka",
        "label": "Perspektywa długoterminowa: Biorąc pod uwagę wszystkie powyższe aspekty, czy masz poczucie, że Twój obecny styl życia aktywnie wspiera Twoje zdrowie na przyszłość?",
    },
]

_question_map: dict[str, str] = {q["id"]: q["label"] for q in SELF_CHECK_QUESTIONS}


def get_question_label(question_id: str) -> str:
    return _question_map.get(question_id, question_id)


def format_questions_for_prompt() -> str:
    lines = []
    current_section = None
    for q in SELF_CHECK_QUESTIONS:
        if q["section"] != current_section:
            current_section = q["section"]
            lines.append(f"\n{current_section}:")
        lines.append(f"  - {q['label']}")
    return "\n".join(lines)
