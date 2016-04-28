// ==UserScript==
// @name        SteamGifts v2 Giveaway Filter
// @namespace   https://github.com/GarionCZ/sgv2-filter
// @description Giveaway filter for SteamGifts v2
// @author      Garion
// @include     http://www.steamgifts.com/
// @include     http://www.steamgifts.com/giveaways*
// @include     http://www.steamgifts.com/user/*
// @include     https://www.steamgifts.com/
// @include     https://www.steamgifts.com/giveaways*
// @include     https://www.steamgifts.com/user/*
// @downloadURL https://github.com/GarionCZ/sgv2-filter/raw/master/sgv2-filter.user.js
// @updateURL   https://github.com/GarionCZ/sgv2-filter/raw/master/sgv2-filter.meta.js
// @version     0.5.7-DEV
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

// Keys for persistent settings, the keys for different views also represent "page keys" used as certain parameters to make things more simple
var KEY_EXCLUDE_GROUP_GIVEAWAYS = "excludeGroupGiveaways";
var KEY_EXCLUDE_WHITELIST_GIVEAWAYS = "excludeWhitelistGiveaways";
var KEY_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS = "excludeRegionalGiveaways"
var KEY_EXCLUDE_PINNED_GIVEAWAYS = "excludePinnedGiveaways";
var KEY_ENABLE_FILTERING_BY_ENTRY_COUNT = "enableFilteringByEntryCount";
var KEY_MAX_NUMBER_OF_ENTRIES = "maxNumberOfEntries";
var KEY_MIN_LEVEL_TO_DISPLAY = "minLevelToDisplay";
var KEY_MAX_LEVEL_TO_DISPLAY = "maxLevelToDisplay";
var KEY_MIN_POINTS_TO_DISPLAY = "minPointsToDisplay";
var KEY_MAX_POINTS_TO_DISPLAY = "maxPointsToDisplay";
var KEY_APPLY_TO_ALL_GIVEAWAYS_VIEW = "applyToAllGiveawaysView";
var KEY_APPLY_TO_GROUP_GIVEAWAYS_VIEW = "applyToGroupGiveawaysView";
var KEY_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW = "applyToWishlistGiveawaysView";
var KEY_APPLY_TO_NEW_GIVEAWAYS_VIEW = "applyToNewGiveawaysView";
var KEY_APPLY_TO_USER_PROFILE_VIEW = "applyToUserProfileView";
var KEY_APPLY_TO_SEARCH_RESULTS_VIEW = "applyToSearchResultsView";
var KEY_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW = "applyToRecommendedGiveawaysView";
var KEY_REMOVE_PAGINATION = "removePagination";
var KEY_HIDE_ENTERED_GIVEAWAYS = "hideEnteredGiveaways_2";
var HIDE_ENTERED_GIVEAWAYS_CONSTANTS = ["No", "Yes", "Always"];

// Default values of persistent settings
var DEFAULT_EXCLUDE_GROUP_GIVEAWAYS = true;
var DEFAULT_EXCLUDE_WHITELIST_GIVEAWAYS = true;
var DEFAULT_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS = false;
var DEFAULT_EXCLUDE_PINNED_GIVEAWAYS = false;
var DEFAULT_ENABLE_FILTERING_BY_ENTRY_COUNT = true;
var DEFAULT_MAX_NUMBER_OF_ENTRIES = 200;
var DEFAULT_MIN_LEVEL_TO_DISPLAY = 0;
var DEFAULT_MAX_LEVEL_TO_DISPLAY = 10;
var DEFAULT_MIN_POINTS_TO_DISPLAY = 0;
var DEFAULT_MAX_POINTS_TO_DISPLAY = 150;
var DEFAULT_APPLY_TO_ALL_GIVEAWAYS_VIEW = true;
var DEFAULT_APPLY_TO_GROUP_GIVEAWAYS_VIEW = false;
var DEFAULT_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW = false;
var DEFAULT_APPLY_TO_NEW_GIVEAWAYS_VIEW = true;
var DEFAULT_APPLY_TO_USER_PROFILE_VIEW = false;
var DEFAULT_APPLY_TO_SEARCH_RESULTS_VIEW = false;
var DEFAULT_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW = false;
var DEFAULT_REMOVE_PAGINATION = true;
var DEFAULT_HIDE_ENTERED_GIVEAWAYS = HIDE_ENTERED_GIVEAWAYS_CONSTANTS[0];

// IDs of filter UI elements
var FILTER_CONTROLS_ID = "filterControls";
var FILTER_CAPTION_ID = "filterCaption";
var FILTER_DETAILS_ID = "filterDetails";
var FILTER_HIDE_ID = "filterHide";

// Does all the filtering
function filterGiveaways() {
  if (!isFilteringEnabledOnCurrentPage()) {
    // Since it's not enabled, remove any possible filtering
    var giveaways = getGiveaways();
    for ( i = 0; i < giveaways.length; i++) {
      removeFiltering(giveaways[i]);
    }
    handlePinnedBlock();
    return;
  }

  // Dirty hack to "fix" endless scrolling in SG++ when a lot of GAs on the same page got removed
  window.scrollBy(0, 1);
  window.scrollBy(0, -1);

  var minLevelToDisplay = GM_getValue(KEY_MIN_LEVEL_TO_DISPLAY, DEFAULT_MIN_LEVEL_TO_DISPLAY);
  var maxLevelToDisplay = GM_getValue(KEY_MAX_LEVEL_TO_DISPLAY, DEFAULT_MAX_LEVEL_TO_DISPLAY);
  var minPointsToDisplay = GM_getValue(KEY_MIN_POINTS_TO_DISPLAY, DEFAULT_MIN_POINTS_TO_DISPLAY);
  var maxPointsToDisplay = GM_getValue(KEY_MAX_POINTS_TO_DISPLAY, DEFAULT_MAX_POINTS_TO_DISPLAY);
  var excludeWhitelistGiveaways = GM_getValue(KEY_EXCLUDE_WHITELIST_GIVEAWAYS, DEFAULT_EXCLUDE_WHITELIST_GIVEAWAYS);
  var excludeGroupGiveaways = GM_getValue(KEY_EXCLUDE_GROUP_GIVEAWAYS, DEFAULT_EXCLUDE_GROUP_GIVEAWAYS);
  var excludeRegionRestrictedGiveaways = GM_getValue(KEY_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS, DEFAULT_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS);
  var excludePinnedGiveaways = GM_getValue(KEY_EXCLUDE_PINNED_GIVEAWAYS, DEFAULT_EXCLUDE_PINNED_GIVEAWAYS);
  var enableFilteringByEntryCount = GM_getValue(KEY_ENABLE_FILTERING_BY_ENTRY_COUNT, DEFAULT_ENABLE_FILTERING_BY_ENTRY_COUNT);
  var maxNumberOfEntries = GM_getValue(KEY_MAX_NUMBER_OF_ENTRIES, DEFAULT_MAX_NUMBER_OF_ENTRIES);
  var hideEnteredGiveaways = GM_getValue(KEY_HIDE_ENTERED_GIVEAWAYS, DEFAULT_HIDE_ENTERED_GIVEAWAYS);

  var giveawaysToRemove = [];
  var giveaways = getGiveaways();
  for ( i = 0; i < giveaways.length; i++) {
    // Remove the filtering
    removeFiltering(giveaways[i]);

    // Handle entered giveaways - ALWAYS option
    if (hideEnteredGiveaways === HIDE_ENTERED_GIVEAWAYS_CONSTANTS[2]) {
      if (isGiveawayEntered(giveaways[i])) {
        giveawaysToRemove.push(giveaways[i]);
        continue;
      }
    }

    // Handle whitelist giveaways
    if (excludeWhitelistGiveaways) {
      if (isGiveawayFromWhitelist(giveaways[i])) {
        continue;
      }
    }

    // Handle group giveaways
    if (excludeGroupGiveaways) {
      if (isGiveawayFromGroup(giveaways[i])) {
        continue;
      }
    }

    // Handle pinned giveaways
    if (excludePinnedGiveaways) {
      if (isGiveawayPinned(giveaways[i])) {
        continue;
      }
    }

    // Handle region-restricted giveaways
    if (excludeRegionRestrictedGiveaways) {
      if (isGiveawayRegionRestricted(giveaways[i])) {
        continue;
      }
    }

    // Handle entered giveaways - YES option
    if (hideEnteredGiveaways === HIDE_ENTERED_GIVEAWAYS_CONSTANTS[1]) {
      if (isGiveawayEntered(giveaways[i])) {
        giveawaysToRemove.push(giveaways[i]);
        continue;
      }
    }

    // Evaluate the contributor level
    var contributorLevel = getContributorLevel(giveaways[i]);
    if (contributorLevel < minLevelToDisplay || contributorLevel > maxLevelToDisplay) {
      giveawaysToRemove.push(giveaways[i]);
      continue;
    }

    // Evaluate the points
    var points = getPoints(giveaways[i]);
    if (points < minPointsToDisplay || points > maxPointsToDisplay) {
      giveawaysToRemove.push(giveaways[i]);
      continue;
    }

    // Handle entry-count filtering
    if (enableFilteringByEntryCount) {
      var numberOfEntries = getNumberOfEntries(giveaways[i]);
      if (numberOfEntries > maxNumberOfEntries) {
        giveawaysToRemove.push(giveaways[i]);
        continue;
      }
    }
  }

  // Remove the giveaways
  for ( i = 0; i < giveawaysToRemove.length; i++) {
    giveawaysToRemove[i].style.display = "none";
  }

  // Handle the pinned giveaways block
  handlePinnedBlock();

  handlePagination();

  // Dirty hack to "fix" endless scrolling in SG++ when a lot of GAs on the same page got removed
  window.scrollBy(0, 1);
  window.scrollBy(0, -1);

}

