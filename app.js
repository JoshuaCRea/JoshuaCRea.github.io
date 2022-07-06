const LOCATION_IDS = ["#townA", "#roadAB", "#townB", "#roadBD", "#townD", "#roadCD", "#townC", "#roadAC"];
const OCCUPIED_LOCATION_COLOR = '#f8cf95';
const UNOCCUPIED_LOCATION_COLOR = '#ffffff';
const CW_DIR_VALUE = 1
const CCW_DIR_VALUE = -1

var currentLocationIndex = 0;

$(LOCATION_IDS[currentLocationIndex]).css('background-color', OCCUPIED_LOCATION_COLOR);

function updateLocationIndex(directionValue) {
    currentLocationIndex = currentLocationIndex + directionValue;
    if (currentLocationIndex == LOCATION_IDS.length) {
        currentLocationIndex = 0;
    }
    if (currentLocationIndex == -1) {
        currentLocationIndex = LOCATION_IDS.length - 1;
    }
}

function updateLocationColors(occupiedLocationId) {
    $(".town").css('background-color', UNOCCUPIED_LOCATION_COLOR);
    $(".road").css('background-color', UNOCCUPIED_LOCATION_COLOR);
    $(occupiedLocationId).css('background-color', OCCUPIED_LOCATION_COLOR);
}

$("#moveCwButton").click(function () {
    updateLocationIndex(CW_DIR_VALUE)
    updateLocationColors(LOCATION_IDS[currentLocationIndex]);
})

$("#moveCcwButton").click(function () {
    updateLocationIndex(CCW_DIR_VALUE)
    updateLocationColors(LOCATION_IDS[currentLocationIndex]);
})