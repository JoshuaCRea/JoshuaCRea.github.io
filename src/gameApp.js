import {
    CCW_DIR_VALUE,
    CW_DIR_VALUE,
    TRACK_DETAILS,
    createPlayers,
    getTownCopy,
    normalizeIndex,
} from "./gameData.js";

const React = window.React;
const ReactDOM = window.ReactDOM;
const MAX_STAT = 5;
const SCHOOL_STARTING_INTEGRITY = 3;
const SILVER_WOLF_BASE_STRENGTH = 20;
const TOTAL_TO_CHALLENGE = 15;

function createInitialPlayers() {
    return createPlayers().map((player) => ({
        ...player,
        power: 0,
        stamina: 0,
        agility: 0,
        chi: 0,
        wit: 0,
        reputation: 3,
        alive: true,
    }));
}

function createSchools() {
    return TRACK_DETAILS.filter((location) => location.type === "town").map((location) => ({
        id: location.id,
        name: location.name,
        integrity: SCHOOL_STARTING_INTEGRITY,
    }));
}

function getTrackStyle(index, color) {
    return {
        "--angle": `${(360 / TRACK_DETAILS.length) * index}deg`,
        "--node-color": color,
    };
}

function clampStat(value) {
    return Math.max(0, Math.min(MAX_STAT, value));
}

function randomDie() {
    return Math.floor(Math.random() * 6) + 1;
}

function getTotalStats(player) {
    return player.power + player.stamina + player.agility + player.chi + player.wit;
}

function isTown(locationId) {
    return locationId.startsWith("#") && !locationId.startsWith("#road");
}

function getSchoolById(schools, schoolId) {
    return schools.find((school) => school.id === schoolId) || null;
}

function getAlivePlayers(players) {
    return players.filter((player) => player.alive);
}

function getNextLivingIndex(players, currentIndex) {
    for (let offset = 1; offset <= players.length; offset += 1) {
        const candidateIndex = (currentIndex + offset) % players.length;
        if (players[candidateIndex].alive) {
            return candidateIndex;
        }
    }

    return currentIndex;
}

function changeStats(player, updates) {
    Object.entries(updates).forEach(([key, value]) => {
        player[key] = clampStat(player[key] + value);
    });
}

function getSilverWolfStrength(schools) {
    const destroyedSchools = schools.filter((school) => school.integrity === 0).length;
    return SILVER_WOLF_BASE_STRENGTH + (destroyedSchools * 2);
}

function canChallengeSilverWolf(player) {
    return player.alive && getTotalStats(player) >= TOTAL_TO_CHALLENGE;
}

function buildCombatScore(player) {
    return player.power + player.stamina + player.agility + player.chi + player.wit + randomDie();
}

function applyTownEffect(player, school, location) {
    let detail = `${player.name} trains in ${location.name}.`;

    switch (location.id) {
        case "#Leap-Creek":
            changeStats(player, { agility: 1, chi: 1 });
            detail += " Water-form training raises Agility and Chi.";
            break;
        case "#Blackstone":
            changeStats(player, { power: 1, stamina: 1 });
            detail += " Iron-body drills raise Power and Stamina.";
            break;
        case "#Fangmarsh":
            changeStats(player, { power: 1, chi: 1, stamina: -1 });
            detail += " Harsh marsh training raises Power and Chi, but costs 1 Stamina.";
            break;
        case "#Underclaw":
            changeStats(player, { agility: 1, wit: 1 });
            detail += " Shadow-footwork raises Agility and Wit.";
            break;
        case "#Pouch":
            changeStats(player, { chi: 1, wit: 1 });
            detail += " Drunken-boxing lessons raise Chi and Wit.";
            break;
        default:
            break;
    }

    if (school && school.integrity > 0 && school.integrity < SCHOOL_STARTING_INTEGRITY) {
        school.integrity += 1;
        detail += ` ${location.name}'s school recovers 1 integrity.`;
    }

    return detail;
}