// Parses the giveaway elements from the whole page
function getGiveaways() {
  var giveawaysSgpp = document.getElementsByClassName("SGPP__gridTile");
  var giveaways = document.getElementsByClassName("giveaway__row-outer-wrap");
  var allGiveaways = [];
  allGiveaways.push.apply(allGiveaways, giveawaysSgpp);
  allGiveaways.push.apply(allGiveaways, giveaways);
  return allGiveaways;
}

// Returns true if the giveaway is for a whitelist, false otherwise
function isGiveawayFromWhitelist(giveaway) {
  return giveaway.getElementsByClassName("giveaway__column--whitelist").length > 0;
}

// Returns true if the giveaway is for a group, false otherwise
function isGiveawayFromGroup(giveaway) {
  return giveaway.getElementsByClassName("giveaway__column--group").length > 0;
}

// Returns true if the giveaway is region-restricted, false otherwise
function isGiveawayRegionRestricted(giveaway) {
  return giveaway.getElementsByClassName("giveaway__column--region-restricted").length > 0;
}

// Returns true if the giveaway is pinned, false otherwise
function isGiveawayPinned(giveaway) {
  var outerParent = giveaway.parentElement.parentElement;
  return outerParent.className === "pinned-giveaways__outer-wrap";
}

function isGiveawayEntered(giveaway) {
  return giveaway.getElementsByClassName("giveaway__row-inner-wrap is-faded").length > 0 ||
    giveaway.className === "SGPP__gridTile is-faded";
}

// Returns the contributor level of a giveaway, return 0 if no level is specified
function getContributorLevel(giveaway) {
  var contributorLevels = [];

  var contributorLevelsPositive = giveaway.getElementsByClassName("giveaway__column--contributor-level giveaway__column--contributor-level--positive");
  var contributorLevelsNegative = giveaway.getElementsByClassName("giveaway__column--contributor-level giveaway__column--contributor-level--negative");
  contributorLevels.push.apply(contributorLevels, contributorLevelsPositive);
  contributorLevels.push.apply(contributorLevels, contributorLevelsNegative);

  if (contributorLevels.length === 0) {
    return 0;
  }

  var contributorLevel = contributorLevels[0].innerHTML;

  var substringStart = 0;
  // Remove the "Level " at the start of the string, if present (SG++ grid view doesn't have it)
  if (contributorLevel.indexOf("Level ") === 0) {
    substringStart = 6;
  }

  // Parse the level, remove the "+" from the end
  var level = contributorLevel.substring(substringStart, contributorLevel.length - 1);

  return parseInt(level);
}



// Returns the points of a giveaway
function getPoints(giveaway) {
  var pointsEle = giveaway.getElementsByClassName("giveaway__heading__thin");
  // Since the points are the last element in a giveaway, just take the last item if available
  if (pointsEle.length > 0) {
    var pointsTxt = pointsEle[pointsEle.length-1].innerHTML;

    var substringStart = 0;
    // Remove the "(" at the start of the string, if present (SG++ grid view doesn't have it)
    if (pointsTxt.indexOf("(") === 0) {
      substringStart = 1;
    }

    // Parse the points, remove the "P)" from the end
    var points = pointsTxt.substring(substringStart, pointsTxt.length - 2);

    return parseInt(points);
  }

  // SG++ GridView
  pointsEle = giveaway.getElementsByClassName("SGPP__gridTileInfo global__image-outer-wrap");
  if (pointsEle.length > 0) {
    // Go through the element and find the points part, can't really find it any easier since the elements have no IDs and no classes
    var pointsTxt = pointsEle[0].children[2].children[1].children[0].innerHTML;

    // Parse the points, remove the "P" from the end
    var points = pointsTxt.substring(0, pointsTxt.length - 1);
    return parseInt(points);
  }

  // If nothing could be parsed, return 0
  return 0;

}

// Parses the number of entries for a giveaway
function getNumberOfEntries(giveaway) {
  // Parse from SGv2 layout
  var spanElements = giveaway.getElementsByTagName("span");
  var copies = 1;
  for ( j = 0; j < spanElements.length; j++) {
    if (spanElements[j].innerHTML.indexOf("Copies") != -1) {
      copies = parseInt(spanElements[j].innerHTML.substring(1, spanElements[j].innerHTML.indexOf(" ")).replace(",", ""));
    }
    if (spanElements[j].innerHTML.indexOf("entr") != -1) {
      return parseInt(spanElements[j].innerHTML.substring(0, spanElements[j].innerHTML.indexOf(" ")).replace(",", "")) / copies;
    }
  }

  // Parse from SG++ grid layout
  var divElements = giveaway.getElementsByTagName("div");
  for ( j = 0; j < divElements.length; j++) {
    if (divElements[j].style.cssFloat == "left" && divElements[j].innerHTML.indexOf("ntr") != -1) {
      var strongElements = divElements[j].getElementsByTagName("strong");
      // Just pick first, there is only one anyway
      if (strongElements.length > 0) {
        return parseInt(strongElements[0].innerHTML.replace(",", ""));
      }
    }
  }
}

// Removes filtering from a given giveaway
function removeFiltering(giveaway) {
  giveaway.style.display = "";
}

// Hides the pinned block completely if all the giveaways got filtered, shows it if it contains at least one giveaway
function handlePinnedBlock() {
  var pinnedBlocks = document.getElementsByClassName("pinned-giveaways__outer-wrap");

  // No pinned giveaways
  if (pinnedBlocks.length === 0) {
    return;
  }

  var pinnedGiveaways = pinnedBlocks[0].getElementsByClassName("giveaway__row-outer-wrap");
  var giveawayRemaining = false;

  for ( i = 0; i < pinnedGiveaways.length; i++) {
    if (pinnedGiveaways[i].style.display !== "none") {
      giveawayRemaining = true;
      break;
    }
  }

  if (giveawayRemaining) {
    pinnedBlocks[0].style.display = "";
  } else {
    pinnedBlocks[0].style.display = "none";
  }

}

var giveawayOrder = 1;
// Handles the pagination. Moves the GAs in SG++ grid layout into one grid if pagination should be removed
function handlePagination() {
  var removePagination = GM_getValue(KEY_REMOVE_PAGINATION, DEFAULT_REMOVE_PAGINATION);

  // Handle the pagination itself, leave the last pagination element in place (the magical -2 in the loop condition)
  var paginationDivs = document.getElementsByClassName("table__heading");
  for ( i = 0; i < paginationDivs.length - 2; i++) {
    if (removePagination) {
      paginationDivs[i].style.display = "none";
    } else {
      paginationDivs[i].style.display = "";
    }
  }

  // GAs should be moved to the first gridview if using the SG++ GA grid view
  var sgppGridviews = document.getElementsByClassName("SGPP__gridView");
  if (sgppGridviews.length > 0) {
    // Tag the giveaways
    for ( i = 0; i < sgppGridviews.length; i++) {
      var sgppGiveawayDivs = sgppGridviews[i].getElementsByClassName("SGPP__gridTile");
      var pageNumber = getSgppPageNumber(sgppGridviews[i]);
      for ( j = 0; j < sgppGiveawayDivs.length; j++) {
        if (sgppGiveawayDivs[j].dataset.originalPage === undefined) {
          sgppGiveawayDivs[j].dataset.originalPage = pageNumber;
        }
        if (sgppGiveawayDivs[j].dataset.order === undefined) {
          sgppGiveawayDivs[j].dataset.order = giveawayOrder++;
        }
      }
    }

    var sgppFirstGridview = sgppGridviews[0];
    for ( i = 0; i < sgppGridviews.length; i++) {
      if(getSgppPageNumber(sgppGridviews[i]) === 1) {
        sgppFirstGridview = sgppGridviews[i];
        break;
      }
    }

    if (removePagination) {
      // Move the GAs in SG++ grid layout to the first grid
      for ( i = 1; i < sgppGridviews.length; i++) {
        var currentGridview = sgppGridviews[i];
        var sgppGiveawayDivs = currentGridview.getElementsByClassName("SGPP__gridTile");
        for ( j = 0; j < sgppGiveawayDivs.length; j++) {
          var sgppGiveawayDiv = sgppGiveawayDivs[j];
          currentGridview.removeChild(sgppGiveawayDiv);
          insertGiveawayIntoGridview(sgppGiveawayDiv, sgppFirstGridview);
        }
      }
    } else {
      // Move the GAs back from the first grid to their respective page grids
      var sgppGiveawayDivs = sgppFirstGridview.getElementsByClassName("SGPP__gridTile");
      for ( i = 0; i < sgppGiveawayDivs.length; i++) {
        var sgppGiveawayDiv = sgppGiveawayDivs[i];
        var originalPage = parseInt(sgppGiveawayDiv.dataset.originalPage);
        if (originalPage > 1) {
          sgppFirstGridview.removeChild(sgppGiveawayDiv);
          for ( j = 0; j < sgppGridviews.length; j++) {
            var pageNumber = getSgppPageNumber(sgppGridviews[j]);
            if (pageNumber === originalPage) {
              insertGiveawayIntoGridview(sgppGiveawayDiv, sgppGridviews[j]);
              break;
            }
          }
        }
      }
    }
  }
}

