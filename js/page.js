var Page = {};   // Namespace

/*
    Logic related to the "About" page.
    Loads language-specific content over an XHR
*/
Page.about = {};
Page.about.content = undefined;    // About page content
// Fetch the about page contents, and add the event listeners for how buttons
// load different sections of the about page.
Page.about.fetch = function() {
  var base = "/fragments/";
  var specific = L.display + "/about.html";
  var fetch_url = base + specific;
  var request = new XMLHttpRequest();
  request.open('GET', fetch_url);
  request.responseType = 'document';
  request.send();
  request.onload = function() {
    Page.about.content = request.response.getElementById('hiddenContentFrame');
    Page.about.language = L.display;   // What language the content was loaded in
    window.dispatchEvent(Page.about.loaded);   // Report the data has loaded
  }
}
Page.about.language = undefined;   // Language the content was loaded in
Page.about.loaded = new Event('about_loaded');
Page.about.render = function() {
  // Displays the about page when the button is clicked. Load content from a static
  // file based on the given language, and display it in a #contentFrame.about
  if (Page.about.language == undefined) {
    Page.about.fetch();   // Direct link
  } else if (Page.about.language != L.display) {
    Page.about.fetch();   // Language change event
  } else {
    Page.sections.menuDefaults();   // Initialize submenus if necessary
    var old_content = document.getElementById('contentFrame');
    Page.swap(old_content, Page.about.content);
    Page.footer.redraw();
  }
}