function applyRoadEncounter(player, location) {
    const roll = randomDie();
    let detail = `${player.name} crosses ${location.name}.`;

    switch (location.id) {
        case "#roadLCBS":
            if (roll >= 4) {
                changeStats(player, { power: 1 });
                detail += " Hauling stones through the ford raises Power.";
            } else {
                changeStats(player, { stamina: -1, chi: -1 });
                detail += " Exhaustion and self-doubt cost 1 Stamina and 1 Chi.";
            }
            break;
        case "#roadBSFM":
            if (roll >= 5) {
                changeStats(player, { wit: 1, agility: 1 });
                detail += " Outsmarting a rival raises Wit and Agility.";
            } else {
                changeStats(player, { stamina: -1, chi: -1 });
                detail += " A roadside beating costs 1 Stamina and 1 Chi.";
            }
            break;
        case "#roadFMUC":
            if (roll >= 4) {
                changeStats(player, { chi: 1, wit: 1 });
                detail += " A severe teacher raises Chi and Wit.";
            } else {
                changeStats(player, { chi: -1 });
                detail += " Harsh criticism costs 1 Chi.";
            }
            break;
        case "#roadUCP":
            if (roll >= 4) {
                changeStats(player, { agility: 1, stamina: 1 });
                detail += " Moonlit running raises Agility and Stamina.";
            } else {
                changeStats(player, { power: -1 });
                detail += " A bad fall costs 1 Power.";
            }
            break;
        case "#roadPLC":
            if (roll >= 5) {
                changeStats(player, { power: 1, wit: 1 });
                detail += " Driving off the Silver Wolf's agents raises Power and Wit.";
            } else {
                changeStats(player, { stamina: -1, chi: -1 });
                detail += " The Silver Wolf's agents injure your body and confidence, costing 1 Stamina and 1 Chi.";
            }
            break;
        default:
            break;
    }

    return detail;
}

function resolveRivalFight(players, activeIndex, logEntries) {
    const activePlayer = players[activeIndex];
    const rivals = players.filter((player, index) => (
        index !== activeIndex && player.alive && player.position === activePlayer.position
    ));

    if (rivals.length === 0) {
        return;
    }

    const rival = rivals[0];
    const activeScore = buildCombatScore(activePlayer);
    const rivalScore = buildCombatScore(rival);

    if (activeScore >= rivalScore) {
        changeStats(activePlayer, { wit: 1 });
        changeStats(rival, { stamina: -1, chi: -1 });
        logEntries.push(
            `${activePlayer.name} beats ${rival.name} in a fight and gains 1 Wit. ${rival.name} loses 1 Stamina and 1 Chi.`
        );
        return;
    }

    changeStats(rival, { wit: 1 });
    changeStats(activePlayer, { stamina: -1, chi: -1 });
    logEntries.push(
        `${rival.name} beats ${activePlayer.name} in a fight. ${activePlayer.name} loses 1 Stamina and 1 Chi.`
    );
}

function advanceSilverWolf(schools, logEntries) {
    const standingSchools = schools.filter((school) => school.integrity > 0);

    if (standingSchools.length === 0) {
        return false;
    }

    const target = standingSchools[Math.floor(Math.random() * standingSchools.length)];
    target.integrity -= 1;

    if (target.integrity === 0) {
        logEntries.push(`The Silver Wolf destroys the school of ${target.name}.`);
    } else {
        logEntries.push(`The Silver Wolf attacks ${target.name}'s school. Integrity falls to ${target.integrity}.`);
    }

    return schools.some((school) => school.integrity > 0);
}

function StatPill({ label, value }) {
    return React.createElement(
        "div",
        { className: "practice-stat-pill" },
        React.createElement("span", { className: "practice-stat-label" }, label),
        React.createElement("strong", null, value)
    );
}