// Determines the page number from SG++ grid view
function getSgppPageNumber(sgppGridview) {
  var currentPage = sgppGridview.previousElementSibling.getElementsByClassName("endless_page")[0].innerHTML;
  var pageNumber = parseInt(currentPage.substring(5, currentPage.indexOf(" ", 6)));
  return pageNumber;
}

// Inserts a GA into specified gridview based on its dataset.order value
function insertGiveawayIntoGridview(giveaway, gridview) {
  var sgppSortedGiveawayDivs = gridview.getElementsByClassName("SGPP__gridTile");
  var inserted = false;
  for ( i = 0; i < sgppSortedGiveawayDivs.length; i++) {
    if (parseInt(sgppSortedGiveawayDivs[i].dataset.order) > parseInt(giveaway.dataset.order)) {
      gridview.insertBefore(giveaway, sgppSortedGiveawayDivs[i]);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    gridview.appendChild(giveaway);
  }
}

// Returns true if filtering is enabled on the current page, false otherwise
function isFilteringEnabledOnCurrentPage() {
  var applyToAllGiveawaysView = GM_getValue(KEY_APPLY_TO_ALL_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_ALL_GIVEAWAYS_VIEW);
  var applyToGroupGiveawaysView = GM_getValue(KEY_APPLY_TO_GROUP_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_GROUP_GIVEAWAYS_VIEW);
  var applyToWishlistGiveawaysView = GM_getValue(KEY_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW);
  var applyToNewGiveawaysView = GM_getValue(KEY_APPLY_TO_NEW_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_NEW_GIVEAWAYS_VIEW);
  var applyToUserProfileView = GM_getValue(KEY_APPLY_TO_USER_PROFILE_VIEW, DEFAULT_APPLY_TO_USER_PROFILE_VIEW);
  var applyToSearchResultsView = GM_getValue(KEY_APPLY_TO_SEARCH_RESULTS_VIEW, DEFAULT_APPLY_TO_SEARCH_RESULTS_VIEW);
  var applyToRecommendedView = GM_getValue(KEY_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW);

  if (applyToAllGiveawaysView && isCurrentPage(KEY_APPLY_TO_ALL_GIVEAWAYS_VIEW)) {
    return true;
  }

  if (applyToGroupGiveawaysView && isCurrentPage(KEY_APPLY_TO_GROUP_GIVEAWAYS_VIEW)) {
    return true;
  }

  if (applyToWishlistGiveawaysView && isCurrentPage(KEY_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW)) {
    return true;
  }

  if (applyToUserProfileView && isCurrentPage(KEY_APPLY_TO_USER_PROFILE_VIEW)) {
    return true;
  }

  if (applyToNewGiveawaysView && isCurrentPage(KEY_APPLY_TO_NEW_GIVEAWAYS_VIEW)) {
    return true;
  }

  if (applyToSearchResultsView && isCurrentPage(KEY_APPLY_TO_SEARCH_RESULTS_VIEW)) {
    return true;
  }

  if (applyToRecommendedView && isCurrentPage(KEY_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW)) {
    return true;
  }

  return false;
}

function isCurrentPage(pageKey) {
  var currentPage = window.location.href;
  if (pageKey === KEY_APPLY_TO_ALL_GIVEAWAYS_VIEW) {
    return (currentPage.indexOf("https://www.steamgifts.com/giveaways/search?page=") === 0
      || currentPage === "https://www.steamgifts.com" || currentPage === "https://www.steamgifts.com/"
      || currentPage === "https://www.steamgifts.com/giveaways"
      || currentPage.indexOf("http://www.steamgifts.com/giveaways/search?page=") === 0
      || currentPage === "http://www.steamgifts.com" || currentPage === "https://www.steamgifts.com/"
      || currentPage === "http://www.steamgifts.com/giveaways");
  }
  if (pageKey === KEY_APPLY_TO_GROUP_GIVEAWAYS_VIEW) {
    return (currentPage.indexOf("http://www.steamgifts.com/giveaways/search?type=group") === 0 || currentPage.indexOf("https://www.steamgifts.com/giveaways/search?type=group") === 0);
  }
  if (pageKey === KEY_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW) {
    return (currentPage.indexOf("http://www.steamgifts.com/giveaways/search?type=wishlist") === 0 || currentPage.indexOf("https://www.steamgifts.com/giveaways/search?type=wishlist") === 0);
  }
  if (pageKey === KEY_APPLY_TO_USER_PROFILE_VIEW) {
    return (currentPage.indexOf("http://www.steamgifts.com/user/") === 0 || currentPage.indexOf("https://www.steamgifts.com/user/") === 0);
  }
  if (pageKey === KEY_APPLY_TO_NEW_GIVEAWAYS_VIEW) {
    return (currentPage.indexOf("http://www.steamgifts.com/giveaways/search?type=new") === 0 || currentPage.indexOf("https://www.steamgifts.com/giveaways/search?type=new") === 0);
  }
  if (pageKey === KEY_APPLY_TO_SEARCH_RESULTS_VIEW) {
    return (currentPage.indexOf("http://www.steamgifts.com/giveaways/search?q") === 0 || currentPage.indexOf("https://www.steamgifts.com/giveaways/search?q") === 0);
  }
  if (pageKey === KEY_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW) {
    return (currentPage.indexOf("http://www.steamgifts.com/giveaways/search?type=recommended") === 0 || currentPage.indexOf("https://www.steamgifts.com/giveaways/search?type=recommended") === 0);
  }
  return false;
}

// Draws the filter UI into the SG page
(function drawUi() {
  // Create the filter details element and add content to it
  var detailsContentDiv = document.createElement("div");
  detailsContentDiv.setAttribute("class", 'pinned-giveaways__inner-wrap filterDetails');
  detailsContentDiv.appendChild(createFilterUiFilterOptionsRow());
  detailsContentDiv.appendChild(createFilterUiExcludeOptionsRow());
  detailsContentDiv.appendChild(createFilterUiEnabledPagesRow());
  detailsContentDiv.appendChild(createFilterUiOtherOptionsRow());

  var detailsDiv = document.createElement("div");
  detailsDiv.id = FILTER_DETAILS_ID;
  detailsDiv.style.display = "none";
  detailsDiv.appendChild(detailsContentDiv);
  detailsDiv.appendChild(createFilterUiHideFilterDetailsRow());

  // Create the filter UI element
  var controlsDiv = document.createElement("div");
  controlsDiv.setAttribute("id", FILTER_CONTROLS_ID);
  controlsDiv.setAttribute("class", 'pinned-giveaways__inner-wrap');

  controlsDiv.appendChild(createFilterUiCaptionRow());
  controlsDiv.appendChild(detailsDiv);

  // Add the filter UI to the correct place on the current page
  insertFilterUi(controlsDiv);
  updateFilterCaptionTextColor();

  // Append Stylesheet
  var filterCss = '.giveaway__row-outer-wrap[data-gridview*="sgpp_gridview"] {display: none;}\
    .filterDetails {margin: -1px -14px !important; border-radius: 0px !important;}\
    #filterDetails span {padding: 0 5px; font-size: 12px;}\
    #filterCaption {cursor: pointer; display: flex; border-top-left-radius: 4px; border-top-right-radius: 4px; font:700 14px/22px "Open Sans",sans-serif !important; margin: 0px -13px; padding: 5px 10px; border: none;}\
    #filterHide {border-top-right-radius: 0px; border-top-left-radius: 0px; margin: 1px -14px -1px; padding: 5px 0px; justify-content: center; cursor: pointer;}\
    #filterControls {margin-bottom: 5px; background-image: none;}\
    #filterControls select, #filterControls input {padding: 2px 4px;}\
    #filterHide.sidebar__navigation__item__link, #filterHide.sidebar__navigation__item__link:hover {border-top: none;}\
    .filterCheckbox {width: 13px; margin: 5px;}\
    .filterNumberInput {margin: 5px 0;}\
    .enableContainer, .excludeContainer {margin-top: 3px;}\
    .enableContainer.markdown hr, .excludeContainer.markdown hr, .filteringContainer.markdown hr {margin: 0px;}\
    .otherContainer {padding: 5px 0;}\
    .filteringContainer{padding-top: 1px;}\
    .flexLeft {display: flex; align-items: center; justify-content: flex-start; flex-grow: 1; flex-basis: 0px;}\
    .flexCenter {display: flex; align-items: center; justify-content: center; flex-grow: 1; flex-basis: 0px; margin-top: -1px;}\
    .flexRight {display: flex; align-items: center; justify-content: flex-end; flex-grow: 1; flex-basis: 0px;}\
    .help-tip {text-align: center; border-style: dotted; border-width: 1px; margin-left: 2px; margin-right: -5px; padding: 1px; cursor: help;}\
    .sidebar__shortcut-tooltip-absolute.tooltip {display: none; box-shadow: none; padding: 8px !important; margin-left: -275px; margin-top: 10px; width: 406px; line-height: 16px; -webkit-filter: saturate(0); filter: saturate(0); }\
    .sidebar__shortcut-tooltip-absolute, .table__row-outer-wrap {color:inherit;}\
    .help-tip:hover .sidebar__shortcut-tooltip-absolute.tooltip {display: block;}';

  var style = document.createElement('style');
  if (style.styleSheet) {
    style.styleSheet.cssText = filterCss;
  } else {
    style.appendChild(document.createTextNode(filterCss));
  }
  document.getElementsByTagName('head')[0].appendChild(style);

})();

// Creates the top-level caption that is visible all the time on a giveaway page
function createFilterUiCaptionRow() {
  var filterOptionsCaption = document.createElement("div");
  filterOptionsCaption.id = FILTER_CAPTION_ID;
  filterOptionsCaption.appendChild(document.createTextNode(getFilterCaption()));
  filterOptionsCaption.onclick = function() {
    // Clicking on the caption opens/closes the filter details UI
    var detailsDiv = document.getElementById(FILTER_DETAILS_ID);
    if (detailsDiv.style.display === "") {
      detailsDiv.style.display = "none";
    } else {
      detailsDiv.style.display = "";
    }
  };
  return filterOptionsCaption;
}

// Creates the row with filtering options (level, number of entries, ...)
function createFilterUiFilterOptionsRow() {
  var minLevelToDisplay = GM_getValue(KEY_MIN_LEVEL_TO_DISPLAY, DEFAULT_MIN_LEVEL_TO_DISPLAY);
  var maxLevelToDisplay = GM_getValue(KEY_MAX_LEVEL_TO_DISPLAY, DEFAULT_MAX_LEVEL_TO_DISPLAY);
  var minPointsToDisplay = GM_getValue(KEY_MIN_POINTS_TO_DISPLAY, DEFAULT_MIN_POINTS_TO_DISPLAY);
  var maxPointsToDisplay = GM_getValue(KEY_MAX_POINTS_TO_DISPLAY, DEFAULT_MAX_POINTS_TO_DISPLAY);
  var enableFilteringByEntryCount = GM_getValue(KEY_ENABLE_FILTERING_BY_ENTRY_COUNT, DEFAULT_ENABLE_FILTERING_BY_ENTRY_COUNT);
  var maxNumberOfEntries = GM_getValue(KEY_MAX_NUMBER_OF_ENTRIES, DEFAULT_MAX_NUMBER_OF_ENTRIES);

  // The "minimal level to display" number input
  var minLevelToDisplayInput = document.createElement("input");
  minLevelToDisplayInput.setAttribute("type", "number");
  minLevelToDisplayInput.setAttribute("maxLength", "2");
  minLevelToDisplayInput.setAttribute("class", "filterNumberInput");
  minLevelToDisplayInput.style.width = "55px";
  minLevelToDisplayInput.value = minLevelToDisplay;
  minLevelToDisplayInput.onchange = function() {
    // Filter out invalid values
    var minLevelToDisplayInputValue = parseInt(minLevelToDisplayInput.value);
    if (minLevelToDisplayInputValue < DEFAULT_MIN_LEVEL_TO_DISPLAY) {
      minLevelToDisplayInput.value = DEFAULT_MIN_LEVEL_TO_DISPLAY;
    } else if (minLevelToDisplayInputValue > maxLevelToDisplay) {
      minLevelToDisplayInput.value = maxLevelToDisplay;
    }
    // If the value changed, save it and update the UI
    if (minLevelToDisplay != minLevelToDisplayInput.value) {
      GM_setValue(KEY_MIN_LEVEL_TO_DISPLAY, minLevelToDisplayInput.value);
      minLevelToDisplay = minLevelToDisplayInput.value;
      updateFilterCaption();
      filterGiveaways();
    }
  };
  // Accept only digits
  minLevelToDisplayInput.onkeypress = function(event) {
    return isDigit(event.charCode);
  };

  // The "maximal level to display" number input
  var maxLevelToDisplayInput = document.createElement("input");
  maxLevelToDisplayInput.setAttribute("type", "number");
  maxLevelToDisplayInput.setAttribute("maxLength", "2");
  maxLevelToDisplayInput.style.width = "55px";
  maxLevelToDisplayInput.value = maxLevelToDisplay;
  maxLevelToDisplayInput.onchange = function() {
    // Filter out invalid values
    var maxLevelToDisplayInputValue = parseInt(maxLevelToDisplayInput.value);
    if (maxLevelToDisplayInputValue > DEFAULT_MAX_LEVEL_TO_DISPLAY) {
      maxLevelToDisplayInput.value = DEFAULT_MAX_LEVEL_TO_DISPLAY;
    } else if (maxLevelToDisplayInputValue < minLevelToDisplay) {
      maxLevelToDisplayInput.value = minLevelToDisplay;
    }
    // If the value changed, save it and update the UI
    if (maxLevelToDisplay != maxLevelToDisplayInput.value) {
      GM_setValue(KEY_MAX_LEVEL_TO_DISPLAY, maxLevelToDisplayInput.value);
      maxLevelToDisplay = maxLevelToDisplayInput.value;
      updateFilterCaption();
      filterGiveaways();
    }
  };
  // Accept only digits
  maxLevelToDisplayInput.onkeypress = function(event) {
    return isDigit(event.charCode);
  };

  // Create and add the level filter
  var showLevelSpan = document.createElement("span");
  showLevelSpan.appendChild(document.createTextNode("Show level:"));

  var levelDashSpan = document.createElement("span");
  levelDashSpan.appendChild(document.createTextNode("-"));

  var flexGrowLeftDiv = document.createElement("div");
  flexGrowLeftDiv.setAttribute("class", "flexLeft");
  flexGrowLeftDiv.appendChild(showLevelSpan);
  flexGrowLeftDiv.appendChild(minLevelToDisplayInput);
  flexGrowLeftDiv.appendChild(levelDashSpan);
  flexGrowLeftDiv.appendChild(maxLevelToDisplayInput);

  // The "minimal points to display" number input
  var minPointsToDisplayInput = document.createElement("input");
  minPointsToDisplayInput.setAttribute("type", "number");
  minPointsToDisplayInput.setAttribute("maxLength", "3");
  minPointsToDisplayInput.style.width = "62px";
  minPointsToDisplayInput.value = minPointsToDisplay;
  minPointsToDisplayInput.onchange = function() {
    // Filter out invalid values
    var minPointsToDisplayInputValue = parseInt(minPointsToDisplayInput.value);
    if (minPointsToDisplayInputValue < DEFAULT_MIN_POINTS_TO_DISPLAY) {
      minPointsToDisplayInput.value = DEFAULT_MIN_POINTS_TO_DISPLAY;
    } else if (minPointsToDisplayInputValue > maxPointsToDisplay) {
      minPointsToDisplayInput.value = maxPointsToDisplay;
    }
    // If the value changed, save it and update the UI
    if (minPointsToDisplay != minPointsToDisplayInput.value) {
      GM_setValue(KEY_MIN_POINTS_TO_DISPLAY, minPointsToDisplayInput.value);
      minPointsToDisplay = minPointsToDisplayInput.value;
      updateFilterCaption();
      filterGiveaways();
    }
  };
  // Accept only digits
  minPointsToDisplayInput.onkeypress = function(event) {
    return isDigit(event.charCode);
  };

  // The "maximal level to display" number input
  var maxPointsToDisplayInput = document.createElement("input");
  maxPointsToDisplayInput.setAttribute("type", "number");
  maxPointsToDisplayInput.setAttribute("maxLength", "3");
  maxPointsToDisplayInput.style.width = "62px";
  maxPointsToDisplayInput.value = maxPointsToDisplay;
  maxPointsToDisplayInput.onchange = function() {
    // Filter out invalid values
    var maxPointsToDisplayInputValue = parseInt(maxPointsToDisplayInput.value);
    if (maxPointsToDisplayInputValue > DEFAULT_MAX_POINTS_TO_DISPLAY) {
      maxPointsToDisplayInput.value = DEFAULT_MAX_POINTS_TO_DISPLAY;
    } else if (maxPointsToDisplayInputValue < minPointsToDisplay) {
      maxPointsToDisplayInput.value = minPointsToDisplay;
    }
    // If the value changed, save it and update the UI
    if (maxPointsToDisplay != maxPointsToDisplayInput.value) {
      GM_setValue(KEY_MAX_POINTS_TO_DISPLAY, maxPointsToDisplayInput.value);
      maxPointsToDisplay = maxPointsToDisplayInput.value;
      updateFilterCaption();
      filterGiveaways();
    }
  };
  // Accept only digits
  maxPointsToDisplayInput.onkeypress = function(event) {
    return isDigit(event.charCode);
  };

  // Create and add the points filter
  var showPointsSpan = document.createElement("span");
  showPointsSpan.appendChild(document.createTextNode("Points to enter:"));

  var pointsDashSpan = document.createElement("span");
  pointsDashSpan.appendChild(document.createTextNode("-"));

  var flexGrowCenterDiv = document.createElement("div");
  flexGrowCenterDiv.setAttribute("class", "flexCenter");
  flexGrowCenterDiv.appendChild(showPointsSpan);
  flexGrowCenterDiv.appendChild(minPointsToDisplayInput);
  flexGrowCenterDiv.appendChild(pointsDashSpan);
  flexGrowCenterDiv.appendChild(maxPointsToDisplayInput);

  // The "enable filtering by entry count" input checkbox
  var enableFilteringByEntryCountInput = document.createElement("input");
  enableFilteringByEntryCountInput.setAttribute("type", "checkbox");
  enableFilteringByEntryCountInput.setAttribute("class", "filterCheckbox");
  enableFilteringByEntryCountInput.checked = enableFilteringByEntryCount;
  enableFilteringByEntryCountInput.onclick = function() {
    // Upon value change, enable and recolor the entry count input
    GM_setValue(KEY_ENABLE_FILTERING_BY_ENTRY_COUNT, enableFilteringByEntryCountInput.checked);
    maxNumberOfEntriesInput.disabled = !enableFilteringByEntryCountInput.checked;
    maxNumberOfEntriesInput.readOnly = !enableFilteringByEntryCountInput.checked;
    if (!enableFilteringByEntryCountInput.checked) {
      maxNumberOfEntriesInput.style.opacity = "0.4";
    } else {
      maxNumberOfEntriesInput.style.opacity = maxNumberOfEntriesInputOriginalOpacity;
	  maxNumberOfEntriesInput.style.opacity = "1";
    }
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };

  // The "maximal number of entries" number input
  var maxNumberOfEntriesInput = document.createElement("input");
  maxNumberOfEntriesInput.setAttribute("type", "number");
  maxNumberOfEntriesInput.setAttribute("maxLength", "6");
  maxNumberOfEntriesInput.style.width = "90px";
  maxNumberOfEntriesInput.disabled = !enableFilteringByEntryCount;
  maxNumberOfEntriesInput.value = maxNumberOfEntries;
  maxNumberOfEntriesInput.readOnly = !enableFilteringByEntryCount;
  maxNumberOfEntriesInput.onchange = function() {
    // Limit the entry count filter to 1000000, should be enough for a while
    if (maxNumberOfEntriesInput.value < 0 || maxNumberOfEntriesInput.value > 1000000) {
      maxNumberOfEntriesInput.value = maxNumberOfEntries;
    } else if (maxNumberOfEntries != maxNumberOfEntriesInput.value) {
      // If the value changed, save it and update the UI
      GM_setValue(KEY_MAX_NUMBER_OF_ENTRIES, maxNumberOfEntriesInput.value);
      maxNumberOfEntries = maxNumberOfEntriesInput.value;
      updateFilterCaption();
      filterGiveaways();
      return;
    }
  };
  // Accept only digits
  maxNumberOfEntriesInput.onkeypress = function(event) {
    return isDigit(event.charCode);
  };

  var maxNumberOfEntriesInputOriginalOpacity = maxNumberOfEntriesInput.style.opacity;
  // Gray out the input text if disabled
  if (!enableFilteringByEntryCount) {
    maxNumberOfEntriesInput.style.opacity = "0.4";
  }

  // Create and add the entry count filter
  var entryFilteringEnabledSpan = document.createElement("span");
  entryFilteringEnabledSpan.appendChild(document.createTextNode("Entry count filtering"));

  var entryFilteringCountSpan = document.createElement("span");
  entryFilteringCountSpan.appendChild(document.createTextNode("Max # of entries:"));

  var flexGrowRightDiv = document.createElement("div");
  flexGrowRightDiv.setAttribute("class", "flexRight");
  flexGrowRightDiv.appendChild(entryFilteringEnabledSpan);
  flexGrowRightDiv.appendChild(enableFilteringByEntryCountInput);
  flexGrowRightDiv.appendChild(entryFilteringCountSpan);
  flexGrowRightDiv.appendChild(maxNumberOfEntriesInput);

  // Create the row itself
  var firstRow = document.createElement("div");
  firstRow.setAttribute("class", "flexCenter");
  firstRow.appendChild(flexGrowLeftDiv);
  firstRow.appendChild(flexGrowCenterDiv);
  firstRow.appendChild(flexGrowRightDiv);

  var row = document.createElement("div");
  var hr = document.createElement("hr");
  row.setAttribute("class", 'filteringContainer markdown');
  row.appendChild(firstRow);
  row.appendChild(hr);
  return row;
}

// Creates a row with the "exclude" options
function createFilterUiExcludeOptionsRow() {
  var excludeWhitelistGiveaways = GM_getValue(KEY_EXCLUDE_WHITELIST_GIVEAWAYS, DEFAULT_EXCLUDE_WHITELIST_GIVEAWAYS);
  var excludeGroupGiveaways = GM_getValue(KEY_EXCLUDE_GROUP_GIVEAWAYS, DEFAULT_EXCLUDE_GROUP_GIVEAWAYS);
  var excludePinnedGiveaways = GM_getValue(KEY_EXCLUDE_PINNED_GIVEAWAYS, DEFAULT_EXCLUDE_PINNED_GIVEAWAYS);
  var excludeRegionRestrictedGiveaways = GM_getValue(KEY_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS, DEFAULT_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS);

  // The "exlude group GAs" input checkbox
  var excludeGroupGiveawaysInput = document.createElement("input");
  excludeGroupGiveawaysInput.setAttribute("type", "checkbox");
  excludeGroupGiveawaysInput.setAttribute("class", "filterCheckbox");
  excludeGroupGiveawaysInput.checked = excludeGroupGiveaways;
  excludeGroupGiveawaysInput.onclick = function() {
    // Save the change and update the UI
    GM_setValue(KEY_EXCLUDE_GROUP_GIVEAWAYS, excludeGroupGiveawaysInput.checked);
    updateFilterCaption();
    filterGiveaways();
  };

  var excludeGroupGiveawaysSpan = document.createElement("span");
  excludeGroupGiveawaysSpan.appendChild(document.createTextNode("Exclude group giveaways"));

  // Create and add the group GAs exclusion element
  var flexGrowLeftDiv = document.createElement("div");
  flexGrowLeftDiv.setAttribute("class", "flexLeft");
  flexGrowLeftDiv.appendChild(excludeGroupGiveawaysSpan);
  flexGrowLeftDiv.appendChild(excludeGroupGiveawaysInput);

  // The "exlude whitelist GAs" input checkbox
  var excludeWhitelistGiveawaysInput = document.createElement("input");
  excludeWhitelistGiveawaysInput.setAttribute("type", "checkbox");
  excludeWhitelistGiveawaysInput.setAttribute("class", "filterCheckbox");
  excludeWhitelistGiveawaysInput.checked = excludeWhitelistGiveaways;
  excludeWhitelistGiveawaysInput.onclick = function() {
    // If the value changed, save it and update the UI
    GM_setValue(KEY_EXCLUDE_WHITELIST_GIVEAWAYS, excludeWhitelistGiveawaysInput.checked);
    updateFilterCaption();
    filterGiveaways();
  };

  var excludeWhitelistGiveawaysSpan = document.createElement("span");
  excludeWhitelistGiveawaysSpan.appendChild(document.createTextNode("Exclude whitelist giveaways"));

  // Create and add the whitelist GAs exclusion element
  var flexGrowCenterDiv = document.createElement("div");
  flexGrowCenterDiv.setAttribute("class", "flexCenter");
  flexGrowCenterDiv.appendChild(excludeWhitelistGiveawaysSpan);
  flexGrowCenterDiv.appendChild(excludeWhitelistGiveawaysInput);

  // The "exclude pinned giveaways" input checkbox
  var excludePinnedGiveawaysInput = document.createElement("input");
  excludePinnedGiveawaysInput.setAttribute("type", "checkbox");
  excludePinnedGiveawaysInput.setAttribute("class", "filterCheckbox");
  excludePinnedGiveawaysInput.checked = excludePinnedGiveaways;
  excludePinnedGiveawaysInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_EXCLUDE_PINNED_GIVEAWAYS, excludePinnedGiveawaysInput.checked);
    excludePinnedGiveaways = excludePinnedGiveawaysInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };

  var excludePinnedGiveawaysSpan = document.createElement("span");
  excludePinnedGiveawaysSpan.appendChild(document.createTextNode('Exclude pinned giveaways'));

  // Create and add the "exclude pinned giveaways" text
  var flexGrowRightDiv = document.createElement("div");
  flexGrowRightDiv.setAttribute("class", "flexRight");
  flexGrowRightDiv.appendChild(excludePinnedGiveawaysSpan);
  flexGrowRightDiv.appendChild(excludePinnedGiveawaysInput);

  // Create the first row
  var firstRow = document.createElement("div");
  firstRow.setAttribute("class", "flexCenter");
  firstRow.appendChild(flexGrowLeftDiv);
  firstRow.appendChild(flexGrowCenterDiv);
  firstRow.appendChild(flexGrowRightDiv);

  // The "exclude region-restricted giveaways" input checkbox
  var excludeRegionRestrictedGiveawaysInput = document.createElement("input");
  excludeRegionRestrictedGiveawaysInput.setAttribute("type", "checkbox");
  excludeRegionRestrictedGiveawaysInput.setAttribute("class", "filterCheckbox");
  excludeRegionRestrictedGiveawaysInput.checked = excludeRegionRestrictedGiveaways;
  excludeRegionRestrictedGiveawaysInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS, excludeRegionRestrictedGiveawaysInput.checked);
    excludeRegionRestrictedGiveaways = excludeRegionRestrictedGiveawaysInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };

  // Create and add the "exclude region-restricted giveaways" text
  var excludeRegionRestrictedGiveawaysSpan = document.createElement("span");
  excludeRegionRestrictedGiveawaysSpan.appendChild(document.createTextNode("Exclude region-restricted giveaways"));

  // Create the "exclude region-restricted giveaways" element itself
  flexGrowLeftDiv = document.createElement("div");
  flexGrowLeftDiv.setAttribute("class", "flexCenter");
  flexGrowLeftDiv.appendChild(excludeRegionRestrictedGiveawaysSpan);
  flexGrowLeftDiv.appendChild(excludeRegionRestrictedGiveawaysInput);

  // Create the second row in the filter details
  var secondRow = document.createElement("div");
  secondRow.setAttribute("class", "flexCenter");
  secondRow.appendChild(flexGrowLeftDiv);

  // Create the row itself
  var row = document.createElement("div");
  var hr = document.createElement("hr");
  row.setAttribute("class", 'excludeContainer markdown');
  row.appendChild(firstRow);
  row.appendChild(secondRow);
  row.appendChild(hr);
  return row;
}

