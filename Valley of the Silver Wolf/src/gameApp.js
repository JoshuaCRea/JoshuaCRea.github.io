import {
    CCW_DIR_VALUE,
    CW_DIR_VALUE,
    TRACK_DETAILS,
    createPlayers,
    getFighterStatusFace,
    getSchoolSigil,
    getTownCopy,
    normalizeIndex,
} from "./gameData.js";

const React = window.React;
const ReactDOM = window.ReactDOM;
const MAX_STAT = 5;
const SCHOOL_STATUS_WHOLE = "whole";
const SCHOOL_STATUS_SIEGED = "sieged";
const SCHOOL_STATUS_DESTROYED = "destroyed";
const WHITE_DIE_WOLF = 1;
const SILVER_WOLF_BASE_STRENGTH = 20;
const TOTAL_TO_CHALLENGE = 15;
const TRAVEL_ARROWS_ICON = new URL("../images/arrows-couple-svgrepo-com.svg", import.meta.url).href;
const DEFEND_ICON = new URL("../images/defend-icon.svg", import.meta.url).href;
const FIRE_ICON = new URL("../images/fire-svgrepo-com.svg", import.meta.url).href;
const HEAL_ICON = new URL("../images/medicine-pharmacy-svgrepo-com.svg", import.meta.url).href;
const QUEST_ICON = new URL("../images/business-card-svgrepo-com.svg", import.meta.url).href;
const MOUNTAIN_ICON = new URL("../images/mountain-1-svgrepo-com.svg", import.meta.url).href;
const MODAL_BACKGROUND = new URL("../images/Modal background.jpeg", import.meta.url).href;
const TOWN_STAR_POSITIONS = [
    { x: "50%", y: "4%" },
    { x: "90%", y: "36%" },
    { x: "74%", y: "86%" },
    { x: "26%", y: "86%" },
    { x: "10%", y: "36%" },
];
const HOMETOWN_MODAL_POSITIONS = [
    { x: "50%", y: "16%" },
    { x: "74%", y: "37%" },
    { x: "64%", y: "68%" },
    { x: "36%", y: "68%" },
    { x: "26%", y: "37%" },
];
const ROAD_STAR_POSITIONS = [
    { x: "50%", y: "18%" },
    { x: "78%", y: "38%" },
    { x: "66%", y: "74%" },
    { x: "34%", y: "74%" },
    { x: "22%", y: "38%" },
];
const COMBAT_PHASES = [
    {
        id: "selection",
        title: "Selection Phase",
        copy: "Each combatant chooses one combat card and declares which modal option will be used for this clash.",
    },
    {
        id: "reveal",
        title: "Reveal Step",
        copy: "Both cards are revealed simultaneously. If a stone would be placed in the tabletop version, deduct a Form Point here instead.",
    },
    {
        id: "reaction",
        title: "Reaction Phase",
        copy: "Resolve reactions, technique responses, White Die effects for non-player adversaries, and any Stumble changes.",
    },
    {
        id: "calculation",
        title: "Calculation Step",
        copy: "Compare the attack and defense arrays, then subtract any resulting Hit Points.",
    },
    {
        id: "activation",
        title: "Activation Phase",
        copy: "Queue up to one technique per fighter for the next clash before beginning again.",
    },
];
const PLAYER_STARTING_STATS = {
    Pouch: { power: 0, stamina: 1, agility: 0, chi: 0, wit: 2 },
    "Leap-Creek": { power: 0, stamina: 0, agility: 1, chi: 2, wit: 0 },
    Fangmarsh: { power: 2, stamina: 0, agility: 0, chi: 0, wit: 1 },
    Blackstone: { power: 1, stamina: 2, agility: 0, chi: 0, wit: 0 },
    Underclaw: { power: 0, stamina: 0, agility: 2, chi: 1, wit: 0 },
};

function createInitialPlayers() {
    return createPlayers().map((player, index) => ({
        ...player,
        ...PLAYER_STARTING_STATS[player.name],
        reputation: 3,
        techniques: { black: 0, brown: 0, gold: 0 },
        hitPoints: 3,
        formPoints: 2,
        injured: false,
        arrivalOrder: index,
        alive: true,
    }));
}

