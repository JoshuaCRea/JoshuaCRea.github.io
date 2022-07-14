const LOCATION_IDS = ["#Leap-Creek", "#roadLCBS", "#Blackstone", "#roadBSFM", "#Fangmarsh", "#roadFMUC", "#Underclaw", "#roadUCP", "#Pouch", "#roadPLC"];
const MULTIPLE_PLAYER_OCCUPIED_LOCATION_COLOR = '#fff700';
const UNOCCUPIED_LOCATION_COLOR = 'rgb(165, 143, 106)';
const CW_DIR_VALUE = 1
const CCW_DIR_VALUE = -1
const TOWN_DESCRIPTIONS = {
    "#Leap-Creek": {
        "Nickname": "The Water Temple",
        "School name": "Temple of T'ai Chi Chuan",
    },
    "#Blackstone": {
        "Nickname": "The Iron Fortress",
        "School name": "School of Hong Quan",
    },
    "#Fangmarsh": {
        "Nickname": "The Bog That Burns",
        "School name": "Kwoon of Pai Tong Long",
    },
    "#Underclaw": {
        "Nickname": "The Hidden City",
        "School name": "Kwoon of Changquan",
    },
    "#Pouch": {
        "Nickname": "Forest of Wine and Shadow",
        "School name": "School of Zui Quan",
    }
}

var playerInfo = {
    "p1": {
        "color": '#47c3ed',
        "locationIndex": 0,
        "townInfoId": "#p1TownInfo",
        "townSchoolId": "#p1TownSchool",
    },
    "p2": {
        "color": "gray",
        "locationIndex": 2,
        "townInfoId": "#p2TownInfo",
        "townSchoolId": "#p2TownSchool",
    },
    "p3": {
        "color": "crimson",
        "locationIndex": 4,
        "townInfoId": "#p3TownInfo",
        "townSchoolId": "#p3TownSchool",
    },
    "p4": {
        "color": "green",
        "locationIndex": 6,
        "townInfoId": "#p4TownInfo",
        "townSchoolId": "#p4TownSchool",
    },
    "p5": {
        "color": "blueviolet",
        "locationIndex": 8,
        "townInfoId": "#p5TownInfo",
        "townSchoolId": "#p5TownSchool",
    },
}

onPageLoad()

function onPageLoad() {
    setLocationColorBasedOnOccupancy();
    updateTownInfo();
}

function updateLocationIndex(directionValue, player) {
    playerInfo[player]["locationIndex"] = (((playerInfo[player]["locationIndex"] + directionValue) % LOCATION_IDS.length) + LOCATION_IDS.length) % LOCATION_IDS.length;
    updateLocationColors();
    updateTownInfo();
}

function updateLocationColors() {
    resetToDefaultColors();

    setLocationColorBasedOnOccupancy();

    LOCATION_IDS.forEach(locationId => {
        var counter = 0;
        Object.keys(playerInfo).forEach(player => {
            if (LOCATION_IDS[playerInfo[player]["locationIndex"]] == locationId) {
                counter++;
            }
        })
        if (counter > 1) {
            $(locationId).css('background-color', MULTIPLE_PLAYER_OCCUPIED_LOCATION_COLOR)
        }
    })
}

function updateTownInfo() {
    Object.keys(playerInfo).forEach(player => {
        var playerLocationId = LOCATION_IDS[playerInfo[player]["locationIndex"]]
        var townInfo = TOWN_DESCRIPTIONS[playerLocationId]
        if (townInfo == undefined) {
            var locationDescription = "The Valley of the Star";
            var locationSchoolName = "Wilderness";
        } else {
            var locationDescription = TOWN_DESCRIPTIONS[playerLocationId]["Nickname"]
            var locationSchoolName = TOWN_DESCRIPTIONS[playerLocationId]["School name"]
        }
        $(playerInfo[player]["townInfoId"]).html(locationDescription)
        $(playerInfo[player]["townSchoolId"]).html(locationSchoolName)
    })
}

function resetToDefaultColors() {
    $(".town").css('background-color', UNOCCUPIED_LOCATION_COLOR);
    $(".road").css('background-color', UNOCCUPIED_LOCATION_COLOR);
}

function setLocationColorBasedOnOccupancy() {
    Object.keys(playerInfo).forEach(player =>
        $(LOCATION_IDS[playerInfo[player]["locationIndex"]]).css('background-color', playerInfo[player]["color"]))
}

$("#p1MoveCwButton").click(function () { updateLocationIndex(CW_DIR_VALUE, "p1"); })
$("#p1MoveCcwButton").click(function () { updateLocationIndex(CCW_DIR_VALUE, "p1"); })

$("#p2MoveCwButton").click(function () { updateLocationIndex(CW_DIR_VALUE, "p2"); })
$("#p2MoveCcwButton").click(function () { updateLocationIndex(CCW_DIR_VALUE, "p2"); })

$("#p3MoveCwButton").click(function () { updateLocationIndex(CW_DIR_VALUE, "p3"); })
$("#p3MoveCcwButton").click(function () { updateLocationIndex(CCW_DIR_VALUE, "p3"); })

$("#p4MoveCwButton").click(function () { updateLocationIndex(CW_DIR_VALUE, "p4"); })
$("#p4MoveCcwButton").click(function () { updateLocationIndex(CCW_DIR_VALUE, "p4"); })

$("#p5MoveCwButton").click(function () { updateLocationIndex(CW_DIR_VALUE, "p5"); })
$("#p5MoveCcwButton").click(function () { updateLocationIndex(CCW_DIR_VALUE, "p5"); })