// Creates the row with "enabled pages" settings
function createFilterUiEnabledPagesRow() {
  var applyToAllGiveawaysView = GM_getValue(KEY_APPLY_TO_ALL_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_ALL_GIVEAWAYS_VIEW);
  var applyToGroupGiveawaysView = GM_getValue(KEY_APPLY_TO_GROUP_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_GROUP_GIVEAWAYS_VIEW);
  var applyToWishlistGiveawaysView = GM_getValue(KEY_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW);
  var applyToNewGiveawaysView = GM_getValue(KEY_APPLY_TO_NEW_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_NEW_GIVEAWAYS_VIEW);
  var applyToUserProfileView = GM_getValue(KEY_APPLY_TO_USER_PROFILE_VIEW, DEFAULT_APPLY_TO_USER_PROFILE_VIEW);
  var applyToSearchResultsView = GM_getValue(KEY_APPLY_TO_SEARCH_RESULTS_VIEW, DEFAULT_APPLY_TO_SEARCH_RESULTS_VIEW);
  var applyToRecommendedGiveawaysView = GM_getValue(KEY_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW, DEFAULT_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW);

  // Create and add the "enable filtering on the main page" text
  var flexGrowLeftDiv = document.createElement("div");
  flexGrowLeftDiv.setAttribute("class", "flexLeft");
  var enableFilteringOnTheMainPageSpan = document.createElement("span");
  enableFilteringOnTheMainPageSpan.appendChild(document.createTextNode("Enable on the main page"));
  if (isCurrentPage(KEY_APPLY_TO_ALL_GIVEAWAYS_VIEW)) {
    enableFilteringOnTheMainPageSpan.appendChild(document.createTextNode(" (this page)"));
  }
  flexGrowLeftDiv.appendChild(enableFilteringOnTheMainPageSpan);

  // The "enable filtering on the main page" input checkbox
  var enableFilteringOnTheMainPageInput = document.createElement("input");
  enableFilteringOnTheMainPageInput.setAttribute("type", "checkbox");
  enableFilteringOnTheMainPageInput.setAttribute("class", "filterCheckbox");
  enableFilteringOnTheMainPageInput.checked = applyToAllGiveawaysView;
  enableFilteringOnTheMainPageInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_APPLY_TO_ALL_GIVEAWAYS_VIEW, enableFilteringOnTheMainPageInput.checked);
    applyToAllGiveawaysView = enableFilteringOnTheMainPageInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };
  flexGrowLeftDiv.appendChild(enableFilteringOnTheMainPageInput);

  // Create and add the "enable filtering on the new giveaways page" text
  var flexGrowCenterDiv = document.createElement("div");
  flexGrowCenterDiv.setAttribute("class", "flexCenter");
  var enableFilteringOnTheNewGiveawaysPageSpan = document.createElement("span");
  enableFilteringOnTheNewGiveawaysPageSpan.appendChild(document.createTextNode('Enable on the "new giveaways" page'));
  if (isCurrentPage(KEY_APPLY_TO_NEW_GIVEAWAYS_VIEW)) {
    enableFilteringOnTheNewGiveawaysPageSpan.appendChild(document.createTextNode(" (this page)"));
  }
  flexGrowCenterDiv.appendChild(enableFilteringOnTheNewGiveawaysPageSpan);

  // The "enable filtering on the new giveaways page" input checkbox
  var enableFilteringOnTheNewGiveawaysPageInput = document.createElement("input");
  enableFilteringOnTheNewGiveawaysPageInput.setAttribute("type", "checkbox");
  enableFilteringOnTheNewGiveawaysPageInput.setAttribute("class", "filterCheckbox");
  enableFilteringOnTheNewGiveawaysPageInput.checked = applyToNewGiveawaysView;
  enableFilteringOnTheNewGiveawaysPageInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_APPLY_TO_NEW_GIVEAWAYS_VIEW, enableFilteringOnTheNewGiveawaysPageInput.checked);
    applyToNewGiveawaysView = enableFilteringOnTheNewGiveawaysPageInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };
  flexGrowCenterDiv.appendChild(enableFilteringOnTheNewGiveawaysPageInput);

  // Create and add the "enable filtering on the search results" text
  var flexGrowRightDiv = document.createElement("div");
  flexGrowRightDiv.setAttribute("class", "flexRight");
  var enableFilteringOnTheSearchResultsPageSpan = document.createElement("span");
  enableFilteringOnTheSearchResultsPageSpan.appendChild(document.createTextNode('Enable on the "search results" page'));
  if (isCurrentPage(KEY_APPLY_TO_SEARCH_RESULTS_VIEW)) {
    enableFilteringOnTheSearchResultsPageSpan.appendChild(document.createTextNode(" (this page)"));
  }
  flexGrowRightDiv.appendChild(enableFilteringOnTheSearchResultsPageSpan);

  // The "enable filtering on the search results" input checkbox
  var enableFilteringOnTheSearchResultsPageInput = document.createElement("input");
  enableFilteringOnTheSearchResultsPageInput.setAttribute("type", "checkbox");
  enableFilteringOnTheSearchResultsPageInput.setAttribute("class", "filterCheckbox");
  enableFilteringOnTheSearchResultsPageInput.checked = applyToSearchResultsView;
  enableFilteringOnTheSearchResultsPageInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_APPLY_TO_SEARCH_RESULTS_VIEW, enableFilteringOnTheSearchResultsPageInput.checked);
    applyToSearchResultsView = enableFilteringOnTheSearchResultsPageInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };
  flexGrowRightDiv.appendChild(enableFilteringOnTheSearchResultsPageInput);

  // Create the first row in the filter details
  var firstRow = document.createElement("div");
  firstRow.setAttribute("class", "flexCenter");
  firstRow.appendChild(flexGrowLeftDiv);
  firstRow.appendChild(flexGrowCenterDiv);
  firstRow.appendChild(flexGrowRightDiv);

  // Create and add the "enable filtering on the wishlist giveaways page" text
  flexGrowLeftDiv = document.createElement("div");
  flexGrowLeftDiv.setAttribute("class", "flexLeft");
  var enableFilteringOnTheWishlistGiveawaysPageSpan = document.createElement("span");
  enableFilteringOnTheWishlistGiveawaysPageSpan.appendChild(document.createTextNode('Enable on the "wishlist giveaways" page'));
  if (isCurrentPage(KEY_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW)) {
    enableFilteringOnTheWishlistGiveawaysPageSpan.appendChild(document.createTextNode(" (this page)"));
  }
  flexGrowLeftDiv.appendChild(enableFilteringOnTheWishlistGiveawaysPageSpan);

  // The "enable filtering on the wishlist giveaways page" input checkbox
  var enableFilteringOnTheWishlistGiveawaysPageInput = document.createElement("input");
  enableFilteringOnTheWishlistGiveawaysPageInput.setAttribute("type", "checkbox");
  enableFilteringOnTheWishlistGiveawaysPageInput.setAttribute("class", "filterCheckbox");
  enableFilteringOnTheWishlistGiveawaysPageInput.checked = applyToWishlistGiveawaysView;
  enableFilteringOnTheWishlistGiveawaysPageInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_APPLY_TO_WISHLIST_GIVEAWAYS_VIEW, enableFilteringOnTheWishlistGiveawaysPageInput.checked);
    applyToWishlistGiveawaysView = enableFilteringOnTheWishlistGiveawaysPageInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };
  flexGrowLeftDiv.appendChild(enableFilteringOnTheWishlistGiveawaysPageInput);

  // Create and add the "enable filtering on the "group giveaways" page" text
  flexGrowCenterDiv = document.createElement("div");
  flexGrowCenterDiv.setAttribute("class", "flexCenter");
  var enableFilteringOnTheGroupGiveawaysPageSpan = document.createElement("span");
  enableFilteringOnTheGroupGiveawaysPageSpan.appendChild(document.createTextNode('Enable on the "group giveaways" page'));
  if (isCurrentPage(KEY_APPLY_TO_GROUP_GIVEAWAYS_VIEW)) {
    enableFilteringOnTheGroupGiveawaysPageSpan.appendChild(document.createTextNode(" (this page)"));
  }
  flexGrowCenterDiv.appendChild(enableFilteringOnTheGroupGiveawaysPageSpan);

  // The "enable filtering on the "group giveaways" page" page" input checkbox
  var enableFilteringOnTheGroupGiveawaysPageInput = document.createElement("input");
  enableFilteringOnTheGroupGiveawaysPageInput.setAttribute("type", "checkbox");
  enableFilteringOnTheGroupGiveawaysPageInput.setAttribute("class", "filterCheckbox");
  enableFilteringOnTheGroupGiveawaysPageInput.checked = applyToGroupGiveawaysView;
  enableFilteringOnTheGroupGiveawaysPageInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_APPLY_TO_GROUP_GIVEAWAYS_VIEW, enableFilteringOnTheGroupGiveawaysPageInput.checked);
    applyToGroupGiveawaysView = enableFilteringOnTheGroupGiveawaysPageInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };
  flexGrowCenterDiv.appendChild(enableFilteringOnTheGroupGiveawaysPageInput);

  // Create and add the "enable filtering on the user profile page" text
  flexGrowRightDiv = document.createElement("div");
  flexGrowRightDiv.setAttribute("class", "flexRight");
  var enableFilteringOnTheUserProfilePageSpan = document.createElement("span");
  enableFilteringOnTheUserProfilePageSpan.appendChild(document.createTextNode('Enable on the "user profile" page'));
  if (isCurrentPage(KEY_APPLY_TO_USER_PROFILE_VIEW)) {
    enableFilteringOnTheUserProfilePageSpan.appendChild(document.createTextNode(" (this page)"));
  }
  flexGrowRightDiv.appendChild(enableFilteringOnTheUserProfilePageSpan);

  // The "enable filtering on the user profile page" input checkbox
  var enableFilteringOnTheUserProfilePageInput = document.createElement("input");
  enableFilteringOnTheUserProfilePageInput.setAttribute("type", "checkbox");
  enableFilteringOnTheUserProfilePageInput.setAttribute("class", "filterCheckbox");
  enableFilteringOnTheUserProfilePageInput.checked = applyToUserProfileView;
  enableFilteringOnTheUserProfilePageInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_APPLY_TO_USER_PROFILE_VIEW, enableFilteringOnTheUserProfilePageInput.checked);
    applyToUserProfileView = enableFilteringOnTheUserProfilePageInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };
  flexGrowRightDiv.appendChild(enableFilteringOnTheUserProfilePageInput);

  // Create the second row in the filter details
  var secondRow = document.createElement("div");
  secondRow.setAttribute("class", "flexCenter");
  secondRow.appendChild(flexGrowLeftDiv);
  secondRow.appendChild(flexGrowCenterDiv);
  secondRow.appendChild(flexGrowRightDiv);

  // Create and add the "enable filtering on the wishlist giveaways page" text
  flexGrowCenterDiv = document.createElement("div");
  flexGrowCenterDiv.setAttribute("class", "flexCenter");
  var enableFilteringOnTheRecommendedGiveawaysPageSpan = document.createElement("span");
  enableFilteringOnTheRecommendedGiveawaysPageSpan.appendChild(document.createTextNode('Enable on the "recommended giveaways" page'));
  if (isCurrentPage(KEY_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW)) {
    enableFilteringOnTheRecommendedGiveawaysPageSpan.appendChild(document.createTextNode(" (this page)"));
  }
  flexGrowCenterDiv.appendChild(enableFilteringOnTheRecommendedGiveawaysPageSpan);

  // The "enable filtering on the wishlist giveaways page" input checkbox
  var enableFilteringOnTheRecommendedGiveawaysPageInput = document.createElement("input");
  enableFilteringOnTheRecommendedGiveawaysPageInput.setAttribute("type", "checkbox");
  enableFilteringOnTheRecommendedGiveawaysPageInput.setAttribute("class", "filterCheckbox");
  enableFilteringOnTheRecommendedGiveawaysPageInput.checked = applyToRecommendedGiveawaysView;
  enableFilteringOnTheRecommendedGiveawaysPageInput.onclick = function() {
    // Upon value change
    GM_setValue(KEY_APPLY_TO_RECOMMENDED_GIVEAWAYS_VIEW, enableFilteringOnTheRecommendedGiveawaysPageInput.checked);
    applyToRecommendedGiveawaysView = enableFilteringOnTheRecommendedGiveawaysPageInput.checked;
    // Update the main UI
    updateFilterCaption();
    filterGiveaways();
  };
  flexGrowCenterDiv.appendChild(enableFilteringOnTheRecommendedGiveawaysPageInput);

  // Create the third row in the filter details
  var thirdRow = document.createElement("div");
  thirdRow.setAttribute("class", "flexCenter");
  thirdRow.appendChild(flexGrowCenterDiv);

  // Create the row itself
  var row = document.createElement("div");
  var hr = document.createElement("hr");
  row.setAttribute("class", "enableContainer markdown");
  row.appendChild(firstRow);
  row.appendChild(secondRow);
  row.appendChild(thirdRow);
  row.appendChild(hr);
  return row;
}

