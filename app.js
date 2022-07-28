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
        "uninjured-pip": "https://ucarecdn.com/49ffa57b-e1c0-4056-9274-19d5310c6cb8/LC_U.png",
        "injured-pip": "https://ucarecdn.com/56cfe13f-8af4-40f5-9c8c-d6cc391ddeab/LC_I.png",
    },
    "p2": {
        "color": "gray",
        "locationIndex": 2,
        "townInfoId": "#p2TownInfo",
        "townSchoolId": "#p2TownSchool",
        "uninjured-pip": "https://ucarecdn.com/6eaaa1c1-65cf-4643-b467-2b38c500b3b5/",
        "injured-pip": "https://ucarecdn.com/2c4827a8-7afd-4097-abe7-9ba774939f7c/",
    },
    "p3": {
        "color": "crimson",
        "locationIndex": 4,
        "townInfoId": "#p3TownInfo",
        "townSchoolId": "#p3TownSchool",
        "uninjured-pip": "https://ucarecdn.com/75e57c34-19d3-4ef2-91b3-1cada752a016/FM_U.png",
        "injured-pip": "https://ucarecdn.com/897fcf02-6221-43c5-9f3d-afc5c5ffa9e1/FM_.png",
    },
    "p4": {
        "color": "green",
        "locationIndex": 6,
        "townInfoId": "#p4TownInfo",
        "townSchoolId": "#p4TownSchool",
        "uninjured-pip": "https://ucarecdn.com/1d425a95-52ea-4263-8561-cdc489daf6c2/UC_U.png",
        "injured-pip": "https://ucarecdn.com/48fb1241-13d4-49cf-b4c8-78102c143cb0/UC_I.png",
    },
    "p5": {
        "color": "blueviolet",
        "locationIndex": 8,
        "townInfoId": "#p5TownInfo",
        "townSchoolId": "#p5TownSchool",
        "uninjured-pip": "https://ucarecdn.com/3139c200-5857-4cfc-8bb0-6aea73d5bb8e/P_U.png",
        "injured-pip": "https://ucarecdn.com/59148b6f-0ffc-4b30-a9ab-abd2a098d194/P_I.png",
    },
}

onPageLoad()

function onPageLoad() {
    // setLocationColorBasedOnOccupancy();
    updateTownInfo();
    updatePips();
    console.log(playerInfo["p1"]["locationIndex"])
}

function updateLocationIndex(directionValue, player) {
    playerInfo[player]["locationIndex"] = (((playerInfo[player]["locationIndex"] + directionValue) % LOCATION_IDS.length) + LOCATION_IDS.length) % LOCATION_IDS.length;
}

// function updateLocationColors() {
//     resetToDefaultColors();

//     setLocationColorBasedOnOccupancy();

//     LOCATION_IDS.forEach(locationId => {
//         var counter = 0;
//         Object.keys(playerInfo).forEach(player => {
//             if (LOCATION_IDS[playerInfo[player]["locationIndex"]] == locationId) {
//                 counter++;
//             }
//         })
//         if (counter > 1) {
//             $(locationId).css('background-color', MULTIPLE_PLAYER_OCCUPIED_LOCATION_COLOR)
//         }
//     })
// }

function updatePips() {
    LOCATION_IDS.forEach(locationId => {
        Object.keys(playerInfo).forEach(player => {
            if (LOCATION_IDS[playerInfo[player]["locationIndex"]] == locationId) {
                $(locationId.overlay).html(playerInfo[player]["uninjured-pip"])
                console.log(locationId.overlay)
            }
        })
    //     if (counter > 1) {
    //         $(locationId).css('background-color', MULTIPLE_PLAYER_OCCUPIED_LOCATION_COLOR)
    //     }
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

// function resetToDefaultColors() {
//     $(".town").css('background-color', UNOCCUPIED_LOCATION_COLOR);
//     $(".road").css('background-color', UNOCCUPIED_LOCATION_COLOR);
// }

// function setLocationColorBasedOnOccupancy() {
//     Object.keys(playerInfo).forEach(player =>
//         $(LOCATION_IDS[playerInfo[player]["locationIndex"]]).css('background-color', playerInfo[player]["color"]))
// }

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