function createSchools() {
    return TRACK_DETAILS.filter((location) => location.type === "town").map((location) => ({
        id: location.id,
        name: location.name,
        status: SCHOOL_STATUS_WHOLE,
        saveProgress: 0,
        isCompletingSave: false,
        defenders: [],
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

function rollWhiteDie() {
    return randomDie();
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

function getSchoolByName(schools, schoolName) {
    return schools.find((school) => school.name === schoolName) || null;
}

function getSchoolEventLabel(school) {
    const townCopy = getTownCopy(school.id);
    return `the ${townCopy.school} in ${school.name}`;
}

function formatNameList(names) {
    if (names.length <= 1) {
        return names[0] || "";
    }

    if (names.length === 2) {
        return `${names[0]} and ${names[1]}`;
    }

    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function getAlivePlayers(players) {
    return players.filter((player) => player.alive);
}

function getActionsForPlayer(player) {
    return player?.injured ? 1 : 2;
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
    const tookDamage = Object.values(updates).some((value) => value < 0);

    Object.entries(updates).forEach(([key, value]) => {
        player[key] = clampStat(player[key] + value);
    });

    if (tookDamage) {
        player.injured = true;
    }
}

function lowerReputation(player, amount = 1) {
    player.reputation = clampStat(player.reputation - amount);
}

function raiseReputation(player, amount = 1) {
    player.reputation = clampStat(player.reputation + amount);
}

function getSilverWolfStrength(schools) {
    const destroyedSchools = schools.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
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

function getRivalsAtPosition(players, activeIndex) {
    const activePlayer = players[activeIndex];

    if (!activePlayer?.alive) {
        return [];
    }

    return players.filter((player, index) => (
        index !== activeIndex && player.alive && player.position === activePlayer.position
    ));
}

function advanceSilverWolf(schools, logEntries) {
    const standingSchools = schools.filter((school) => school.status !== SCHOOL_STATUS_DESTROYED);
    const siegedSchool = standingSchools.find((school) => school.status === SCHOOL_STATUS_SIEGED && !school.isCompletingSave) || null;
    const wholeSchools = standingSchools.filter((school) => school.status === SCHOOL_STATUS_WHOLE && !school.isCompletingSave);

    if (standingSchools.length === 0) {
        return false;
    }

    const whiteDieResult = rollWhiteDie();

    if (siegedSchool) {
        const selectedSchool = standingSchools[Math.floor(Math.random() * standingSchools.length)];

        if (selectedSchool.id !== siegedSchool.id) {
            return schools.some((school) => school.status !== SCHOOL_STATUS_DESTROYED);
        }

        if (whiteDieResult === WHITE_DIE_WOLF) {
            siegedSchool.status = SCHOOL_STATUS_DESTROYED;
            siegedSchool.saveProgress = 0;
            siegedSchool.isCompletingSave = false;
            siegedSchool.defenders = [];
            logEntries.push(`The Silver Wolf has destroyed ${getSchoolEventLabel(siegedSchool)}.`);
        }
        return schools.some((school) => school.status !== SCHOOL_STATUS_DESTROYED);
    }

    if (wholeSchools.length === 0) {
        return false;
    }

    const target = wholeSchools[Math.floor(Math.random() * wholeSchools.length)];

    if (whiteDieResult === WHITE_DIE_WOLF) {
        target.status = SCHOOL_STATUS_SIEGED;
        target.saveProgress = 0;
        target.isCompletingSave = false;
        target.defenders = [];
        logEntries.push(`The Silver Wolf has laid siege to ${getSchoolEventLabel(target)}.`);
    }

    return schools.some((school) => school.status !== SCHOOL_STATUS_DESTROYED);
}

function StatPill({ label, value }) {
    return React.createElement(
        "div",
        { className: "practice-stat-pill" },
        React.createElement("span", { className: "practice-stat-label" }, label),
        React.createElement("strong", null, value)
    );
}

const FIGHTER_STYLE_COPY = {
    "Leap-Creek": {
        style: "Boundless Hand",
        keyword: "Reversal",
    },
    Fangmarsh: {
        style: "Praying Mantis",
        keyword: "Flurry",
    },
    Blackstone: {
        style: "Immense Fist",
        keyword: "Endure",
    },
    Underclaw: {
        style: "Long Fist",
        keyword: "Overwhelm",
    },
    Pouch: {
        style: "Drunken Fist",
        keyword: "Stumble",
    },
};

function FighterProfileCard({ player }) {
    const townCopy = getTownCopy(`#${player.name}`);
    const sigilSrc = getSchoolSigil(player.name);
    const healthStatus = player.alive ? (player.injured ? "injured" : "healthy") : "dead";
    const healthFaceSrc = getFighterStatusFace(healthStatus);
    const healthLabel = player.alive
        ? (player.injured ? "You are Injured" : "You are Healthy")
        : "You are Dead";
    const schoolLabel = townCopy.school.startsWith("The ") ? townCopy.school : `The ${townCopy.school}`;
    const schoolLabelMatch = schoolLabel.match(/^(The\s+(?:Temple|School|Kwoon)\s+of)\s+(.+)$/i);
    const schoolLabelTop = schoolLabelMatch ? schoolLabelMatch[1] : schoolLabel;
    const schoolLabelBottom = schoolLabelMatch ? schoolLabelMatch[2] : "";
    const styleCopy = FIGHTER_STYLE_COPY[player.name] || { style: "TBD", keyword: "TBD" };

    return React.createElement(
        "div",
        { className: "practice-fighter-profile" },
        React.createElement(
            "div",
            { className: "practice-fighter-profile-top" },
            React.createElement(
                "div",
                { className: "practice-fighter-profile-copy" },
                React.createElement("p", { className: "practice-fighter-profile-kicker" }, "You are the Light of"),
                React.createElement("h2", { className: player.alive ? "" : "is-dead" }, player.name),
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-school" },
                    React.createElement("p", { className: "practice-fighter-profile-school-line" }, schoolLabelTop),
                    schoolLabelBottom
                        ? React.createElement("p", { className: "practice-fighter-profile-school-line" }, schoolLabelBottom)
                        : null
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-style" },
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-style-block" },
                    React.createElement("p", { className: "practice-fighter-profile-style-label" }, "Style"),
                    React.createElement("p", { className: "practice-fighter-profile-style-line" }, styleCopy.style)
                ),
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-style-block" },
                    React.createElement("p", { className: "practice-fighter-profile-style-label" }, "Keyword"),
                    React.createElement("p", { className: "practice-fighter-profile-style-line" }, styleCopy.keyword)
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-sigil-block" },
                sigilSrc
                    ? React.createElement("img", {
                        className: "practice-fighter-profile-sigil",
                        src: sigilSrc,
                        alt: `${player.name} sigil`,
                    })
                    : null,
                React.createElement(
                    "p",
                    { className: "practice-fighter-profile-nickname" },
                    `"${townCopy.description}"`
                )
            )
        ),
        React.createElement(
            "div",
            { className: "practice-fighter-profile-stats" },
            React.createElement(StatPill, { label: "Power", value: player.power }),
            React.createElement(StatPill, { label: "Stamina", value: player.stamina }),
            React.createElement(StatPill, { label: "Agility", value: player.agility }),
            React.createElement(StatPill, { label: "Chi", value: player.chi }),
            React.createElement(StatPill, { label: "Wit", value: player.wit })
        ),
        React.createElement(
            "div",
            { className: "practice-fighter-profile-bottom" },
            React.createElement(
                "div",
                { className: "practice-fighter-profile-health" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Health"),
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-health-row" },
                    React.createElement("img", {
                        className: "practice-fighter-profile-face",
                        src: healthFaceSrc,
                        alt: healthLabel,
                    })
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-techniques" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Techniques"),
                React.createElement(
                    "div",
                    { className: "practice-fighter-profile-techniques-row", "aria-label": "Techniques" },
                    React.createElement("button", { className: "practice-technique-button is-black", type: "button" }, player.techniques?.black ?? 0),
                    React.createElement("button", { className: "practice-technique-button is-brown", type: "button" }, player.techniques?.brown ?? 0),
                    React.createElement("button", { className: "practice-technique-button is-gold", type: "button" }, player.techniques?.gold ?? 0)
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-reputation" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Reputation"),
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
            )
        ),
        React.createElement(
            "div",
            { className: "practice-fighter-profile-point-sections" },
            React.createElement(
                "div",
                { className: "practice-fighter-profile-point-section" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Hit Points"),
                React.createElement(
                    "div",
                    { className: "practice-form-points-row", "aria-label": `Hit Points ${player.hitPoints ?? 0} of 6` },
                    Array.from({ length: 6 }).map((_, index) =>
                        React.createElement("span", {
                            key: `hit-point-${player.id}-${index}`,
                            className: `practice-form-point${index < (player.hitPoints ?? 0) ? " is-filled" : ""}`,
                            "aria-hidden": "true",
                        })
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "practice-fighter-profile-point-section" },
                React.createElement("p", { className: "practice-fighter-profile-section-label" }, "Form Points"),
                React.createElement(
                    "div",
                    { className: "practice-form-points-row", "aria-label": `Form Points ${player.formPoints ?? 0} of 5` },
                    Array.from({ length: 5 }).map((_, index) =>
                        React.createElement("span", {
                            key: `form-point-${player.id}-${index}`,
                            className: `practice-form-point${index < (player.formPoints ?? 0) ? " is-filled" : ""}`,
                            "aria-hidden": "true",
                        })
                    )
                )
            )
        )
    );
}

function HometownSelectionModal({ players, onChoose, isClosing }) {
    return React.createElement(
        "div",
        { className: `practice-modal-backdrop${isClosing ? " is-closing" : ""}`, role: "presentation" },
        React.createElement(
            "div",
            {
                className: "practice-modal",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "practice-hometown-title",
                style: { "--modal-background-image": `url("${MODAL_BACKGROUND}")` },
            },
            React.createElement("p", { className: "practice-modal-kicker" }, "Choose Your Home"),
            React.createElement("h2", { id: "practice-hometown-title" }, "Where Are You From?"),
            React.createElement(
                "div",
                { className: "practice-modal-star" },
                players.map((player, index) => {
                    const townCopy = getTownCopy(`#${player.name}`);
                    const styleCopy = FIGHTER_STYLE_COPY[player.name] || { style: "TBD", keyword: "TBD" };
                    const sigilSrc = getSchoolSigil(player.name);
                    const schoolLabel = townCopy.school.startsWith("The ") ? townCopy.school : `The ${townCopy.school}`;
                    const schoolClassName = `practice-hometown-option-school${player.name === "Fangmarsh" || player.name === "Leap-Creek" ? " is-compact" : ""}`;

                    return React.createElement(
                        "button",
                        {
                            key: `hometown-${player.id}`,
                            className: "practice-hometown-option",
                            type: "button",
                            disabled: isClosing,
                            onClick: () => onChoose(player.id),
                            style: {
                                left: HOMETOWN_MODAL_POSITIONS[index].x,
                                top: HOMETOWN_MODAL_POSITIONS[index].y,
                                "--hometown-accent": player.color,
                            },
                        },
                        sigilSrc
                            ? React.createElement("img", {
                                className: "practice-hometown-option-sigil",
                                src: sigilSrc,
                                alt: "",
                                "aria-hidden": "true",
                            })
                            : null,
                        React.createElement("p", { className: "practice-hometown-option-city" }, player.name),
                        React.createElement("p", { className: "practice-hometown-option-nickname" }, `"${townCopy.description}"`),
                        React.createElement("p", { className: schoolClassName }, schoolLabel),
                        React.createElement("p", { className: "practice-hometown-option-style" }, styleCopy.style),
                        React.createElement("p", { className: "practice-hometown-option-keyword" }, `Keyword: ${styleCopy.keyword}`)
                    );
                })
            )
        )
    );
}

function CombatantSummary({ fighter, toneClassName }) {
    return React.createElement(
        "article",
        { className: `practice-combatant-card ${toneClassName}` },
        React.createElement("p", { className: "practice-combatant-kicker" }, "Combatant"),
        React.createElement("h3", null, fighter.name),
        React.createElement(
            "div",
            { className: "practice-combatant-resource-grid" },
            React.createElement(
                "div",
                { className: "practice-combatant-resource" },
                React.createElement("p", { className: "practice-combatant-resource-label" }, "Hit Points"),
                React.createElement(
                    "div",
                    { className: "practice-form-points-row", "aria-label": `Hit Points ${fighter.hitPoints ?? 0} of 6` },
                    Array.from({ length: 6 }).map((_, index) =>
                        React.createElement("span", {
                            key: `combat-hit-${fighter.id}-${index}`,
                            className: `practice-form-point${index < (fighter.hitPoints ?? 0) ? " is-filled" : ""}`,
                            "aria-hidden": "true",
                        })
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "practice-combatant-resource" },
                React.createElement("p", { className: "practice-combatant-resource-label" }, "Form Points"),
                React.createElement(
                    "div",
                    { className: "practice-form-points-row", "aria-label": `Form Points ${fighter.formPoints ?? 0} of 5` },
                    Array.from({ length: 5 }).map((_, index) =>
                        React.createElement("span", {
                            key: `combat-form-${fighter.id}-${index}`,
                            className: `practice-form-point${index < (fighter.formPoints ?? 0) ? " is-filled" : ""}`,
                            "aria-hidden": "true",
                        })
                    )
                )
            )
        )
    );
}

function CombatModal({ combatState, players, onAdvancePhase, onClose }) {
    const leftFighter = players.find((player) => player.id === combatState.attackerId) || null;
    const rightFighter = players.find((player) => player.id === combatState.defenderId) || null;
    const phase = COMBAT_PHASES[combatState.phaseIndex] || COMBAT_PHASES[0];

    if (!leftFighter || !rightFighter) {
        return null;
    }

    return React.createElement(
        "div",
        { className: "practice-modal-backdrop practice-combat-backdrop", role: "presentation" },
        React.createElement(
            "div",
            {
                className: "practice-modal practice-combat-modal",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "practice-combat-title",
            },
            React.createElement("p", { className: "practice-modal-kicker" }, `Clash ${combatState.clashNumber}`),
            React.createElement("h2", { id: "practice-combat-title" }, `${leftFighter.name} vs ${rightFighter.name}`),
            React.createElement(
                "div",
                { className: "practice-combat-phase-strip", "aria-label": "Combat phases" },
                COMBAT_PHASES.map((phaseItem, index) =>
                    React.createElement(
                        "div",
                        {
                            key: phaseItem.id,
                            className: `practice-combat-phase-chip${index === combatState.phaseIndex ? " is-active" : ""}${index < combatState.phaseIndex ? " is-complete" : ""}`,
                        },
                        React.createElement("span", { className: "practice-combat-phase-count" }, index + 1),
                        React.createElement("span", { className: "practice-combat-phase-name" }, phaseItem.title)
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "practice-combat-grid" },
                React.createElement(CombatantSummary, { fighter: leftFighter, toneClassName: "is-left-combatant" }),
                React.createElement(
                    "section",
                    { className: "practice-combat-phase-panel" },
                    React.createElement("p", { className: "practice-combat-phase-label" }, "Current Clash Step"),
                    React.createElement("h3", null, phase.title),
                    React.createElement("p", { className: "practice-combat-phase-copy" }, phase.copy),
                    React.createElement(
                        "div",
                        { className: "practice-combat-placeholder-grid" },
                        React.createElement(
                            "div",
                            { className: "practice-combat-placeholder-card" },
                            React.createElement("p", { className: "practice-combat-placeholder-label" }, leftFighter.name),
                            React.createElement("p", null, "Combat card selection, modal choice, and reveal UI will live here.")
                        ),
                        React.createElement(
                            "div",
                            { className: "practice-combat-placeholder-card" },
                            React.createElement("p", { className: "practice-combat-placeholder-label" }, rightFighter.name),
                            React.createElement("p", null, "Techniques, White Die reactions, and clash results plug into this flow next.")
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "practice-combat-actions" },
                        React.createElement(
                            "button",
                            {
                                className: "practice-combat-button is-secondary",
                                type: "button",
                                onClick: onClose,
                            },
                            "Close Combat"
                        ),
                        React.createElement(
                            "button",
                            {
                                className: "practice-combat-button is-primary",
                                type: "button",
                                onClick: onAdvancePhase,
                            },
                            combatState.phaseIndex === COMBAT_PHASES.length - 1 ? "Next Clash" : "Next Phase"
                        )
                    )
                ),
                React.createElement(CombatantSummary, { fighter: rightFighter, toneClassName: "is-right-combatant" })
            )
        )
    );
}

function ChallengeModal({ challengeState, players, onChooseTarget, onAccept, onDecline }) {
    const challenger = players.find((player) => player.id === challengeState.challengerId) || null;
    const opponents = challengeState.opponentIds
        .map((playerId) => players.find((player) => player.id === playerId) || null)
        .filter(Boolean);
    const target = challengeState.targetId
        ? players.find((player) => player.id === challengeState.targetId) || null
        : null;

    if (!challenger) {
        return null;
    }

    return React.createElement(
        "div",
        { className: "practice-modal-backdrop practice-combat-backdrop", role: "presentation" },
        React.createElement(
            "div",
            {
                className: "practice-modal practice-challenge-modal",
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "practice-challenge-title",
            },
            target
                ? React.createElement(
                    React.Fragment,
                    null,
                    React.createElement("p", { className: "practice-modal-kicker" }, "Challenge Response"),
                    React.createElement("h2", { id: "practice-challenge-title" }, `${challenger.name} challenges ${target.name}`),
                    React.createElement(
                        "p",
                        { className: "practice-combat-phase-copy" },
                        `${target.name} must decide whether to accept the fight. Declining drops Reputation by 1 rank.`
                    ),
                    React.createElement(
                        "div",
                        { className: "practice-combat-actions" },
                        React.createElement(
                            "button",
                            {
                                className: "practice-combat-button is-secondary",
                                type: "button",
                                onClick: onDecline,
                            },
                            "Decline Challenge"
                        ),
                        React.createElement(
                            "button",
                            {
                                className: "practice-combat-button is-primary",
                                type: "button",
                                onClick: onAccept,
                            },
                            "Accept Challenge"
                        )
                    )
                )
                : React.createElement(
                    React.Fragment,
                    null,
                    React.createElement("p", { className: "practice-modal-kicker" }, "Choose Opponent"),
                    React.createElement("h2", { id: "practice-challenge-title" }, `${challenger.name}, choose your target`),
                    React.createElement(
                        "div",
                        { className: "practice-challenge-options" },
                        opponents.map((opponent) =>
                            React.createElement(
                                "button",
                                {
                                    key: opponent.id,
                                    className: "practice-challenge-option",
                                    type: "button",
                                    onClick: () => onChooseTarget(opponent.id),
                                },
                                React.createElement("p", { className: "practice-combatant-kicker" }, "Opponent"),
                                React.createElement("strong", null, opponent.name),
                                React.createElement("span", null, `Reputation ${opponent.reputation}`)
                            )
                        )
                    )
                )
        )
    );
}

function getRosterEntries(players, startIndex) {
    return players.map((player, offset) => {
        const playerIndex = (startIndex + offset) % players.length;
        return {
            player: players[playerIndex],
            playerIndex,
        };
    });
}

const PLAYER_ACTIONS = [
    { id: "clockwise", label: "Travel", shapeClass: "is-arrow-cw", ariaLabel: "Travel clockwise" },
    { id: "counter-clockwise", label: "Travel", shapeClass: "is-arrow-ccw", ariaLabel: "Travel counter-clockwise" },
    { id: "roll", label: "Quest", shapeClass: "is-quest", ariaLabel: "Quest" },
    { id: "fight", label: "Fight", shapeClass: "is-fight" },
    { id: "heal", label: "Heal", shapeClass: "is-heal" },
    { id: "save-school", label: "Defend", shapeClass: "is-defend", ariaLabel: "Defend" },
];

const TRAVEL_ACTIONS = [PLAYER_ACTIONS[0], PLAYER_ACTIONS[1]];
const OTHER_PLAYER_ACTIONS = PLAYER_ACTIONS.slice(2);

function getOccupantStyle(locationType, count, index, color) {
    const positions = locationType === "road" ? ROAD_STAR_POSITIONS : TOWN_STAR_POSITIONS;
    const singlePosition = locationType === "road"
        ? { x: "50%", y: "18%" }
        : { x: "50%", y: "4%" };
    const position = count === 1 ? singlePosition : positions[index % positions.length];

    return {
        "--occupant-outline": color,
        left: position.x,
        top: position.y,
    };
}

function getSortedOccupants(players, position) {
    return players
        .filter((player) => player.alive && player.position === position)
        .sort((left, right) => left.arrivalOrder - right.arrivalOrder);
}

function PlayerCard({
    player,
    isActive,
    isWinner,
    actionsRemaining,
    interactionsLocked,
    pendingRoll,
    schoolStatus,
    canRollFate,
    canFight,
    canHeal,
    canSaveSchool,
    saveSchoolProgress,
    saveSchoolIsCompleting,
    actionIndicatorsRef,
    onRollFate,
    onFight,
    onHeal,
    onSaveSchool,
    onTravel,
}) {
    const sigilSrc = getSchoolSigil(player.name);
    const statusFaceSrc = getFighterStatusFace(player.alive ? (player.injured ? "injured" : "healthy") : "dead");
    const classes = `practice-roster-card${isActive ? " is-active" : ""}${isWinner ? " is-winner" : ""}`;
    const showSiegeFire = schoolStatus === SCHOOL_STATUS_SIEGED;

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
                React.createElement(
                    "div",
                    { className: "practice-roster-title-stack" },
                    React.createElement("p", { className: "practice-roster-player-name" }, "Player Name"),
                    isActive
                        ? React.createElement("p", { className: "practice-roster-light-of" }, "The Light of")
                        : null,
                    React.createElement(
                        "h3",
                        {
                            className: player.alive ? "" : "is-dead",
                        },
                        player.name
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "practice-roster-corner" },
                React.createElement("img", {
                    className: "practice-roster-status-face",
                    src: statusFaceSrc,
                    alt: player.alive ? (player.injured ? `${player.name} is injured` : `${player.name} is healthy`) : `${player.name} is dead`,
                }),
                sigilSrc
                    ? React.createElement(
                        "span",
                        { className: "practice-sigil-wrap" },
                        React.createElement("img", {
                            className: "practice-roster-sigil",
                            src: sigilSrc,
                            alt: `${player.name} school sigil`,
                        }),
                        React.createElement("img", {
                            className: `practice-siege-fire${showSiegeFire ? " is-visible" : ""}`,
                            src: FIRE_ICON,
                            alt: "",
                            "aria-hidden": "true",
                        })
                    )
                    : null
            )
        ),
        !player.alive
            ? React.createElement("p", { className: "practice-roster-location" }, "Dead")
            : null,
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
        isActive
            ? React.createElement(
                "div",
                { className: "practice-action-indicators" },
                React.createElement("p", { className: "practice-action-indicators-label" }, "Actions"),
                React.createElement(
                    "div",
                    {
                        className: "practice-action-indicators-row",
                        ref: actionIndicatorsRef,
                    },
                    Array.from({ length: actionsRemaining }).map((_, index) =>
                        React.createElement("span", {
                            key: `action-${player.id}-${index}`,
                            className: "practice-action-indicator",
                            "aria-label": `Action ${index + 1} remaining`,
                        })
                    )
                )
            )
            : null,
        isActive
            ? React.createElement(
                "div",
                { className: "practice-player-actions" },
                React.createElement(
                    "div",
                    { className: "practice-player-action-group is-travel-group" },
                    React.createElement(
                        "div",
                        { className: "practice-travel-buttons" },
                        TRAVEL_ACTIONS.map((action) =>
                            React.createElement(
                                "button",
                                {
                                    key: `${player.id}-${action.id}`,
                                    className: `practice-player-action-button ${action.id === "counter-clockwise" ? "is-left-travel" : ""}`,
                                    type: "button",
                                    "aria-label": action.ariaLabel || action.label,
                                    disabled: interactionsLocked,
                                    onClick: () => {
                                        if (pendingRoll === null) {
                                            onRollFate();
                                            return;
                                        }

                                        onTravel(action.id === "clockwise" ? CW_DIR_VALUE : CCW_DIR_VALUE);
                                    },
                                },
                                React.createElement("span", {
                                    className: `practice-player-action-shape ${action.shapeClass} is-image-arrow`,
                                    "aria-hidden": "true",
                                    style: { "--travel-icon": `url("${TRAVEL_ARROWS_ICON}")`, backgroundImage: `url("${TRAVEL_ARROWS_ICON}")` },
                                })
                            )
                        )
                    ),
                    React.createElement("span", { className: "practice-player-action-text" }, "Travel")
                ),
                OTHER_PLAYER_ACTIONS.map((action) => {
                    const isRollFateAction = action.id === "roll";
                    const isFightAction = action.id === "fight";
                    const isHealAction = action.id === "heal";
                    const isSaveSchoolAction = action.id === "save-school";
                    const isDisabled = isRollFateAction
                        ? !canRollFate || interactionsLocked
                        : isFightAction
                        ? !canFight || interactionsLocked
                        : isHealAction
                        ? !canHeal || interactionsLocked
                        : isSaveSchoolAction
                            ? !canSaveSchool || interactionsLocked
                            : true || interactionsLocked;
                    const buttonClassName = `practice-player-action-button${isSaveSchoolAction ? " is-save-school" : ""}${saveSchoolIsCompleting && isSaveSchoolAction ? " is-completing" : ""}`;

                    return React.createElement(
                        "button",
                        {
                            key: `${player.id}-${action.id}`,
                            className: buttonClassName,
                            type: "button",
                            "aria-label": action.ariaLabel || action.label,
                            disabled: isDisabled,
                            onClick: isRollFateAction
                                ? onRollFate
                                : isFightAction
                                ? onFight
                                : isHealAction
                                ? onHeal
                                : isSaveSchoolAction
                                    ? onSaveSchool
                                    : undefined,
                        },
                        React.createElement(
                            "span",
                            { className: "practice-player-action-main" },
                            React.createElement("span", {
                                className: `practice-player-action-shape ${action.shapeClass}${isSaveSchoolAction ? " is-image-defend" : ""}${isRollFateAction ? " is-image-quest" : ""}${isHealAction ? " is-image-heal" : ""}`,
                                "aria-hidden": "true",
                                style: isSaveSchoolAction
                                    ? { "--defend-icon": `url("${DEFEND_ICON}")`, backgroundImage: `url("${DEFEND_ICON}")` }
                                    : isHealAction
                                        ? { "--heal-icon": `url("${HEAL_ICON}")`, backgroundImage: `url("${HEAL_ICON}")` }
                                    : isRollFateAction
                                        ? { "--quest-icon": `url("${QUEST_ICON}")`, backgroundImage: `url("${QUEST_ICON}")` }
                                        : undefined,
                            }),
                            React.createElement("span", { className: "practice-player-action-text" }, action.label)
                        ),
                        isSaveSchoolAction
                            ? React.createElement(
                                "span",
                                {
                                    className: "practice-save-school-pips",
                                    "aria-hidden": "true",
                                },
                                Array.from({ length: 3 }).map((_, index) =>
                                    React.createElement("span", {
                                        key: `save-pip-${index}`,
                                        className: `practice-save-school-pip${index < saveSchoolProgress ? " is-filled" : ""}`,
                                    })
                                )
                            )
                            : null
                    );
                })
            )
            : null
    );
}

function BoardNode({ index, location, players, school }) {
    const sigilSrc = location.type === "town" ? getSchoolSigil(location.name) : "";
    const occupants = getSortedOccupants(players, index);
    const showSiegeFire = school?.status === SCHOOL_STATUS_SIEGED;
    const isDestroyed = school?.status === SCHOOL_STATUS_DESTROYED;

    return React.createElement(
        "div",
        {
            className: `practice-node practice-node-${location.type}`,
            style: getTrackStyle(index, location.hue),
        },
        React.createElement(
            "div",
            { className: "practice-node-core" },
            location.type === "town" && sigilSrc
                ? React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                        "span",
                        { className: `practice-sigil-wrap${isDestroyed ? " is-destroyed" : ""}` },
                        React.createElement("img", {
                            className: `practice-node-sigil${isDestroyed ? " is-destroyed" : ""}`,
                            src: sigilSrc,
                            alt: `${location.name} sigil`,
                        }),
                        React.createElement("img", {
                            className: `practice-siege-fire${showSiegeFire ? " is-visible" : ""}`,
                            src: FIRE_ICON,
                            alt: "",
                            "aria-hidden": "true",
                        })
                    ),
                    React.createElement("span", { className: "practice-node-label" }, location.name)
                )
                : null
        ),
        occupants.length > 0
            ? React.createElement(
                "div",
                { className: "practice-node-occupants" },
                occupants.map((player) =>
                    React.createElement("span", {
                        key: `${location.id}-${player.id}`,
                        className: `practice-occupant${player.injured ? " is-injured" : ""}`,
                        title: player.name,
                        style: getOccupantStyle(location.type, occupants.length, occupants.indexOf(player), player.color),
                    })
                )
            )
            : null
    );
}

function SchoolCard({ school }) {
    const accent = school.status === SCHOOL_STATUS_DESTROYED
        ? "#8f3c3c"
        : school.status === SCHOOL_STATUS_SIEGED
            ? "#c88d2a"
            : "#d7b372";
    const statusLabel = school.status === SCHOOL_STATUS_DESTROYED
        ? "Destroyed"
        : school.status === SCHOOL_STATUS_SIEGED
            ? school.isCompletingSave
                ? "Sieged • Rescue complete"
                : `Sieged • ${school.saveProgress}/3 saved`
            : "Whole";

    return React.createElement(
        "article",
        {
            className: "practice-effect-card",
            style: { "--accent": accent },
        },
        React.createElement("h3", null, school.name),
        React.createElement("p", null, statusLabel)
    );
}

function copyRect(rect) {
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
    };
}

function isSingleTurnRotation(previousOrder, nextOrder) {
    return (
        previousOrder.length > 1
        && previousOrder.length === nextOrder.length
        && previousOrder[0] === nextOrder[nextOrder.length - 1]
        && previousOrder.slice(1).every((playerId, index) => playerId === nextOrder[index])
    );
}

function animateWrappedRosterItem(node, previousRect, previousSnapshot) {
    const ghostNode = previousSnapshot ? previousSnapshot.cloneNode(true) : node.cloneNode(true);
    const ghostActionIndicators = ghostNode.querySelector(".practice-action-indicators");

    if (ghostActionIndicators) {
        ghostActionIndicators.style.opacity = "0";
    }

    ghostNode.style.position = "fixed";
    ghostNode.style.top = `${previousRect.top}px`;
    ghostNode.style.left = `${previousRect.left}px`;
    ghostNode.style.width = `${previousRect.width}px`;
    ghostNode.style.height = `${previousRect.height}px`;
    ghostNode.style.margin = "0";
    ghostNode.style.pointerEvents = "none";
    ghostNode.style.zIndex = "9999";

    document.body.appendChild(ghostNode);

    const fadeOut = ghostNode.animate(
        [
            { opacity: 1, transform: "scale(1)" },
            { opacity: 0, transform: "scale(0.96)" },
        ],
        {
            duration: 280,
            easing: "ease",
            fill: "forwards",
        }
    );

    node.animate(
        [
            { opacity: 0, transform: "scale(0.96)" },
            { opacity: 1, transform: "scale(1)" },
        ],
        {
            duration: 320,
            delay: 180,
            easing: "ease",
            fill: "both",
        }
    );

    fadeOut.finished.finally(() => {
        ghostNode.remove();
    });
}

function createActionIndicatorGhost() {
    const ghost = document.createElement("span");
    ghost.className = "practice-action-indicator is-ghost";
    ghost.setAttribute("aria-hidden", "true");
    return ghost;
}

function PracticeGame() {
    const [players, setPlayers] = React.useState(createInitialPlayers);
    const [schools, setSchools] = React.useState(createSchools);
    const [currentPlayerIndex, setCurrentPlayerIndex] = React.useState(0);
    const [actionsRemaining, setActionsRemaining] = React.useState(() => getActionsForPlayer(createInitialPlayers()[0]));
    const [nextArrivalOrder, setNextArrivalOrder] = React.useState(createPlayers().length);
    const [pendingRoll, setPendingRoll] = React.useState(null);
    const [battleLog, setBattleLog] = React.useState([]);
    const [winnerId, setWinnerId] = React.useState(null);
    const [gameOverReason, setGameOverReason] = React.useState("");
    const [isResolvingAction, setIsResolvingAction] = React.useState(false);
    const [challengeState, setChallengeState] = React.useState(null);
    const [combatState, setCombatState] = React.useState(null);
    const [selectedProfilePlayerId, setSelectedProfilePlayerId] = React.useState(null);
    const [showHometownModal, setShowHometownModal] = React.useState(false);
    const [isClosingHometownModal, setIsClosingHometownModal] = React.useState(false);

    const currentPlayer = players[currentPlayerIndex];
    const selectedProfilePlayer = players.find((player) => player.id === selectedProfilePlayerId) || null;
    const winner = players.find((player) => player.id === winnerId) || null;
    const currentLocation = currentPlayer ? TRACK_DETAILS[currentPlayer.position] : TRACK_DETAILS[0];
    const currentTownCopy = getTownCopy(currentLocation.id);
    const livingPlayers = getAlivePlayers(players);
    const rosterEntries = getRosterEntries(players, currentPlayerIndex);
    const currentSchool = currentLocation && isTown(currentLocation.id)
        ? getSchoolById(schools, currentLocation.id)
        : null;
    const currentPlayerCanRollFate = Boolean(
        currentPlayer?.alive
        && pendingRoll === null
    );
    const currentPlayerRivals = currentPlayer ? getRivalsAtPosition(players, currentPlayerIndex) : [];
    const currentPlayerCanFight = Boolean(
        currentPlayer?.alive
        && currentPlayerRivals.length > 0
        && !combatState
        && !challengeState
    );
    const currentPlayerCanHeal = Boolean(currentPlayer?.injured && currentLocation && isTown(currentLocation.id));
    const currentPlayerCanSaveSchool = Boolean(
        currentPlayer?.alive
        && currentSchool
        && currentSchool.status === SCHOOL_STATUS_SIEGED
        && !currentSchool.isCompletingSave
    );
    const rosterRefs = React.useRef(new Map());
    const previousRosterRects = React.useRef(new Map());
    const previousRosterOrder = React.useRef([]);
    const previousRosterSnapshots = React.useRef(new Map());
    const saveCompletionTimeouts = React.useRef(new Map());
    const actionIndicatorsRefs = React.useRef(new Map());
    const actionAnimationTimeoutRef = React.useRef(null);
    const hometownModalTimeoutRef = React.useRef(null);
    const rosterOrderKey = rosterEntries.map(({ player }) => player.id).join(",");
    const currentSaveSchoolProgress = currentSchool?.saveProgress || 0;
    const currentSaveSchoolIsCompleting = Boolean(currentSchool?.isCompletingSave);

    React.useEffect(() => {
        if (winnerId || gameOverReason || players.length === 0 || livingPlayers.length === 0) {
            return;
        }

        if (currentPlayer?.alive) {
            return;
        }

        const nextPlayerIndex = getNextLivingIndex(players, Number.isInteger(currentPlayerIndex) ? currentPlayerIndex : -1);
        const nextPlayer = players[nextPlayerIndex];

        if (!nextPlayer?.alive) {
            return;
        }

        setCurrentPlayerIndex(nextPlayerIndex);
        setActionsRemaining(getActionsForPlayer(nextPlayer));
        setPendingRoll(null);
        setIsResolvingAction(false);
    }, [currentPlayer, currentPlayerIndex, gameOverReason, livingPlayers.length, players, winnerId]);

    React.useEffect(() => {
        if (players.length === 0) {
            return;
        }

        if (showHometownModal && selectedProfilePlayerId === null) {
            return;
        }

        if (players.some((player) => player.id === selectedProfilePlayerId)) {
            return;
        }

        setSelectedProfilePlayerId(players[0].id);
    }, [players, selectedProfilePlayerId, showHometownModal]);

    function chooseHometown(playerId) {
        setSelectedProfilePlayerId(playerId);
        setIsClosingHometownModal(true);
        window.clearTimeout(hometownModalTimeoutRef.current);
        hometownModalTimeoutRef.current = window.setTimeout(() => {
            setShowHometownModal(false);
            setIsClosingHometownModal(false);
            hometownModalTimeoutRef.current = null;
        }, 1000);
    }

    React.useEffect(() => () => {
        if (hometownModalTimeoutRef.current !== null) {
            window.clearTimeout(hometownModalTimeoutRef.current);
        }
    }, []);

    React.useLayoutEffect(() => {
        const nextRects = new Map();
        const nextOrder = rosterEntries.map(({ player }) => player.id);
        const wrappedPlayerId = isSingleTurnRotation(previousRosterOrder.current, nextOrder)
            ? previousRosterOrder.current[0]
            : null;

        rosterEntries.forEach(({ player }) => {
            const node = rosterRefs.current.get(player.id);

            if (node) {
                nextRects.set(player.id, copyRect(node.getBoundingClientRect()));
            }
        });

        nextRects.forEach((nextRect, playerId) => {
            const previousRect = previousRosterRects.current.get(playerId);

            if (!previousRect) {
                return;
            }

            const node = rosterRefs.current.get(playerId);

            if (!node) {
                return;
            }

            if (wrappedPlayerId === playerId) {
                animateWrappedRosterItem(node, previousRect, previousRosterSnapshots.current.get(playerId));
                return;
            }

            if (previousRect.top === nextRect.top) {
                return;
            }

            node.animate(
                [
                    { transform: `translateY(${previousRect.top - nextRect.top}px)` },
                    { transform: "translateY(0)" },
                ],
                {
                    duration: 1000,
                    easing: "ease",
                }
            );
        });

        const nextSnapshots = new Map();

        rosterEntries.forEach(({ player }) => {
            const node = rosterRefs.current.get(player.id);

            if (node) {
                nextSnapshots.set(player.id, node.cloneNode(true));
            }
        });

        previousRosterRects.current = nextRects;
        previousRosterOrder.current = nextOrder;
        previousRosterSnapshots.current = nextSnapshots;
    }, [rosterOrderKey]);

    React.useLayoutEffect(() => {
        actionIndicatorsRefs.current.forEach((rowNode) => {
            if (!rowNode) {
                return;
            }

            rowNode.querySelectorAll(".practice-action-indicator").forEach((indicatorNode) => {
                indicatorNode.getAnimations().forEach((animation) => {
                    animation.cancel();
                });
            });
        });
    }, [actionsRemaining, currentPlayerIndex, winnerId, gameOverReason]);

    function appendLog(message) {
        setBattleLog((existing) => [message].concat(existing));
    }

    React.useEffect(() => () => {
        if (actionAnimationTimeoutRef.current) {
            window.clearTimeout(actionAnimationTimeoutRef.current);
        }
        saveCompletionTimeouts.current.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        saveCompletionTimeouts.current.clear();
    }, []);

    function clearSaveCompletionTimeouts() {
        saveCompletionTimeouts.current.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        saveCompletionTimeouts.current.clear();
    }

    function clearActionAnimationTimeout() {
        if (actionAnimationTimeoutRef.current) {
            window.clearTimeout(actionAnimationTimeoutRef.current);
            actionAnimationTimeoutRef.current = null;
        }
    }

    function queueSchoolSaveCompletion(schoolId) {
        const existingTimeout = saveCompletionTimeouts.current.get(schoolId);

        if (existingTimeout) {
            window.clearTimeout(existingTimeout);
        }

        const timeoutId = window.setTimeout(() => {
            setSchools((existingSchools) => existingSchools.map((school) => (
                school.id === schoolId
                    ? {
                        ...school,
                        saveProgress: 0,
                        isCompletingSave: false,
                    }
                    : school
            )));
            saveCompletionTimeouts.current.delete(schoolId);
        }, 500);

        saveCompletionTimeouts.current.set(schoolId, timeoutId);
    }

    function consumeActionWithIndicators(onAfterAnimation, refundedActions = 0) {
        const actionCount = actionsRemaining;
        const rowNode = currentPlayer ? actionIndicatorsRefs.current.get(currentPlayer.id) : null;
        const finish = () => {
            clearActionAnimationTimeout();
            onAfterAnimation();
            setIsResolvingAction(false);
        };

        setIsResolvingAction(true);

        if (!rowNode) {
            finish();
            return;
        }

        const indicators = Array.from(rowNode.querySelectorAll(".practice-action-indicator"));
        const indicatorGap = parseFloat(window.getComputedStyle(rowNode).gap || "8");

        if (actionCount === 1 && refundedActions > 0 && indicators.length >= 1) {
            const overlay = document.createElement("span");
            const rightGhost = createActionIndicatorGhost();
            const leftGhost = createActionIndicatorGhost();
            const indicatorWidth = indicators[0].getBoundingClientRect().width;
            const centerDelta = (indicatorWidth + indicatorGap) / 2;

            overlay.className = "practice-action-indicator-overlay";
            overlay.setAttribute("aria-hidden", "true");
            overlay.append(leftGhost, rightGhost);
            rowNode.appendChild(overlay);
            rowNode.style.opacity = "0";

            rightGhost.animate(
                [
                    { transform: "translate(-50%, -50%)", opacity: 1 },
                    { transform: `translate(calc(-50% + ${centerDelta}px), -50%)`, opacity: 1, offset: 0.2 },
                    { transform: `translate(calc(-50% + ${centerDelta}px), -50%)`, opacity: 1, offset: 0.36 },
                    { transform: `translate(calc(-50% + ${centerDelta}px), -50%) scale(0)`, opacity: 0 },
                ],
                {
                    duration: 620,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            leftGhost.animate(
                [
                    { transform: `translate(calc(-50% - ${centerDelta}px), -50%) scale(0)`, opacity: 0 },
                    { transform: `translate(calc(-50% - ${centerDelta}px), -50%) scale(1)`, opacity: 1, offset: 0.2 },
                    { transform: `translate(calc(-50% - ${centerDelta}px), -50%) scale(1)`, opacity: 1, offset: 0.36 },
                    { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
                ],
                {
                    duration: 620,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            actionAnimationTimeoutRef.current = window.setTimeout(() => {
                rowNode.style.opacity = "";
                overlay.remove();
                finish();
            }, 620);
            return;
        }

        if (actionCount > 1 && indicators.length >= 2) {
            const [leftIndicator, rightIndicator] = indicators;
            const leftBounds = leftIndicator.getBoundingClientRect();
            const rightBounds = rightIndicator.getBoundingClientRect();
            const centerDelta = (rightBounds.left - leftBounds.left) / 2;

            leftIndicator.animate(
                [
                    { transform: "translateX(0)", opacity: 1 },
                    { transform: `translateX(${centerDelta}px)`, opacity: 1 },
                ],
                {
                    duration: 500,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            rightIndicator.animate(
                [
                    { transform: "scale(1)", opacity: 1 },
                    { transform: "scale(0)", opacity: 0 },
                ],
                {
                    duration: 500,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            actionAnimationTimeoutRef.current = window.setTimeout(finish, 500);
            return;
        }

        if (actionCount === 1 && indicators.length >= 1) {
            indicators[0].animate(
                [
                    { transform: "scale(1)", opacity: 1 },
                    { transform: "scale(0)", opacity: 0 },
                ],
                {
                    duration: 250,
                    easing: "ease",
                    fill: "forwards",
                }
            );

            actionAnimationTimeoutRef.current = window.setTimeout(finish, 250);
            return;
        }

        finish();
    }

    function finalizeAction(updatedPlayers, updatedSchools, logEntries, refundedActions = 0) {
        consumeActionWithIndicators(() => {
            const nextActionsRemaining = Math.max(0, actionsRemaining - 1 + refundedActions);

            setPlayers(updatedPlayers);
            setSchools(updatedSchools);
            logEntries.forEach((entry) => appendLog(entry));
            setPendingRoll(null);

            if (nextActionsRemaining > 0) {
                setActionsRemaining(nextActionsRemaining);
                return;
            }

            const aliveAfterTurn = getAlivePlayers(updatedPlayers);

            if (aliveAfterTurn.length === 0) {
                setActionsRemaining(0);
                setGameOverReason("Every challenger is dead. The Silver Wolf remains undefeated.");
                return;
            }

            const turnLogs = [];
            const schoolsBeforeTurn = updatedSchools.map((school) => ({ ...school }));
            const schoolsStillStanding = advanceSilverWolf(updatedSchools, turnLogs);
            const destroyedSchoolCountBefore = schoolsBeforeTurn.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
            const destroyedSchoolCountAfter = updatedSchools.filter((school) => school.status === SCHOOL_STATUS_DESTROYED).length;
            const newlyDestroyedSchoolIds = updatedSchools
                .filter((school) => (
                    school.status === SCHOOL_STATUS_DESTROYED
                    && getSchoolById(schoolsBeforeTurn, school.id)?.status !== SCHOOL_STATUS_DESTROYED
                ))
                .map((school) => school.id);

            if (destroyedSchoolCountAfter > destroyedSchoolCountBefore) {
                updatedPlayers.forEach((player) => {
                    lowerReputation(player, destroyedSchoolCountAfter - destroyedSchoolCountBefore);
                });
            }

            if (newlyDestroyedSchoolIds.length > 0) {
                updatedPlayers.forEach((player) => {
                    const currentLocationId = TRACK_DETAILS[player.position]?.id;

                    if (!player.alive || player.injured || !newlyDestroyedSchoolIds.includes(currentLocationId)) {
                        return;
                    }

                    player.injured = true;
                    turnLogs.push(`${player.name} is caught in the fall of ${getSchoolEventLabel(getSchoolById(updatedSchools, currentLocationId))} and becomes Injured.`);
                });
            }

            turnLogs.forEach((entry) => appendLog(entry));

            if (!schoolsStillStanding) {
                setActionsRemaining(0);
                setGameOverReason("The Silver Wolf destroyed all five schools. The valley was not protected.");
                return;
            }

            const nextPlayerIndex = getNextLivingIndex(updatedPlayers, currentPlayerIndex);
            setCurrentPlayerIndex(nextPlayerIndex);
            setActionsRemaining(getActionsForPlayer(updatedPlayers[nextPlayerIndex]));
        }, refundedActions);
    }

    function resetGame() {
        clearActionAnimationTimeout();
        clearSaveCompletionTimeouts();
        setIsResolvingAction(false);
        setPlayers(createInitialPlayers());
        setSchools(createSchools());
        setCurrentPlayerIndex(0);
        setActionsRemaining(getActionsForPlayer(createInitialPlayers()[0]));
        setNextArrivalOrder(createPlayers().length);
        setPendingRoll(null);
        setWinnerId(null);
        setGameOverReason("");
        setBattleLog([]);
        setChallengeState(null);
        setCombatState(null);
        setSelectedProfilePlayerId(null);
        setShowHometownModal(false);
        setIsClosingHometownModal(false);
    }

    function openCombatModal() {
        if (
            winnerId
            || gameOverReason
            || !currentPlayer?.alive
            || actionsRemaining < 1
            || isResolvingAction
            || combatState
            || challengeState
            || currentPlayerRivals.length === 0
        ) {
            return;
        }

        setChallengeState({
            challengerId: currentPlayer.id,
            opponentIds: currentPlayerRivals.map((player) => player.id),
            targetId: currentPlayerRivals.length === 1 ? currentPlayerRivals[0].id : null,
        });
    }

    function advanceCombatPhase() {
        setCombatState((existing) => {
            if (!existing) {
                return existing;
            }

            if (existing.phaseIndex >= COMBAT_PHASES.length - 1) {
                return {
                    ...existing,
                    clashNumber: existing.clashNumber + 1,
                    phaseIndex: 0,
                };
            }

            return {
                ...existing,
                phaseIndex: existing.phaseIndex + 1,
            };
        });
    }

    function closeCombatModal() {
        setCombatState(null);
    }

    function chooseChallengeTarget(targetId) {
        setChallengeState((existing) => (
            existing
                ? {
                    ...existing,
                    targetId,
                }
                : existing
        ));
    }

    function acceptChallenge() {
        if (!challengeState?.targetId) {
            return;
        }

        consumeActionWithIndicators(() => {
            setPendingRoll(null);
            setChallengeState(null);
            setCombatState({
                attackerId: challengeState.challengerId,
                defenderId: challengeState.targetId,
                clashNumber: 1,
                phaseIndex: 0,
            });
            setActionsRemaining((existing) => Math.max(0, existing - 1));
        });
    }

    function declineChallenge() {
        if (!challengeState?.targetId) {
            return;
        }

        const challenger = players.find((player) => player.id === challengeState.challengerId);
        const target = players.find((player) => player.id === challengeState.targetId);

        consumeActionWithIndicators(() => {
            const updatedPlayers = players.map((player) => ({ ...player }));
            const declinedPlayer = updatedPlayers.find((player) => player.id === challengeState.targetId);

            if (declinedPlayer) {
                lowerReputation(declinedPlayer, 1);
            }

            setPlayers(updatedPlayers);
            setPendingRoll(null);
            setChallengeState(null);
            setActionsRemaining((existing) => Math.max(0, existing - 1));
            if (challenger && target) {
                appendLog(`${target.name} declines ${challenger.name}'s challenge and loses 1 Reputation.`);
            }
        });
    }

    function rollFate() {
        if (winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive || actionsRemaining < 1 || isResolvingAction) {
            return;
        }

        const result = Math.floor(Math.random() * 4) + 1;
        consumeActionWithIndicators(() => {
            setPendingRoll(result);
            setActionsRemaining((existing) => Math.max(0, existing - 1));
        });
    }

    function travel(direction) {
        if (winnerId || gameOverReason || pendingRoll === null || !currentPlayer?.alive || actionsRemaining < 1 || isResolvingAction) {
            return;
        }

        const directionLabel = direction === CW_DIR_VALUE ? "sunwise" : "widdershins";
        const updatedPlayers = players.map((player) => ({ ...player }));
        const updatedSchools = schools.map((school) => ({ ...school }));
        const activePlayer = updatedPlayers[currentPlayerIndex];
        const totalSteps = pendingRoll;
        const logEntries = [];

        activePlayer.position = normalizeIndex(activePlayer.position + (direction * totalSteps));
        activePlayer.arrivalOrder = nextArrivalOrder;
        setNextArrivalOrder(nextArrivalOrder + 1);

        const landing = TRACK_DETAILS[activePlayer.position];

        if (isTown(landing.id)) {
            const school = getSchoolById(updatedSchools, landing.id);
            logEntries.push(applyTownEffect(activePlayer, school, landing));
        } else {
            logEntries.push(applyRoadEncounter(activePlayer, landing));
        }

        finalizeAction(updatedPlayers, updatedSchools, logEntries);
    }

    function challengeSilverWolf() {
        if (winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive || !canChallengeSilverWolf(currentPlayer) || actionsRemaining < 1 || isResolvingAction) {
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
            logEntries.push(`${challenger.name} defeats the Silver Wolf in combat and wins Valley of the Silver Wolf.`);
            consumeActionWithIndicators(() => {
                setPlayers(updatedPlayers);
                setSchools(updatedSchools);
                setActionsRemaining(0);
                setWinnerId(challenger.id);
                logEntries.forEach((entry) => appendLog(entry));
            });
            return;
        }

        challenger.alive = false;
        logEntries.push(`The Silver Wolf kills ${challenger.name}. His kung fu was too strong.`);
        finalizeAction(updatedPlayers, updatedSchools, logEntries);
    }

    function healCurrentPlayer() {
        if (
            winnerId
            || gameOverReason
            || !currentPlayer?.alive
            || actionsRemaining < 1
            || !currentPlayerCanHeal
            || isResolvingAction
        ) {
            return;
        }

        const updatedPlayers = players.map((player) => ({ ...player }));
        const updatedSchools = schools.map((school) => ({ ...school }));
        const activePlayer = updatedPlayers[currentPlayerIndex];

        activePlayer.injured = false;
        finalizeAction(updatedPlayers, updatedSchools, [`${activePlayer.name} heals at ${currentLocation.name} and regains a second action.`], 1);
    }

    function saveCurrentSchool() {
        if (
            winnerId
            || gameOverReason
            || !currentPlayer?.alive
            || actionsRemaining < 1
            || !currentPlayerCanSaveSchool
            || isResolvingAction
        ) {
            return;
        }

        const updatedPlayers = players.map((player) => ({ ...player }));
        const updatedSchools = schools.map((school) => ({ ...school }));
        const school = getSchoolById(updatedSchools, currentLocation.id);

        if (!school || school.status !== SCHOOL_STATUS_SIEGED) {
            return;
        }

        const nextProgress = Math.min(3, (school.saveProgress || 0) + 1);

        school.saveProgress = nextProgress;
        school.defenders = school.defenders || [];

        if (!school.defenders.includes(currentPlayer.id)) {
            school.defenders = school.defenders.concat(currentPlayer.id);
        }

        if (nextProgress >= 3) {
            school.status = SCHOOL_STATUS_WHOLE;
            school.isCompletingSave = true;
            const defenderNames = updatedPlayers
                .filter((player) => school.defenders.includes(player.id))
                .map((player) => player.name);

            updatedPlayers.forEach((player) => {
                if (school.defenders.includes(player.id)) {
                    raiseReputation(player, 1);
                }
            });
            queueSchoolSaveCompletion(school.id);
            finalizeAction(
                updatedPlayers,
                updatedSchools,
                [`${formatNameList(defenderNames)} saved ${getSchoolEventLabel(school)}!`]
            );
            return;
        }

        finalizeAction(
            updatedPlayers,
            updatedSchools,
            [`${currentPlayer.name} defends ${getSchoolEventLabel(school)}. Progress is now ${nextProgress}/3.`]
        );
    }

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            "main",
            { className: "practice-shell" },
            React.createElement(
                "section",
                { className: "practice-hero" },
                React.createElement("h1", null, "Valley of the Silver Wolf")
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
                                school: location.type === "town" ? getSchoolById(schools, location.id) : null,
                            })
                        ),
                        React.createElement(
                            "button",
                            {
                                className: `practice-centerpiece${!winnerId && !gameOverReason && currentPlayer?.alive ? " is-active-turn" : ""}`,
                                type: "button",
                                onClick: challengeSilverWolf,
                                disabled: Boolean(winnerId || gameOverReason || pendingRoll !== null || !currentPlayer?.alive || !canChallengeSilverWolf(currentPlayer) || isResolvingAction || combatState || challengeState),
                                "aria-label": "Challenge the Silver Wolf",
                                style: { "--centerpiece-image": `url("${MOUNTAIN_ICON}")` },
                            },
                            React.createElement("span", { className: "practice-centerpiece-image", "aria-hidden": "true" }),
                            React.createElement("span", { className: "practice-centerpiece-overlay" }),
                            React.createElement(
                                "span",
                                { className: "practice-centerpiece-text" },
                                React.createElement("span", null, "Challenge the"),
                                React.createElement("span", null, "Silver Wolf")
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "practice-controls" },
                        React.createElement(
                            "div",
                            { className: "practice-turn-card" },
                            selectedProfilePlayer
                                ? React.createElement(FighterProfileCard, { player: selectedProfilePlayer })
                                : null
                        ),
                        React.createElement(
                            "div",
                            { className: "practice-log-card" },
                            React.createElement("h3", null, "Recent events"),
                            battleLog.length > 0
                                ? React.createElement(
                                    "ul",
                                    { className: "practice-log" },
                                    battleLog.map((entry, index) => React.createElement("li", { key: `log-${index}` }, entry))
                                )
                                : React.createElement("p", { className: "practice-log-empty" }, "No major events yet.")
                        )
                    )
                ),
                React.createElement(
                    "aside",
                    { className: "practice-sidebar" },
                    React.createElement("h2", null, "Fighters"),
                    React.createElement(
                        "div",
                        { className: "practice-roster-stack" },
                        rosterEntries.map(({ player, playerIndex }) =>
                            React.createElement(
                                "div",
                                {
                                    key: player.id,
                                    className: `practice-roster-item${selectedProfilePlayerId === player.id ? " is-selected" : ""}`,
                                    onClick: () => setSelectedProfilePlayerId(player.id),
                                    ref: (node) => {
                                        if (node) {
                                            rosterRefs.current.set(player.id, node);
                                        } else {
                                            rosterRefs.current.delete(player.id);
                                        }
                                    },
                                },
                                React.createElement(PlayerCard, {
                                    player,
                                    isActive: currentPlayerIndex === playerIndex && !winnerId && !gameOverReason,
                                    isWinner: winner ? winner.id === player.id : false,
                                    actionsRemaining,
                                    pendingRoll,
                                    interactionsLocked: currentPlayerIndex === playerIndex ? (isResolvingAction || Boolean(combatState) || Boolean(challengeState)) : false,
                                    schoolStatus: getSchoolByName(schools, player.name)?.status || SCHOOL_STATUS_WHOLE,
                                    canRollFate: currentPlayerIndex === playerIndex ? currentPlayerCanRollFate : false,
                                    canFight: currentPlayerIndex === playerIndex ? currentPlayerCanFight : false,
                                    canHeal: currentPlayerIndex === playerIndex ? currentPlayerCanHeal : false,
                                    canSaveSchool: currentPlayerIndex === playerIndex ? currentPlayerCanSaveSchool : false,
                                    saveSchoolProgress: currentPlayerIndex === playerIndex ? currentSaveSchoolProgress : 0,
                                    saveSchoolIsCompleting: currentPlayerIndex === playerIndex ? currentSaveSchoolIsCompleting : false,
                                    actionIndicatorsRef: currentPlayerIndex === playerIndex
                                        ? (node) => {
                                            if (node) {
                                                actionIndicatorsRefs.current.set(player.id, node);
                                            } else {
                                                actionIndicatorsRefs.current.delete(player.id);
                                            }
                                        }
                                        : undefined,
                                    onRollFate: rollFate,
                                    onFight: openCombatModal,
                                    onHeal: healCurrentPlayer,
                                    onSaveSchool: saveCurrentSchool,
                                    onTravel: travel,
                                })
                            )
                        )
                    )
                )
            )
        ),
        showHometownModal
            ? React.createElement(HometownSelectionModal, {
                players,
                onChoose: chooseHometown,
                isClosing: isClosingHometownModal,
            })
            : null,
        combatState
            ? React.createElement(CombatModal, {
                combatState,
                players,
                onAdvancePhase: advanceCombatPhase,
                onClose: closeCombatModal,
            })
            : null,
        challengeState
            ? React.createElement(ChallengeModal, {
                challengeState,
                players,
                onChooseTarget: chooseChallengeTarget,
                onAccept: acceptChallenge,
                onDecline: declineChallenge,
            })
            : null
    );
}

export function mountGame(rootElement) {
    if (!rootElement || !React || !ReactDOM || !ReactDOM.createRoot) {
        return;
    }

    ReactDOM.createRoot(rootElement).render(React.createElement(PracticeGame));
}