// Creates a row with other options
function createFilterUiOtherOptionsRow() {
  var removePagination = GM_getValue(KEY_REMOVE_PAGINATION, DEFAULT_REMOVE_PAGINATION);
  var hideEnteredGiveaways = GM_getValue(KEY_HIDE_ENTERED_GIVEAWAYS, DEFAULT_HIDE_ENTERED_GIVEAWAYS);

  // The "remove pagination" input checkbox
  var removePaginationInput = document.createElement("input");
  removePaginationInput.setAttribute("type", "checkbox");
  removePaginationInput.setAttribute("class", "filterCheckbox");
  removePaginationInput.checked = removePagination;
  removePaginationInput.onclick = function() {
    // Save the change and update the UI
    GM_setValue(KEY_REMOVE_PAGINATION, removePaginationInput.checked);
    filterGiveaways();
  };

  var removePaginationSpan = document.createElement("span");
  removePaginationSpan.appendChild(document.createTextNode("Remove pagination"));

  // Create and add the group GAs exclusion element
  var flexGrowLeftDiv = document.createElement("div");
  flexGrowLeftDiv.setAttribute("class", "flexCenter");
  flexGrowLeftDiv.appendChild(removePaginationSpan);
  flexGrowLeftDiv.appendChild(removePaginationInput);

  // The "hide entered giveaways" input checkbox
  var hideEnteredGiveawaysSelect = document.createElement("select");
  for ( i = 0; i < HIDE_ENTERED_GIVEAWAYS_CONSTANTS.length; i++ ) {
    var option = document.createElement('option');
    option.value = option.textContent = HIDE_ENTERED_GIVEAWAYS_CONSTANTS[i];
    hideEnteredGiveawaysSelect.appendChild(option);
  }

  hideEnteredGiveawaysSelect.value = hideEnteredGiveaways;
  hideEnteredGiveawaysSelect.style.width = "75px";
  hideEnteredGiveawaysSelect.style.marginLeft = "9px";
  hideEnteredGiveawaysSelect.onchange = function() {
    // Save the change and update the UI
    var selectedValue = hideEnteredGiveawaysSelect.options[hideEnteredGiveawaysSelect.selectedIndex].value;
    GM_setValue(KEY_HIDE_ENTERED_GIVEAWAYS, selectedValue);
    filterGiveaways();
  };

  var hideEnteredGiveawaysSpan = document.createElement("span");
  hideEnteredGiveawaysSpan.appendChild(document.createTextNode("Hide entered giveaways"));
  var helpTooltip = document.createElement("div");
  var tooltip = document.createElement("span");

  tooltip.setAttribute("class", "sidebar__shortcut-tooltip-absolute tooltip");
  tooltip.appendChild(document.createTextNode('"Yes" hides entered giveaways, although exclusions still apply. "Always" hides entered giveaways no matter the other filter options.'));
  helpTooltip.setAttribute("class", "help-tip");
  helpTooltip.appendChild(document.createTextNode("?"));
  helpTooltip.appendChild(tooltip);

  // Create and add the group GAs exclusion element
  var flexGrowCenterDiv = document.createElement("div");
  flexGrowCenterDiv.setAttribute("class", "flexCenter");
  flexGrowCenterDiv.appendChild(hideEnteredGiveawaysSpan);
  flexGrowCenterDiv.appendChild(helpTooltip);
  flexGrowCenterDiv.appendChild(hideEnteredGiveawaysSelect);

  // Create the row itself
  var row = document.createElement("div");
  row.setAttribute("class", "otherContainer flexCenter");
  row.appendChild(flexGrowLeftDiv);
  row.appendChild(flexGrowCenterDiv);
  return row;
}