function PlayerCard({ player, isActive, isWinner }) {
    const playerLocation = TRACK_DETAILS[player.position];
    const townCopy = getTownCopy(playerLocation.id);
    const classes = `practice-roster-card${isActive ? " is-active" : ""}${isWinner ? " is-winner" : ""}`;

    return React.createElement(
        "article",
        {
            className: classes,
            style: { "--accent": player.color, opacity: player.alive ? 1 : 0.62 },
        },
        React.createElement(
            "div",
            { className: "practice-roster-top" },
            React.createElement(
                "div",
                { className: "practice-roster-title" },
                React.createElement("span", {
                    className: "practice-roster-dot",
                    style: { backgroundColor: player.color },
                }),
                React.createElement("h3", null, player.name)
            ),
            isActive ? React.createElement("span", { className: "practice-turn-badge" }, "Current turn") : null
        ),
        React.createElement("p", { className: "practice-roster-location" }, player.alive ? playerLocation.name : "Dead"),
        React.createElement(
            "div",
            { className: "practice-roster-stats" },
            React.createElement(StatPill, { label: "Power", value: player.power }),
            React.createElement(StatPill, { label: "Stamina", value: player.stamina }),
            React.createElement(StatPill, { label: "Agility", value: player.agility }),
            React.createElement(StatPill, { label: "Chi", value: player.chi }),
            React.createElement(StatPill, { label: "Wit", value: player.wit })
        ),
        React.createElement(
            "div",
            { className: "practice-roster-bar-wrap" },
            React.createElement("p", { className: "practice-roster-bar-label" }, "Reputation"),
            React.createElement(
                "div",
                {
                    className: "practice-roster-bar-indicator",
                    style: { "--reputation-position": player.reputation },
                    "aria-label": `Reputation ${player.reputation} of 5`,
                },
                React.createElement(
                    "div",
                    { className: "practice-roster-bar", "aria-hidden": "true" },
                    React.createElement("span", { className: "practice-roster-bar-segment is-black" }),
                    React.createElement("span", { className: "practice-roster-bar-segment is-black" }),
                    React.createElement("span", { className: "practice-roster-bar-segment is-brown" }),
                    React.createElement("span", { className: "practice-roster-bar-segment is-brown" }),
                    React.createElement("span", { className: "practice-roster-bar-segment is-gold" })
                ),
                React.createElement("span", { className: "practice-roster-bar-pointer" })
            )
        ),
        React.createElement("p", { className: "practice-roster-copy" }, `${townCopy.description} • ${townCopy.school}`)
    );
}

function BoardNode({ index, location, players }) {
    const occupants = players.filter((player) => player.alive && player.position === index);

    return React.createElement(
        "div",
        {
            className: `practice-node practice-node-${location.type}`,
            style: getTrackStyle(index, location.hue),
        },
        React.createElement("div", { className: "practice-node-core" }, location.name),
        React.createElement(
            "div",
            { className: "practice-node-occupants" },
            occupants.map((player) =>
                React.createElement("span", {
                    key: `${location.id}-${player.id}`,
                    className: "practice-occupant",
                    title: player.name,
                    style: { backgroundColor: player.color },
                })
            )
        )
    );
}

function SchoolCard({ school }) {
    return React.createElement(
        "article",
        {
            className: "practice-effect-card",
            style: { "--accent": school.integrity > 0 ? "#d7b372" : "#8f3c3c" },
        },
        React.createElement("h3", null, school.name),
        React.createElement(
            "p",
            null,
            school.integrity > 0
                ? `School integrity: ${school.integrity}/${SCHOOL_STARTING_INTEGRITY}`
                : "Destroyed by the Silver Wolf."
        )
    );
}

function RulesCard({ title, copy, accent }) {
    return React.createElement(
        "article",
        { className: "practice-effect-card", style: { "--accent": accent } },
        React.createElement("h3", null, title),
        React.createElement("p", null, copy)
    );
}

