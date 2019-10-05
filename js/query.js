/*
    Query processing for the search box. Translates operators and parameters
    into a graph search.
*/

var Query = {};   // Namespace

Query.Q = {};     // Prototype

Query.init = function() {
  var query = Object.create(Query.Q);
  return query;
}

Query.env = {};
// Credit for photos being shown
Query.env.preserve_case = false;
// When displaying results, normally we just display zoos and pandas ("entities").
// However, other output modes are supported based on the supplied types.
// The "credit" search results in a spread of photos credited to a particular user.
Query.env.output_mode = "entities";
// If a URI indicates a specific photo, indicate which one here.
Query.env.specific_photo = undefined;
// Reset query environment back to defaults, typically after a search is run
Query.env.clear = function() {
  Query.env.preserve_case = false;
  Query.env.output_mode = "entities";
  Query.env.specific_photo = undefined;
}

/* 
    Resolve the query string into something
*/
Query.resolver = {};
Query.resolver.begin = function(input_string) {
  var parse_tree = Parse.tree.generate(input_string);
  // Build result sets. For now, this should just be very simple result sets
  // based on one of the available search sets
  var set_nodes = Parse.tree.filter(parse_tree, Parse.tree.tests.sets);
  // Nothing parsed looks like a search set to return results for
  if (set_nodes.length == 0) {
    return [];
  }
  // Zeroary search, or Single subject search.
  var singular_nodes = Parse.tree.filter(set_nodes[0], Parse.tree.tests.singular);
  if (set_nodes.length == 1 && singular_nodes.length == 1) {
    return Query.resolver.single(set_nodes[0], singular_nodes[0])
  }
  // Unary search, or Keyword + Search Term
  // TOWRITE
}
// The parse tree found only a single term for searching
Query.resolver.single = function(set_node, singular_node) {
  var hits = [];
  var search_word = singular_node.str;
  if (set_node.type == "set_subject") {
    // subject_id on its own should be a panda
    if (singular_node.type == "subject_id") {
      hits = Pandas.searchPandaId(search_word);
    }
    // subject_name on its own may be a panda or a zoo
    if (singular_node.type == "subject_name") {
      var panda_hits = Pandas.searchPandaName(search_word);
      var zoo_hits = Pandas.searchZooName(search_word);
      hits = (panda_hits.length >= zoo_hits.length)
                    ? panda_hits : zoo_hits;
    }
    // subject_year isn't valid on its own
  }
  if (set_node.type == "set_keyword") {
    if (Parse.group.baby.indexOf(search_word) != -1) {
      hits = Pandas.searchBabies();
    }
    if (Parse.group.nearby.indexOf(search_word) != -1) {
      if (F.resolved == false) {
        F.getNaiveLocation();
      }
      // If we're still on a query page and another action hasn't occurred,
      // display the zoo results when we're done.
    }
    if (Parse.group.dead.indexOf(search_word) != -1) {
      hits = Pandas.searchDead();
    }
  }
  if (set_node.type == "set_tag") {
    if (Parse.group.tags.indexOf(search_word) != -1) {
      Query.env.output_mode = "photos";
      // Find the canonical tag to do the searching by
      var tag = Parse.searchTag(search_word);
      // TODO: search media photos for all the animals by id, and include
      // in the searchPhotoTags animals set
      hits = Pandas.searchPhotoTags(
        Pandas.allAnimalsAndMedia(), 
        [tag], mode="photos", fallback="none"
      );
    }
  }
  return {
    "query": set_node.str,
    "parsed": set_node.type,
    "hits": hits
  }
}