// Creates a row that hides the filter details
function createFilterUiHideFilterDetailsRow() {
  var hideControlsDiv = document.createElement("div");
  hideControlsDiv.id = FILTER_HIDE_ID;
  hideControlsDiv.setAttribute("class", 'pinned-giveaways__inner-wrap sidebar__navigation__item__link');
  hideControlsDiv.appendChild(document.createTextNode("Hide filter options"));
  hideControlsDiv.onclick = function() {
    // Hide the filter details
    var filterDetails = document.getElementById(FILTER_DETAILS_ID);
    if (filterDetails !== null) {
      filterDetails.style.display = "none";
    }
  };
  return hideControlsDiv;
}

function insertFilterUi(filterUi) {
  // Insert into main giveaway UI
  var elements = document.getElementsByClassName("pinned-giveaways__outer-wrap");
  if (elements.length > 0) {
    var parent = elements[0].parentElement;
    parent.insertBefore(filterUi, parent.childNodes[2]);
    return;
  }

  // Insert into the main giveaway UI if there are no pinned GAs
  elements = document.getElementsByClassName("page__heading");
  // Since "page__heading" is on multiple pages, a check needs to be done that user is on the correct page
  if (document.getElementsByClassName("featured__container").length > 0 && elements.length > 0) {
    var parent = elements[0].parentElement;
    parent.insertBefore(filterUi, parent.childNodes[1]);
    return;
  }

  // Insert into profile
  elements = document.getElementsByClassName("page__heading");
  // Since "page__heading" is on multiple pages, a check needs to be done that user is on the profile page
  if (isCurrentPage(KEY_APPLY_TO_USER_PROFILE_VIEW) && elements.length > 0) {
    var parent = elements[0].parentElement;
    parent.insertBefore(filterUi, parent.childNodes[2]);
    return;
  }
}