function PracticeGame() {
    const [players, setPlayers] = React.useState(createInitialPlayers);
    const [schools, setSchools] = React.useState(createSchools);
    const [currentPlayerIndex, setCurrentPlayerIndex] = React.useState(0);
    const [pendingRoll, setPendingRoll] = React.useState(null);
    const [battleLog, setBattleLog] = React.useState([
        "Travel the Valley of the Star, raise your five stats, and become strong enough to face the Silver Wolf.",
    ]);
    const [winnerId, setWinnerId] = React.useState(null);
    const [gameOverReason, setGameOverReason] = React.useState("");

    const currentPlayer = players[currentPlayerIndex];
    const winner = players.find((player) => player.id === winnerId) || null;
    const currentLocation = currentPlayer ? TRACK_DETAILS[currentPlayer.position] : TRACK_DETAILS[0];
    const currentTownCopy = getTownCopy(currentLocation.id);
    const livingPlayers = getAlivePlayers(players);

    function appendLog(message) {
        setBattleLog((existing) => [message].concat(existing).slice(0, 8));
    }

    function resetGame() {
        setPlayers(createInitialPlayers());
        setSchools(createSchools());
        setCurrentPlayerIndex(0);
        setPendingRoll(null);
        setWinnerId(null);
        setGameOverReason("");
        setBattleLog([
            "The schools still stand. Travel the Valley of the Star and grow your kung fu before facing the Silver Wolf.",
        ]);
    }

    function endTurn(updatedPlayers, updatedSchools, logEntries, activeIndex) {
        const aliveAfterTurn = getAlivePlayers(updatedPlayers);

        if (aliveAfterTurn.length === 0) {
            setPlayers(updatedPlayers);
            setSchools(updatedSchools);
            setGameOverReason("Every challenger is dead. The Silver Wolf remains undefeated.");
            logEntries.forEach((entry) => appendLog(entry));
            setPendingRoll(null);
            return;
        }

        const schoolsStillStanding = advanceSilverWolf(updatedSchools, logEntries);

        setPlayers(updatedPlayers);
        setSchools(updatedSchools);
        logEntries.forEach((entry) => appendLog(entry));
        setPendingRoll(null);

        if (!schoolsStillStanding) {
            setGameOverReason("The Silver Wolf destroyed all five schools. The valley was not protected.");
            return;
        }

        setCurrentPlayerIndex(getNextLivingIndex(updatedPlayers, activeIndex));
    }

    function rollFate() {
        if (winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive) {
            return;
        }

        const result = Math.floor(Math.random() * 4) + 1;
        setPendingRoll(result);
        appendLog(`${currentPlayer.name} rolled ${result}. Choose a direction through the Valley of the Star.`);
    }

    function travel(direction) {
        if (winnerId || gameOverReason || pendingRoll === null || !currentPlayer?.alive) {
            return;
        }

        const directionLabel = direction === CW_DIR_VALUE ? "sunwise" : "widdershins";
        const updatedPlayers = players.map((player) => ({ ...player }));
        const updatedSchools = schools.map((school) => ({ ...school }));
        const activePlayer = updatedPlayers[currentPlayerIndex];
        const totalSteps = pendingRoll;
        const logEntries = [];

        activePlayer.position = normalizeIndex(activePlayer.position + (direction * totalSteps));

        const landing = TRACK_DETAILS[activePlayer.position];
        logEntries.push(`${activePlayer.name} moved ${directionLabel} ${totalSteps} spaces to ${landing.name}.`);

        if (isTown(landing.id)) {
            const school = getSchoolById(updatedSchools, landing.id);
            logEntries.push(applyTownEffect(activePlayer, school, landing));
        } else {
            logEntries.push(applyRoadEncounter(activePlayer, landing));
        }

        resolveRivalFight(updatedPlayers, currentPlayerIndex, logEntries);
        endTurn(updatedPlayers, updatedSchools, logEntries, currentPlayerIndex);
    }

    function challengeSilverWolf() {
        if (winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive || !canChallengeSilverWolf(currentPlayer)) {
            return;
        }

        const updatedPlayers = players.map((player) => ({ ...player }));
        const updatedSchools = schools.map((school) => ({ ...school }));
        const challenger = updatedPlayers[currentPlayerIndex];
        const wolfStrength = getSilverWolfStrength(updatedSchools) + randomDie();
        const challengerStrength = buildCombatScore(challenger);
        const logEntries = [
            `${challenger.name} challenges the Silver Wolf with Power ${challenger.power}, Stamina ${challenger.stamina}, Agility ${challenger.agility}, Chi ${challenger.chi}, and Wit ${challenger.wit}.`,
        ];

        if (challengerStrength > wolfStrength) {
            setPlayers(updatedPlayers);
            setSchools(updatedSchools);
            setWinnerId(challenger.id);
            logEntries.push(`${challenger.name} defeats the Silver Wolf in combat and wins Valley of the Silver Wolf.`);
            logEntries.forEach((entry) => appendLog(entry));
            return;
        }

        challenger.alive = false;
        logEntries.push(`The Silver Wolf kills ${challenger.name}. His kung fu was too strong.`);
        endTurn(updatedPlayers, updatedSchools, logEntries, currentPlayerIndex);
    }

    return React.createElement(
        "main",
        { className: "practice-shell" },
        React.createElement(
            "section",
            { className: "practice-hero" },
            React.createElement("p", { className: "practice-kicker" }, "React game"),
            React.createElement("h1", null, "Valley of the Silver Wolf"),
            React.createElement(
                "p",
                { className: "practice-intro" },
                "Travel the Valley of the Star, raise Power, Stamina, Agility, Chi, and Wit, fight rivals when needed, and become the first warrior strong enough to defeat the Silver Wolf in combat."
            )
        ),
        React.createElement(
            "section",
            { className: "practice-layout" },
            React.createElement(
                "div",
                { className: "practice-board-panel" },
                React.createElement(
                    "div",
                    { className: "practice-board" },
                    React.createElement("div", { className: "practice-board-glow" }),
                    TRACK_DETAILS.map((location, index) =>
                        React.createElement(BoardNode, {
                            key: location.id,
                            location,
                            index,
                            players,
                        })
                    ),
                    React.createElement(
                        "div",
                        { className: "practice-centerpiece" },
                        React.createElement("span", { className: "practice-center-label" }, "Silver Wolf"),
                        React.createElement(
                            "strong",
                            null,
                            winner
                                ? `${winner.name} has prevailed`
                                : gameOverReason
                                    ? "The valley mourns"
                                    : `Kung fu strength ${getSilverWolfStrength(schools)}`
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "practice-controls" },
                    React.createElement(
                        "div",
                        { className: "practice-turn-card" },
                        React.createElement("p", { className: "practice-turn-label" }, "Active fighter"),
                        React.createElement("h2", null, winner ? winner.name : currentPlayer?.name || "None"),
                        React.createElement(
                            "p",
                            { className: "practice-turn-copy" },
                            winner
                                ? `${winner.name} alone succeeded in protecting the valley and defeating the Silver Wolf.`
                                : gameOverReason
                                    ? gameOverReason
                                    : `${currentTownCopy.description} near ${currentLocation.name}. ${currentTownCopy.school}. Raise your stats, preserve the schools, and challenge the Silver Wolf only when ready.`
                        ),
                        React.createElement(
                            "div",
                            { className: "practice-action-row" },
                            React.createElement(
                                "button",
                                {
                                    className: "practice-button practice-button-primary",
                                    onClick: rollFate,
                                    disabled: Boolean(winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive),
                                    type: "button",
                                },
                                pendingRoll === null ? "Roll fate" : `Rolled ${pendingRoll}`
                            ),
                            React.createElement(
                                "button",
                                {
                                    className: "practice-button practice-button-secondary",
                                    onClick: resetGame,
                                    type: "button",
                                },
                                "Reset board"
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "practice-action-row" },
                            React.createElement(
                                "button",
                                {
                                    className: "practice-button",
                                    onClick: () => travel(CW_DIR_VALUE),
                                    disabled: Boolean(pendingRoll === null || winnerId || gameOverReason || !currentPlayer?.alive),
                                    type: "button",
                                },
                                "Travel sunwise"
                            ),
                            React.createElement(
                                "button",
                                {
                                    className: "practice-button",
                                    onClick: () => travel(CCW_DIR_VALUE),
                                    disabled: Boolean(pendingRoll === null || winnerId || gameOverReason || !currentPlayer?.alive),
                                    type: "button",
                                },
                                "Travel widdershins"
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "practice-action-row" },
                            React.createElement(
                                "button",
                                {
                                    className: "practice-button",
                                    onClick: challengeSilverWolf,
                                    disabled: Boolean(winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive || !canChallengeSilverWolf(currentPlayer)),
                                    type: "button",
                                },
                                "Challenge the Silver Wolf"
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "practice-turn-meta" },
                            React.createElement(StatPill, { label: "Need total", value: `${TOTAL_TO_CHALLENGE}+` }),
                            React.createElement(StatPill, { label: "Your total", value: currentPlayer ? getTotalStats(currentPlayer) : 0 }),
                            React.createElement(StatPill, { label: "Wolf strength", value: getSilverWolfStrength(schools) }),
                            React.createElement(StatPill, { label: "Schools standing", value: schools.filter((school) => school.integrity > 0).length }),
                            React.createElement(StatPill, { label: "Living rivals", value: livingPlayers.length })
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "practice-log-card" },
                        React.createElement("h3", null, "Recent events"),
                        React.createElement(
                            "ul",
                            { className: "practice-log" },
                            battleLog.map((entry, index) => React.createElement("li", { key: `log-${index}` }, entry))
                        )
                    )
                )
            ),
            React.createElement(
                "aside",
                { className: "practice-sidebar" },
                React.createElement("h2", null, "Fighters"),
                players.map((player, index) =>
                    React.createElement(PlayerCard, {
                        key: player.id,
                        player,
                        isActive: currentPlayerIndex === index && !winnerId && !gameOverReason,
                        isWinner: winner ? winner.id === player.id : false,
                    })
                ),
                React.createElement("h2", null, "Schools Under Threat"),
                React.createElement(
                    "div",
                    { className: "practice-effects-grid" },
                    schools.map((school) => React.createElement(SchoolCard, { key: school.id, school }))
                ),
                React.createElement("h2", null, "Stats"),
                React.createElement(
                    "div",
                    { className: "practice-effects-grid" },
                    React.createElement(RulesCard, {
                        title: "Power",
                        copy: "Physical strength and athletic ability. Lifting, climbing, and breaking things draw on Power.",
                        accent: "#d57a52",
                    }),
                    React.createElement(RulesCard, {
                        title: "Stamina",
                        copy: "Toughness and resilience. Enduring hardship, pain, or exhausting effort draws on Stamina.",
                        accent: "#8e98a6",
                    }),
                    React.createElement(RulesCard, {
                        title: "Agility",
                        copy: "Dexterity and acrobatics. Dodging, flipping, and outrunning danger draw on Agility.",
                        accent: "#61c7ff",
                    }),
                    React.createElement(RulesCard, {
                        title: "Chi",
                        copy: "Mental strength and focus. Meditation, concentration, and bodily harmony draw on Chi.",
                        accent: "#49a86d",
                    }),
                    React.createElement(RulesCard, {
                        title: "Wit",
                        copy: "Cognitive and charismatic ability. Reading people, solving problems, and anticipating outcomes draw on Wit.",
                        accent: "#a57bed",
                    })
                ),
                React.createElement("h2", null, "How to win"),
                React.createElement(
                    "div",
                    { className: "practice-effects-grid" },
                    React.createElement(RulesCard, {
                        title: "Victory",
                        copy: "Be the first and only fighter to defeat the Silver Wolf in combat.",
                        accent: "#61c7ff",
                    }),
                    React.createElement(RulesCard, {
                        title: "Failure",
                        copy: "If the Silver Wolf destroys all five schools, everyone loses and there are zero winners.",
                        accent: "#c94c54",
                    }),
                    React.createElement(RulesCard, {
                        title: "Combat",
                        copy: "Losing to rivals or adversaries injures your body and confidence. Losing to the Silver Wolf means death.",
                        accent: "#8d6d54",
                    })
                )
            )
        )
    );
}

export function mountGame(rootElement) {
    if (!rootElement || !React || !ReactDOM || !ReactDOM.createRoot) {
        return;
    }

    ReactDOM.createRoot(rootElement).render(React.createElement(PracticeGame));
}