Page.footer = {};
Page.footer.redraw = function() {
  // Add the footer at the bottom of the page
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.className != "footer") {
    // If no footer exists, add one in
    var bottomMenu = Page.bottomMenu(L.display);
    var footer = Page.footer.render(L.display);
    body.appendChild(bottomMenu);
    body.appendChild(footer);
  } else {
    // Also replace the footer menu
    var bottomMenu_test = document.getElementById("pageBottom");
    // Redraw the footer for language event changes
    var bottomMenu = Page.bottomMenu(L.display);
    var footer = Page.footer.render(L.display);
    body.replaceChild(bottomMenu, bottomMenu_test);
    body.replaceChild(footer, footer_test);
  }
}
Page.footer.remove = function() {
  // Remove the footer and bottom menu if returning to the home page
  var body = document.getElementsByTagName('body')[0];
  var footer_test = body.lastElementChild;
  if (footer_test.className == "footer") {
    var bottomMenu_test = document.getElementById("pageBottom");
    body.removeChild(bottomMenu_test);
    body.removeChild(footer_test);
  }
}
Page.footer.render = function(language) {
  // Draw a footer with the correct language
  var p = document.createElement('p');
  for (var i in L.gui.footer[language]) {
    var field = L.gui.footer[language][i];
    if (field == "<INSERTLINK>") {
      var rpl = document.createElement('a');
      rpl.href = "https://github.com/wwoast/redpanda-lineage";
      rpl.innerText = L.gui.footerLink[language];
      p.appendChild(rpl);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var footer = document.createElement('div');
  footer.className = "footer";
  footer.appendChild(shrinker);
  return footer;
}

/*
    Logic for drawing the landing page. Nothing much here yet. TODO: add more! :)
*/
Page.home = {};
Page.home.render = function() {
  // Output just the base search bar with no footer.
  var old_content = document.getElementById('contentFrame');
  var new_content = document.createElement('img');
  new_content.src = "images/jiuzhaigou.jpg";
  new_content.className = "fullFrame";
  new_content.id = "contentFrame";
  Page.swap(old_content, new_content);
  Page.footer.remove();
}

Page.lastSearch = '#home';      // When un-clicking Links/About, go back to the last panda search

/*
    Logic related to the Links page.
    Loads language-specific content over an XHR
*/
Page.links = {};
Page.links.content = undefined;    // Links page content
// Fetch the links page contents
Page.links.fetch = function() {
  var base = "/fragments/";
  var specific = L.display + "/links.html";
  var fetch_url = base + specific;
  var request = new XMLHttpRequest();
  request.open('GET', fetch_url);
  request.responseType = 'document';
  request.send();
  request.onload = function() {
    Page.links.content = request.response.getElementById('hiddenContentFrame');
    Page.links.language = L.display;   // What language the content was laoaded in
    window.dispatchEvent(Page.links.loaded);   // Report the data has loaded
  }
}
Page.links.language = undefined;   // Language the content was loaded in
Page.links.loaded = new Event('links_loaded');
Page.links.render = function() {
  // Displays the links page when the button is clicked. Load content from a static
  // file based on the given language, and display it in a #contentFrame.links
  if (Page.links.language == undefined) {
    Page.links.fetch();   // Direct link
  }
  else if (Page.links.language != L.display) {
    Page.links.fetch();   // Language change event
  } else {
    Page.sections.menuDefaults();   // Initialize submenus if necessary
    var old_content = document.getElementById('contentFrame');
    Page.swap(old_content, Page.links.content);
    Page.footer.redraw();
  }
}

/*
    Logic related to checking page routes, which are all implemented as #hashlinks
*/
Page.routes = {};
Page.routes.check = function() {
  // On initial page load, look for specific hashes that represent special buttons
  // and immediately load that page if necessary.
  if (Page.routes.dynamic.includes(window.location.hash.split('/')[0])) {
    Page.current = Page.results.render;
  } else if (window.location.hash == "#about") {
    Page.current = Page.about.render;
  } else if (window.location.hash == "#links") {
    Page.current = Page.links.render;
  } else {
    Page.current = Page.home.render;
  }
}
Page.routes.dynamic = [
    "#credit",
    "#panda",
    "#query",
    "#zoo"
];
Page.routes.fixed = [
    "#about",    // The about page
    "#home",     // The empty query page
    "#links"     // The links page
];

/*
    Logic related to the results page output. The main render function chooses between
    other results rendering modes, and we'll likely add many more as time goes on.
*/
Page.results = {};
Page.results.entities = function(results) {
  // Given a search for pandas and zoos, output entity divs
  var content_divs = [];
  results.forEach(function(entity) {
    if (entity["_id"] < 0) {
      // Zoos get the Zoo div and pandas for this zoo
      content_divs.push(Show.zooInformation(entity, L.display));
      animals = Pandas.sortOldestToYoungest(Pandas.searchPandaZooCurrent(entity["_id"]));
      animals.forEach(function(animal) {
        content_divs.push(Show.pandaInformation(animal, L.display, undefined));
      });
    } else {
      content_divs.push(Show.pandaInformation(entity, L.display, undefined));
    }
  });
  if (results.length == 0) {
    // No results? On desktop, bring up a sad panda
    content_divs.push(Show.displayEmptyResult(L.display));
  }
  return content_divs;
}
Page.results.photos = function(results) {
  var content_divs = [];
  results.forEach(function(entity) {
    if (entity["_id"] < 0) {
      // Zoos have a single photo to get
      content_divs.push(Gallery.zooPhotoCredits(entity, L.display));
    } else {
      // Pandas have multiple photos, and you'll need to filter on the credited photo
      content_divs = content_divs.concat(Gallery.pandaPhotoCredits(entity, Query.env.credit, L.display));
    }
  });
  // Write some HTML with summary information for the user and the number of photos
  var header = Page.credit(Query.env.credit, content_divs.length, L.display);
  content_divs.unshift(header);
  // HACK: revert to results mode
  Query.env.clear();
  return content_divs;
}
Page.results.render = function() {
  // window.location.hash doesn't decode UTF-8. This does, fixing Japanese search
  var input = decodeURIComponent(window.location.hash);
  // Start by just displaying info for one panda by id search
  var results = Query.hashlink(input);
  results = results instanceof Array ? results : [results];   // Guarantee array
  var content_divs = [];
  var new_content = document.createElement('div');
  new_content.id = "hiddenContentFrame";
  switch(Query.env.output) {
    case "entities":
      content_divs = Page.results.entities(results);
      break;
    case "photos":
      content_divs = Page.results.photos(results);
      new_content.style.textAlign = "center";   // Align photos centered in each row
      break;
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  content_divs.forEach(function(content_div) {
    shrinker.appendChild(content_div);
  });
  new_content.appendChild(shrinker);
  // Append the new content into the page and then swap it in
  var old_content = document.getElementById('contentFrame');
  Page.swap(old_content, new_content);
  // Call layout adjustment functions to shrink any names that are too long
  Layout.shrinkNames();
  Page.footer.redraw();
}

/*
    Shared logic relating to the about/links page, both of which track sections
    that are displayed at some point or another
*/
Page.sections = {};
Page.sections.buttonEventHandlers = function(section_menu_id) {
  // The about page and links page have menus with buttons that
  // cause subsections to appear or disappear as needed.
  var menu = document.getElementById(section_menu_id);
  // Find all button subelements of the menu
  var buttons = document.getElementsByClassName("sectionButton");
  // For each button, add an event handler to show the section
  // related to the button's id. Example:
  //    aboutPage_button => shows aboutPage
  for (var button of buttons) {
    button.addEventListener('click', function() {
      var show_section_id = this.id.split("_")[0];
      var menu_id = this.parentNode.id;
      Page.sections.show(show_section_id);
      // TODO: set new uri representing sub-page
      // Set subMenu state. This is used to validate
      // what page to show and how the menu will be colored.
      Page.sections.menu.setItem(menu_id, show_section_id);
    });
  }
}
// Use session storage (lost when browser closes) for menu state.
// Potential values are for the menus on the about and links page, so the
// chosen sub-page will reappear when theses pages are regenerated.
//   "aboutPageMenu" can be set to (usage|pandas|contributions)
//   "linksPageMenu" can be set to (community|zoos|friends)
Page.sections.menu = window.sessionStorage;
Page.sections.menuDefaults = function() {
  // Set submenu defaults
  if (Page.sections.menu.getItem("aboutPageMenu") == null) {
    Page.sections.menu.setItem("aboutPageMenu", "usageGuide");
  }
  if (Page.sections.menu.getItem("linksPageMenu") == null) {
    Page.sections.menu.setItem("linksPageMenu", "redPandaCommunity");
  }
}
Page.sections.show = function(section_id) {
  // For pages with hidden sections, get a list of the section
  // containers, and hide all of them but the one provided.
  // This requires an id convention where sections are id'ed "name" and the
  // buttons that activate those sections are id'ed "name_button"
  var desired = document.getElementById(section_id);
  var desired_button = document.getElementById(section_id + "_button");
  // Find currently shown section and hide it
  var sections = document.getElementsByClassName("section");
  var shown = [].filter.call(sections, function(el) {
    return el.classList.contains("hidden") == false;
  })[0];
  // Turn off the existing shown section, and "unselect" its button
  if (shown != undefined) {
    var shown_button = document.getElementById(shown.id + "_button");
    shown.classList.add("hidden");
    shown_button.classList.remove("selected");
  }
  // Remove the hidden class on the desired section, and "select" its button
  desired.classList.remove("hidden");
  desired_button.classList.add("selected");
}

/*
    Miscellaneous stuff that I don't know how to organize yet
*/
// Draw a bottom menu, for when there are panda search results
Page.bottomMenu = function(language) {
  var menu_div = document.createElement('div');
  menu_div.className = "bottomMenu";
  menu_div.id = "pageBottom";
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  // Currently there are top and home buttons
  // Top button
  var top_icon = L.emoji.top;
  var top_text = L.gui.top[language];
  var top_button = Page.button("topButton", top_icon, top_text);
  top_button.addEventListener("click", function() {
    // anchor tags get used for JS redraws, so don't use an anchor tag for
    // top-of-page scroll events. This fixes the language button after clicking pageTop.
    window.scrollTo(0, 0);
  });
  // Home button
  var home_icon = L.emoji.home;
  var home_text = L.gui.home[language];
  var home_button = Page.button("homeButton", home_icon, home_text);
  // In mobile mode, logo button at the top doesn't exist so add a home button
  // to the footer bar menu.
  home_button.addEventListener("click", function() {
    // Return to the empty search page
    Page.lastSearch = "#home";
    Page.home.render();
    window.location = "#home";
    Page.current = Page.home.render;
  });
  shrinker.appendChild(top_button);
  shrinker.appendChild(home_button);
  menu_div.appendChild(shrinker);
  return menu_div;
}

// Draw menu buttons for the bottom menu, or potentially elsewhere.
Page.button = function(id, button_icon, button_text) {
  var button = document.createElement('button');
  button.className = "menu";
  button.id = id;
  var content = document.createElement('div');
  content.className = "buttonContent";
  var icon_div = document.createElement('div');
  icon_div.className = 'icon';
  icon_div.innerText = button_icon;
  var text_div = document.createElement('div');
  text_div.className = 'text';
  text_div.innerText = button_text;
  content.appendChild(icon_div);
  content.appendChild(text_div);
  button.appendChild(content);
  return button;
}

// Draw a header for crediting someone's photos contribution 
// with the correct language
Page.credit = function(credit, count, language) {
  var p = document.createElement('p');
  for (var i in L.gui.credit[language]) {
    var field = L.gui.credit[language][i];
    if (field == "<INSERTUSER>") {
      field = credit;
      var msg = document.createElement('i');
      msg.innerText = field;
      p.appendChild(msg);
    } else if (field == "<INSERTNUMBER>") {
      field = count;
      var msg = document.createElement('b');
      msg.innerText = field;
      p.appendChild(msg);
    } else {
      var msg = document.createTextNode(field);
      p.appendChild(msg);
    }
  }
  var shrinker = document.createElement('div');
  shrinker.className = "shrinker";
  shrinker.appendChild(p);
  var footer = document.createElement('div');
  footer.className = "creditSummary";
  footer.appendChild(shrinker);
  return footer;
}

// Stores callback to the current page render function for redraws.
// Default mode is to show panda results.
Page.current = Page.results.render;

// Redraw page after an updateLanguage event or similar
Page.redraw = function(callback) {
  // Redisplay results in the correct language, but only if the Pandas
  // content has already been loaded.
  if ((window.location.hash.length > 0) && (P.db != undefined) && (callback == Page.results.render)) {
    callback();
  }
  // For non-panda-results page, don't worry if the database is there or not
  if ((window.location.hash.length > 0) && (callback != Page.results.render)) {
    callback();
  }
}

// Swap in a new contents frame for an old contents frame. 
// After calling this, double-check that the footer 
// is still the bottom of the page.
Page.swap = function(old_content, new_content) {
  // Append the new content into the page and then swap it in
  var body = document.getElementsByTagName('body')[0];
  // Place the new content right after the old content
  old_content.parentNode.insertBefore(new_content, old_content.nextSibling);
  old_content.style.display = "none";
  new_content.style.display = "block";
  body.removeChild(old_content);
  new_content.id = 'contentFrame';
}