// Updates filter caption in the UI
function updateFilterCaption() {
  var filterCaptionDiv = document.getElementById(FILTER_CAPTION_ID);
  filterCaptionDiv.innerHTML = getFilterCaption();
  filterCaptionDiv.setAttribute("class", 'sidebar__navigation__item__name pinned-giveaways__inner-wrap sidebar__navigation__item__link');
  updateFilterCaptionTextColor();
}

// Updates filter caption text color based on the current filtering status
function updateFilterCaptionTextColor() {
  var filterCaptionDiv = document.getElementById(FILTER_CAPTION_ID);
  if (isFilteringEnabledOnCurrentPage()) {
    filterCaptionDiv.setAttribute("class", 'sidebar__navigation__item__name pinned-giveaways__inner-wrap sidebar__navigation__item__link');
  } else {
    filterCaptionDiv.setAttribute("class", 'sidebar__heading pinned-giveaways__inner-wrap sidebar__navigation__item__link');
  }
}

// Creates the text for the filter caption
function getFilterCaption() {
  var filterCaption = "Giveaway Filter";

  if (!isFilteringEnabledOnCurrentPage()) {
    return filterCaption;
  }

  // Add the level range to the caption
  var minLevelToDisplay = GM_getValue(KEY_MIN_LEVEL_TO_DISPLAY, DEFAULT_MIN_LEVEL_TO_DISPLAY);
  var maxLevelToDisplay = GM_getValue(KEY_MAX_LEVEL_TO_DISPLAY, DEFAULT_MAX_LEVEL_TO_DISPLAY);
  filterCaption += " (Level " + minLevelToDisplay + "-" + maxLevelToDisplay;

  // Add the maximal amount of entries to the caption
  var enableFilteringByEntryCount = GM_getValue(KEY_ENABLE_FILTERING_BY_ENTRY_COUNT, DEFAULT_ENABLE_FILTERING_BY_ENTRY_COUNT);
  if (enableFilteringByEntryCount) {
    var maxNumberOfEntries = GM_getValue(KEY_MAX_NUMBER_OF_ENTRIES, 200);
    filterCaption += ", Max " + maxNumberOfEntries + " entries";
  }

  // Add the points range to the caption
  var minPointsToDisplay = GM_getValue(KEY_MIN_POINTS_TO_DISPLAY, DEFAULT_MIN_POINTS_TO_DISPLAY);
  var maxPointsToDisplay = GM_getValue(KEY_MAX_POINTS_TO_DISPLAY, DEFAULT_MAX_POINTS_TO_DISPLAY);
  filterCaption += ", " + minPointsToDisplay + "-" + maxPointsToDisplay + " Points";

  // Add the excluded information to the caption
  var excludeWhitelistGiveaways = GM_getValue(KEY_EXCLUDE_WHITELIST_GIVEAWAYS, DEFAULT_EXCLUDE_WHITELIST_GIVEAWAYS);
  var excludeGroupGiveaways = GM_getValue(KEY_EXCLUDE_GROUP_GIVEAWAYS, DEFAULT_EXCLUDE_GROUP_GIVEAWAYS);
  var excludeRegionRestrictedGiveaways = GM_getValue(KEY_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS, DEFAULT_EXCLUDE_REGION_RESTRICTED_GIVEAWAYS);
  var excludePinnedGiveaways = GM_getValue(KEY_EXCLUDE_PINNED_GIVEAWAYS, DEFAULT_EXCLUDE_PINNED_GIVEAWAYS);
  var excluded = "";
  if (excludeGroupGiveaways) {
    excluded += "Group";
  }
  if (excludeWhitelistGiveaways) {
    if (excluded !== "") {
      excluded += "/";
    }
    excluded += "Whitelist";
  }
  if (excludePinnedGiveaways) {
    if (excluded !== "") {
      excluded += "/";
    }
    excluded += "Pinned";
  }
  if (excludeRegionRestrictedGiveaways) {
    if (excluded !== "") {
      excluded += "/";
    }
    excluded += "Regional";
  }
  if (excluded !== "") {
    excluded = ", " + excluded + " GAs excluded";
  }
  filterCaption += excluded;

  // Close it up and return
  filterCaption += ")";
  return filterCaption;
}

// Returns true if the character (its code) is a digit, false otherwise
function isDigit(charCode) {
  return charCode >= 48 && charCode <= 57;
}

// Function handling execution after DOM has been changed - makes the filtering work in endless scrolling of SG++
var observeDOM = (function() {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
      eventListenerSupported = window.addEventListener;

  return function(obj, callback) {
    if (MutationObserver) {
      // Define a new observer
      var obs = new MutationObserver(function(mutations, observer) {
        if (mutations[0].addedNodes.length || mutations[0].removedNodes.length)
          callback();
      });
      // Have the observer observe the registered element for changes in its children
      obs.observe(obj, {
        childList : true,
        subtree : true
      });
    } else if (eventListenerSupported) {
      obj.addEventListener('DOMNodeInserted', callback, false);
      obj.addEventListener('DOMNodeRemoved', callback, false);
    }
  };
})();

// Register the filtering upon any changes on the whole page
observeDOM(document, function() {
  filterGiveaways();
});

filterGiveaways();
