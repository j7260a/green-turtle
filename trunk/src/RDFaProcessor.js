
RDFaProcessor.prototype = new URIResolver();
RDFaProcessor.prototype.constructor=RDFaProcessor;
function RDFaProcessor(targetObject) {
   this.target = targetObject ? targetObject : {};
   this.target.prefixes = {};
   this.target.terms = {};
   this.language = null;
   this.vocabulary = null;
   this.blankCounter = 0;
   this.langAttributes = [ { namespaceURI: "http://www.w3.org/XML/1998/namespace", localName: "lang" } ];
   this.contentAttributes = [ "content" ];
   this.inXHTMLMode = false;
   this.absURIRE = /[\w\_\-]+:\S+/;
   this.finishedHandlers = [];
   this.init();
}

RDFaProcessor.prototype.newBlankNode = function() {
   this.blankCounter++;
   return "_:"+this.blankCounter;
}

RDFaProcessor.XMLLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral"; 
RDFaProcessor.HTMLLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML"; 
RDFaProcessor.PlainLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
RDFaProcessor.objectURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
RDFaProcessor.typeURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

RDFaProcessor.nameChar = '[-A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u10000-\uEFFFF\.0-9\u00B7\u0300-\u036F\u203F-\u2040]';
RDFaProcessor.nameStartChar = '[\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3\u4E00-\u9FA5\u3007\u3021-\u3029_]';
RDFaProcessor.NCNAME = new RegExp('^' + RDFaProcessor.nameStartChar + RDFaProcessor.nameChar + '*$');

RDFaProcessor.prototype.trim = function(str) {
   return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

RDFaProcessor.prototype.tokenize = function(str) {
   return this.trim(str).split(/\s+/);
}


RDFaProcessor.prototype.parseSafeCURIEOrCURIEOrURI = function(value,prefixes,base) {
   value = this.trim(value);
   if (value.charAt(0)=='[' && value.charAt(value.length-1)==']') {
      value = value.substring(1,value.length-1);
      value = value.trim(value);
      if (value.length==0) {
         return null;
      }
      return this.parseCURIE(value,prefixes,base);
   } else {
      return this.parseCURIEOrURI(value,prefixes,base);
   }
}

RDFaProcessor.prototype.parseCURIE = function(value,prefixes,base) {
   var colon = value.indexOf(":");
   if (colon>=0) {
      var prefix = value.substring(0,colon);
      if (prefix=="") {
         // default prefix
         var uri = prefixes[""];
         return uri ? uri+value.substring(colon+1) : null;
      } else if (prefix=="_") {
         // blank node
         return "_:"+value.substring(colon+1);
      } else if (RDFaProcessor.NCNAME.test(prefix)) {
         var uri = prefixes[prefix];
         if (uri) {
            return uri+value.substring(colon+1);
         }
      }
   }
   return null;
}

RDFaProcessor.prototype.parseCURIEOrURI = function(value,prefixes,base) {
   var curie = this.parseCURIE(value,prefixes,base);
   if (curie) {
      return curie;
   }
   return this.resolveAndNormalize(base,value);
}

RDFaProcessor.prototype.parsePredicate = function(value,defaultVocabulary,terms,prefixes,base) {
   if (value=="") {
      return null;
   }
   var predicate = this.parseTermOrCURIEOrAbsURI(value,defaultVocabulary,terms,prefixes,base);
   if (predicate && predicate.indexOf("_:")==0) {
      return null;
   }
   return predicate;
}

RDFaProcessor.prototype.parseTermOrCURIEOrURI = function(value,defaultVocabulary,terms,prefixes,base) {
   //alert("Parsing "+value+" with default vocab "+defaultVocabulary);
   value = this.trim(value);
   var curie = this.parseCURIE(value,prefixes,base);
   if (curie) {
      return curie;
   } else {
       var term = terms[value];
       if (term) {
          return term;
       }
       var lcvalue = value.toLowerCase();
       term = terms[lcvalue];
       if (term) {
          return term;
       }
       if (defaultVocabulary && !this.absURIRE.exec(value)) {
          return defaultVocabulary+value
       }
   }
   return this.resolveAndNormalize(base,value);
}

RDFaProcessor.prototype.parseTermOrCURIEOrAbsURI = function(value,defaultVocabulary,terms,prefixes,base) {
   //alert("Parsing "+value+" with default vocab "+defaultVocabulary);
   value = this.trim(value);
   var curie = this.parseCURIE(value,prefixes,base);
   if (curie) {
      return curie;
   } else {
       if (defaultVocabulary && !this.absURIRE.exec(value)) {
          return defaultVocabulary+value
       }
       var term = terms[value];
       if (term) {
          return term;
       }
       var lcvalue = value.toLowerCase();
       term = terms[lcvalue];
       if (term) {
          return term;
       }
   }
   if (this.absURIRE.exec(value)) {
      return this.resolveAndNormalize(base,value);
   }
   return null;
}

RDFaProcessor.prototype.resolveAndNormalize = function(base,href) {
   var u = base.resolve(href);
   var parsed = this.parseURI(u);
   parsed.normalize();
   return parsed.spec;
}

RDFaProcessor.prototype.parsePrefixMappings = function(str,target) {
   var values = this.tokenize(str);
   var prefix = null;
   var uri = null;
   for (var i=0; i<values.length; i++) {
      if (values[i][values[i].length-1]==':') {
         prefix = values[i].substring(0,values[i].length-1);
      } else if (prefix) {
         target[prefix] = values[i];
         prefix = null;
      }
   }
}

RDFaProcessor.prototype.copyMappings = function(mappings) {
   var newMappings = {};
   for (var k in mappings) {
      newMappings[k] = mappings[k];
   }
   return newMappings;
}

RDFaProcessor.prototype.ancestorPath = function(node) {
   var path = "";
   while (node && node.nodeType!=Node.DOCUMENT_NODE) {
      path = "/"+node.localName+path;
      node = node.parentNode;
   }
   return path;
}

RDFaProcessor.prototype.setContext = function(node) {

   // We only recognized XHTML+RDFa 1.1 if the version is set propertyly
   if (node.localName=="html" && node.getAttribute("version")=="XHTML+RDFa 1.1") {
      this.setXHTMLContext();
   } else if (node.localName=="html" || node.namespaceURI=="http://www.w3.org/1999/xhtml") {
      if (document.doctype) {
         if (document.doctype.publicId=="-//W3C//DTD XHTML+RDFa 1.0//EN" && document.doctype.systemId=="http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd") {
            console.log("WARNING: RDF 1.0 is not supported.  Defaulting to HTML5 mode.");
            this.setHTMLContext();
         } else if (document.doctype.publicId=="-//W3C//DTD XHTML+RDFa 1.1//EN" && document.doctype.systemId=="http://www.w3.org/MarkUp/DTD/xhtml-rdfa-2.dtd") {
            this.setXHTMLContext();
         } else {
            this.setHTMLContext();
         }
      } else {
         this.setHTMLContext();
      }
   } else {
      this.setXMLContext();
   }

}

RDFaProcessor.prototype.setInitialContext = function() {
   this.vocabulary = null;
   this.target.prefixes = {};
   this.target.terms = {};
   this.langAttributes = [ { namespaceURI: "http://www.w3.org/XML/1998/namespace", localName: "lang" } ];
   this.contentAttributes = [ "content" ];
   
   this.target.prefixes[""] = "http://www.w3.org/1999/xhtml/vocab#";

   // w3c
   this.target.prefixes["grddl"] = "http://www.w3.org/2003/g/data-view#";
   this.target.prefixes["ma"] = "http://www.w3.org/ns/ma-ont#";
   this.target.prefixes["owl"] = "http://www.w3.org/2002/07/owl#";
   this.target.prefixes["rdf"] = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
   this.target.prefixes["rdfa"] = "http://www.w3.org/ns/rdfa#";
   this.target.prefixes["rdfs"] = "http://www.w3.org/2000/01/rdf-schema#";
   this.target.prefixes["rif"] = "http://www.w3.org/2007/rif#";
   this.target.prefixes["skos"] = "http://www.w3.org/2004/02/skos/core#";
   this.target.prefixes["skosxl"] = "http://www.w3.org/2008/05/skos-xl#";
   this.target.prefixes["wdr"] = "http://www.w3.org/2007/05/powder#";
   this.target.prefixes["void"] = "http://rdfs.org/ns/void#";
   this.target.prefixes["wdrs"] = "http://www.w3.org/2007/05/powder-s#";
   this.target.prefixes["xhv"] = "http://www.w3.org/1999/xhtml/vocab#";
   this.target.prefixes["xml"] = "http://www.w3.org/XML/1998/namespace";
   this.target.prefixes["xsd"] = "http://www.w3.org/2001/XMLSchema#";
   // non-rec w3c
   this.target.prefixes["sd"] = "http://www.w3.org/ns/sparql-service-description#";
   this.target.prefixes["org"] = "http://www.w3.org/ns/org#";
   this.target.prefixes["gldp"] = "http://www.w3.org/ns/people#";
   this.target.prefixes["cnt"] = "http://www.w3.org/2008/content#";
   this.target.prefixes["dcat"] = "http://www.w3.org/ns/dcat#";
   this.target.prefixes["earl"] = "http://www.w3.org/ns/earl#";
   this.target.prefixes["ht"] = "http://www.w3.org/2006/http#";
   this.target.prefixes["ptr"] = "http://www.w3.org/2009/pointers#";
   // widely used
   this.target.prefixes["cc"] = "http://creativecommons.org/ns#";
   this.target.prefixes["ctag"] = "http://commontag.org/ns#";
   this.target.prefixes["dc"] = "http://purl.org/dc/terms/";
   this.target.prefixes["dcterms"] = "http://purl.org/dc/terms/";
   this.target.prefixes["foaf"] = "http://xmlns.com/foaf/0.1/";
   this.target.prefixes["gr"] = "http://purl.org/goodrelations/v1#";
   this.target.prefixes["ical"] = "http://www.w3.org/2002/12/cal/icaltzd#";
   this.target.prefixes["og"] = "http://ogp.me/ns#";
   this.target.prefixes["rev"] = "http://purl.org/stuff/rev#";
   this.target.prefixes["sioc"] = "http://rdfs.org/sioc/ns#";
   this.target.prefixes["v"] = "http://rdf.data-vocabulary.org/#";
   this.target.prefixes["vcard"] = "http://www.w3.org/2006/vcard/ns#";
   this.target.prefixes["schema"] = "http://schema.org/";
   
   // terms
   this.target.terms["describedby"] = "http://www.w3.org/2007/05/powder-s#describedby";
   this.target.terms["license"] = "http://www.w3.org/1999/xhtml/vocab#license";
   this.target.terms["role"] = "http://www.w3.org/1999/xhtml/vocab#role";
}

RDFaProcessor.prototype.setXMLContext = function() {
   this.setInitialContext();
   this.inXHTMLMode = false;
   this.inHTMLMode = false;
}

RDFaProcessor.prototype.setHTMLContext = function() {
   this.setInitialContext();
   this.langAttributes = [ { namespaceURI: "http://www.w3.org/XML/1998/namespace", localName: "lang" },
                           { namespaceURI: null, localName: "lang" }];
   this.contentAttributes = [ "value", "datetime", "content" ];
   this.inXHTMLMode = false;
   this.inHTMLMode = true;
}

RDFaProcessor.prototype.setXHTMLContext = function() {

   this.setInitialContext();
   
   this.inXHTMLMode = true;
   this.inHTMLMode = false;
   
   this.langAttributes = [ { namespaceURI: "http://www.w3.org/XML/1998/namespace", localName: "lang" } ];
   this.contentAttributes = [ "content" ];
   
   // From http://www.w3.org/2011/rdfa-context/xhtml-rdfa-1.1
   this.target.terms["alternate"] = "http://www.w3.org/1999/xhtml/vocab#alternate";
   this.target.terms["appendix"] = "http://www.w3.org/1999/xhtml/vocab#appendix";
   this.target.terms["bookmark"] = "http://www.w3.org/1999/xhtml/vocab#bookmark";
   this.target.terms["cite"] = "http://www.w3.org/1999/xhtml/vocab#cite"
   this.target.terms["chapter"] = "http://www.w3.org/1999/xhtml/vocab#chapter";
   this.target.terms["contents"] = "http://www.w3.org/1999/xhtml/vocab#contents";
   this.target.terms["copyright"] = "http://www.w3.org/1999/xhtml/vocab#copyright";
   this.target.terms["first"] = "http://www.w3.org/1999/xhtml/vocab#first";
   this.target.terms["glossary"] = "http://www.w3.org/1999/xhtml/vocab#glossary";
   this.target.terms["help"] = "http://www.w3.org/1999/xhtml/vocab#help";
   this.target.terms["icon"] = "http://www.w3.org/1999/xhtml/vocab#icon";
   this.target.terms["index"] = "http://www.w3.org/1999/xhtml/vocab#index";
   this.target.terms["last"] = "http://www.w3.org/1999/xhtml/vocab#last";
   this.target.terms["license"] = "http://www.w3.org/1999/xhtml/vocab#license";
   this.target.terms["meta"] = "http://www.w3.org/1999/xhtml/vocab#meta";
   this.target.terms["next"] = "http://www.w3.org/1999/xhtml/vocab#next";
   this.target.terms["prev"] = "http://www.w3.org/1999/xhtml/vocab#prev";
   this.target.terms["previous"] = "http://www.w3.org/1999/xhtml/vocab#previous";
   this.target.terms["section"] = "http://www.w3.org/1999/xhtml/vocab#section";
   this.target.terms["stylesheet"] = "http://www.w3.org/1999/xhtml/vocab#stylesheet";
   this.target.terms["subsection"] = "http://www.w3.org/1999/xhtml/vocab#subsection";
   this.target.terms["start"] = "http://www.w3.org/1999/xhtml/vocab#start";
   this.target.terms["top"] = "http://www.w3.org/1999/xhtml/vocab#top";
   this.target.terms["up"] = "http://www.w3.org/1999/xhtml/vocab#up";
   this.target.terms["p3pv1"] = "http://www.w3.org/1999/xhtml/vocab#p3pv1";

   // other
   this.target.terms["related"] = "http://www.w3.org/1999/xhtml/vocab#related";
   this.target.terms["role"] = "http://www.w3.org/1999/xhtml/vocab#role";
   this.target.terms["transformation"] = "http://www.w3.org/1999/xhtml/vocab#transformation";
}

RDFaProcessor.prototype.init = function() {
}

RDFaProcessor.prototype.newSubjectOrigin = function(origin,subject) {
}

RDFaProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
}

RDFaProcessor.prototype.process = function(node) {

   /*
   if (!window.console) {
      window.console = { log: function() {} };
   }*/
   if (node.nodeType==Node.DOCUMENT_NODE) {
      node = node.documentElement;
      this.setContext(node);
   } else if (node.parentNode.nodeType==Node.DOCUMENT_NODE) {
      this.setContext(node);
   } 
   var queue = [];
   // Fix for Firefox that includes the hash in the base URI
   var removeHash = function(baseURI) {
      var hash = baseURI.indexOf("#");
      if (hash>=0) {
         baseURI = baseURI.substring(0,hash);
      }
      return baseURI;
   }
   queue.push({ current: node, context: this.push(null,removeHash(node.baseURI))});
   while (queue.length>0) {
      var item = queue.shift();
      if (item.parent) {
         // Sequence Step 14: list triple generation
         if (item.context.parent && item.context.parent.listMapping==item.listMapping) {
            // Skip a child context with exactly the same mapping
            continue;
         }
         //console.log("Generating lists for "+item.subject+", tag "+item.parent.localName);
         for (var predicate in item.listMapping) {
            var list = item.listMapping[predicate];
            if (list.length==0) {
               this.addTriple(item.parent,item.subject,predicate,{ type: RDFaProcessor.objectURI, value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil" });
               continue;
            }
            var bnodes = [];
            for (var i=0; i<list.length; i++) {
               bnodes.push(this.newBlankNode());
               //this.newSubject(item.parent,bnodes[i]);
            }
            for (var i=0; i<bnodes.length; i++) {
               this.addTriple(item.parent,bnodes[i],"http://www.w3.org/1999/02/22-rdf-syntax-ns#first",list[i]);
               this.addTriple(item.parent,bnodes[i],"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest",{ type: RDFaProcessor.objectURI , value: (i+1)<bnodes.length ? bnodes[i+1] : "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil" });
            }
            this.addTriple(item.parent,item.subject,predicate,{ type: RDFaProcessor.objectURI, value: bnodes[0] });
         }
         continue;
      }
      var current = item.current;
      var context = item.context;

      //console.log("Tag: "+current.localName+", listMapping="+JSON.stringify(context.listMapping));

      // Sequence Step 1
      var skip = false;
      var newSubject = null;
      var currentObjectResource = null;
      var typedResource = null;
      var prefixes = context.prefixes;
      var prefixesCopied = false;
      var incomplete = [];
      var listMapping = context.listMapping;
      var listMappingDifferent = context.parent ? false : true;
      var language = context.language;
      var vocabulary = context.vocabulary;

      // TODO: the "base" element may be used for HTML+RDFa 1.1
      var base = this.parseURI(removeHash(current.baseURI));
      current.item = null;

      // Sequence Step 2: set the default vocabulary
      var vocabAtt = current.getAttributeNode("vocab");
      if (vocabAtt) {
         var value = this.trim(vocabAtt.value);
         if (value.length>0) {
            vocabulary = value;
            var baseSubject = base.spec;
            //this.newSubject(current,baseSubject);
            this.addTriple(current,baseSubject,"http://www.w3.org/ns/rdfa#usesVocabulary",{ type: RDFaProcessor.objectURI , value: vocabulary});
         } else {
            vocabulary = this.vocabulary;
         }
      }

      // Sequence Step 3: IRI mappings
      // handle xmlns attributes
      for (var i=0; i<current.attributes.length; i++) {
         var att = current.attributes[i];
         //if (att.namespaceURI=="http://www.w3.org/2000/xmlns/") {
         if (att.nodeName.charAt(0)=="x" && att.nodeName.indexOf("xmlns:")==0) {
            if (!prefixesCopied) {
               prefixes = this.copyMappings(prefixes);
               prefixesCopied = true;
            }
            var prefix = att.nodeName.substring(6);
            // TODO: resolve relative?
            prefixes[prefix] = this.trim(att.value);
         }
      }
      // Handle prefix mappings (@prefix)
      var prefixAtt = current.getAttributeNode("prefix");
      if (prefixAtt) {
         if (!prefixesCopied) {
            prefixes = this.copyMappings(prefixes);
            prefixesCopied = true;
         }
         this.parsePrefixMappings(prefixAtt.value,prefixes);
      }


      // Sequence Step 4: language
      var xmlLangAtt = null;
      for (var i=0; !xmlLangAtt && i<this.langAttributes.length; i++) {
         xmlLangAtt = current.getAttributeNodeNS(this.langAttributes[i].namespaceURI,this.langAttributes[i].localName);
      }
      if (xmlLangAtt) {
         var value = this.trim(xmlLangAtt.value);
         if (value.length>0) {
            language = value;
         }
      }

      var relAtt = current.getAttributeNode("rel");
      var revAtt = current.getAttributeNode("rev");
      var typeofAtt = current.getAttributeNode("typeof");
      var propertyAtt = current.getAttributeNode("property");
      var datatypeAtt = current.getAttributeNode("datatype");
      var contentAtt = null;
      for (var i=0; !contentAtt && i<this.contentAttributes.length; i++) {
         contentAtt = current.getAttributeNode(this.contentAttributes[i]);
      }
      var aboutAtt = current.getAttributeNode("about");
      var srcAtt = current.getAttributeNode("src");
      var resourceAtt = current.getAttributeNode("resource");
      var hrefAtt = current.getAttributeNode("href");
      var inlistAtt = current.getAttributeNode("inlist");
      
      var relAttPredicates = [];
      if (relAtt) {
         var values = this.tokenize(relAtt.value);
         for (var i=0; i<values.length; i++) {
            var predicate = this.parsePredicate(values[i],vocabulary,context.terms,prefixes,base);
            if (predicate) {
               relAttPredicates.push(predicate);
            }
         }
      }
      var revAttPredicates = [];
      if (revAtt) {
         var values = this.tokenize(revAtt.value);
         for (var i=0; i<values.length; i++) {
            var predicate = this.parsePredicate(values[i],vocabulary,context.terms,prefixes,base);
            if (predicate) {
               revAttPredicates.push(predicate);
            }
         }
      }
      
      // Section 3.1, bullet 7
      if (this.inHTMLMode) {
         if (relAttPredicates.length==0) {
            relAtt = null;
         }
         if (revAttPredicates.length==0) {
            revAtt = null;
         }
      }

      if (relAtt || revAtt) {
         // Sequence Step 6: establish new subject and value
         if (aboutAtt) {
            newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value,prefixes,base);
         }
         if (typeofAtt) {
            typedResource = newSubject;
         }
         if (!newSubject) {
            if (current.parentNode.nodeType==Node.DOCUMENT_NODE) {
               newSubject = removeHash(current.baseURI);
            } else if (context.parentObject) {
               // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
               newSubject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
            }
         }
         if (resourceAtt) {
            currentObjectResource = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value,prefixes,base);
         }
         
         if (!currentObjectResource) {
            if (hrefAtt) {
               currentObjectResource = this.resolveAndNormalize(base,hrefAtt.value);
            } else if (srcAtt) {
               currentObjectResource = this.resolveAndNormalize(base,srcAtt.value);
            } else if (typeofAtt && !aboutAtt && !(this.inXHTMLMode && (current.localName=="head" || current.localName=="body"))) {
               currentObjectResource = this.newBlankNode();
            }
         }
         if (typeofAtt && !aboutAtt && this.inXHTMLMode && (current.localName=="head" || current.localName=="body")) {
            typedResource = newSubject;
         } else if (typeofAtt && !aboutAtt) {
            typedResource = currentObjectResource;
         }

      } else if (propertyAtt && !contentAtt && !datatypeAtt) {
         // Sequence Step 5.1: establish a new subject
         if (aboutAtt) {
            newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value,prefixes,base);
            if (typeofAtt) {
               typedResource = newSubject;
            }
         }
         if (!newSubject && current.parentNode.nodeType==Node.DOCUMENT_NODE) {
            newSubject = removeHash(current.baseURI);
            if (typeofAtt) {
               typedResource = newSubject;
            }
         } else if (!newSubject && context.parentObject) {
            // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
            newSubject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
         }
         if (typeofAtt && !typedResource) {
            if (resourceAtt) {
               typedResource = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value,prefixes,base);
            }
            if (!typedResource &&hrefAtt) {
               typedResource = this.resolveAndNormalize(base,hrefAtt.value);
            }
            if (!typedResource && srcAtt) {
               typedResource = this.resolveAndNormalize(base,srcAtt.value);
            }
            if (!typedResource && this.inXHTMLMode && (current.localName=="head" || current.localName=="body")) {
               typedResource = newSubject;
            }
            if (!typedResource) {
               typedResource = this.newBlankNode();
            }
            currentObjectResource = typedResource;
         }
         //console.log(current.localName+", newSubject="+newSubject+", typedResource="+typedResource+", currentObjectResource="+currentObjectResource);
      } else {
         // Sequence Step 5.2: establish a new subject
         if (aboutAtt) {
            newSubject = this.parseSafeCURIEOrCURIEOrURI(aboutAtt.value,prefixes,base);
         }
         if (!newSubject && resourceAtt) {
            newSubject = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value,prefixes,base);
         }
         if (!newSubject && hrefAtt) {
            newSubject = this.resolveAndNormalize(base,hrefAtt.value);
         }
         if (!newSubject && srcAtt) {
            newSubject = this.resolveAndNormalize(base,srcAtt.value);
         }
         if (!newSubject) {
            if (current.parentNode.nodeType==Node.DOCUMENT_NODE) {
               newSubject = removeHash(current.baseURI);
            } else if (this.inXHTMLMode && (current.localName=="head" || current.localName=="body")) {
               newSubject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
            } else if (typeofAtt) {
               newSubject = this.newBlankNode();
            } else if (context.parentObject) {
               // TODO: Verify: If the xml:base has been set and the parentObject is the baseURI of the parent, then the subject needs to be the new base URI
               newSubject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
               if (!propertyAtt) {
                  skip = true;
               }
            }
         }
         if (typeofAtt) {
            typedResource = newSubject;
         }
      }

      //console.log(current.tagName+": newSubject="+newSubject+", currentObjectResource="+currentObjectResource+", typedResource="+typedResource+", skip="+skip);

      var rdfaData = null;
      if (newSubject) {
         //this.newSubject(current,newSubject);
         if (aboutAtt || resourceAtt || typedResource) {
            var id = newSubject;
            if (typeofAtt && !aboutAtt && !resourceAtt && currentObjectResource) {
               id = currentObjectResource;
            }
            //console.log("Setting data attribute for "+current.localName+" for subject "+id);
            this.newSubjectOrigin(current,id);
         }
      }
      
      // Sequence Step 7: generate type triple
      if (typedResource) {
         var values = this.tokenize(typeofAtt.value);
         for (var i=0; i<values.length; i++) {
            var object = this.parseTermOrCURIEOrAbsURI(values[i],vocabulary,context.terms,prefixes,base);
            if (object) {
               this.addTriple(current,typedResource,RDFaProcessor.typeURI,{ type: RDFaProcessor.objectURI , value: object});
            }
         }
      }

      // Sequence Step 8: new list mappings if there is a new subject
      //console.log("Step 8: newSubject="+newSubject+", context.parentObject="+context.parentObject);
      if (newSubject && newSubject!=context.parentObject) {
         //console.log("Generating new list mapping for "+newSubject);
         listMapping = {};
         listMappingDifferent = true;
      }

      // Sequence Step 9: generate object triple
      if (currentObjectResource) {
         if (relAtt && inlistAtt) {
            for (var i=0; i<relAttPredicates.length; i++) {
               var list = listMapping[relAttPredicates[i]];
               if (!list) {
                  list = [];
                  listMapping[relAttPredicates[i]] = list;
               }
               list.push({ type: RDFaProcessor.objectURI, value: currentObjectResource });
            }
         } else if (relAtt) {
            for (var i=0; i<relAttPredicates.length; i++) {
               this.addTriple(current,newSubject,relAttPredicates[i],{ type: RDFaProcessor.objectURI, value: currentObjectResource});
            }
         }
         if (revAtt) {
            for (var i=0; i<revAttPredicates.length; i++) {
               this.addTriple(current,currentObjectResource, revAttPredicates[i], { type: RDFaProcessor.objectURI, value: newSubject});
            }
         }
      } else {
         // Sequence Step 10: incomplete triples
         if (newSubject && !currentObjectResource && (relAtt || revAtt)) {
            currentObjectResource = this.newBlankNode();
            //alert(current.tagName+": generated blank node, newSubject="+newSubject+" currentObjectResource="+currentObjectResource);
         }
         if (relAtt && inlistAtt) {
            for (var i=0; i<relAttPredicates.length; i++) {
               var list = listMapping[relAttPredicates[i]];
               if (!list) {
                  list = [];
                  listMapping[predicate] = list;
               }
               //console.log("Adding incomplete list for "+predicate);
               incomplete.push({ predicate: relAttPredicates[i], list: list });
            }
         } else if (relAtt) {
            for (var i=0; i<relAttPredicates.length; i++) {
               incomplete.push({ predicate: relAttPredicates[i], forward: true });
            }
         }
         if (revAtt) {
            for (var i=0; i<revAttPredicates.length; i++) {
               incomplete.push({ predicate: revAttPredicates[i], forward: false });
            }
         }
      }

      // Step 11: Current property values
      if (propertyAtt) {
         // TODO: for HTML+RDFa 1.1, the datatype must be set if the content comes from the datetime attribute
         //alert(current.baseURI+" "+newSubject+" "+propertyAtt.value);
         var datatype = null;
         var content = null; 
         if (datatypeAtt) {
            datatype = datatypeAtt.value=="" ? RDFaProcessor.PlainLiteralURI : this.parseTermOrCURIEOrAbsURI(datatypeAtt.value,vocabulary,context.terms,prefixes,base);
            content = datatype==RDFaProcessor.XMLLiteralURI || datatype==RDFaProcessor.HTMLLiteralURI ? null : (contentAtt ? contentAtt.value : current.textContent);
         } else if (contentAtt) {
            datatype = RDFaProcessor.PlainLiteralURI;
            content = contentAtt.value;
         } else if (!relAtt && !revAtt && !contentAtt) {
            if (resourceAtt) {
               content = this.parseSafeCURIEOrCURIEOrURI(resourceAtt.value,prefixes,base);
            }
            if (!content && hrefAtt) {
               content = this.resolveAndNormalize(base,hrefAtt.value);
            } else if (!content && srcAtt) {
               content = this.resolveAndNormalize(base,srcAtt.value);
            }
            if (content) {
               datatype = RDFaProcessor.objectURI;
            }
         }
         if (!datatype) {
            if (typeofAtt && !aboutAtt) {
               datatype = RDFaProcessor.objectURI;
               content = typedResource;
            } else {
               datatype = RDFaProcessor.PlainLiteralURI;
               content = current.textContent;
            }
         }
         var values = this.tokenize(propertyAtt.value);
         for (var i=0; i<values.length; i++) {
            var predicate = this.parsePredicate(values[i],vocabulary,context.terms,prefixes,base);
            if (predicate) {
               if (inlistAtt) {
                  var list = listMapping[predicate];
                  if (!list) {
                     list = [];
                     listMapping[predicate] = list;
                  }
                  list.push((datatype==RDFaProcessor.XMLLiteralURI || datatype==RDFaProcessor.HTMLLiteralURI) ? { type: datatype, value: current.childNodes} : { type: datatype ? datatype : RDFaProcessor.PlainLiteralURI, value: content, language: language});
               } else {
                  if (datatype==RDFaProcessor.XMLLiteralURI || datatype==RDFaProcessor.HTMLLiteralURI) {
                     this.addTriple(current,newSubject,predicate,{ type: datatype, value: current.childNodes});
                  } else {
                     this.addTriple(current,newSubject,predicate,{ type: datatype ? datatype : RDFaProcessor.PlainLiteralURI, value: content, language: language});
                     //console.log(newSubject+" "+predicate+"="+content);
                  }
               }
            }
         }
      }

      // Sequence Step 12: complete incomplete triples with new subject
      if (newSubject && !skip) {
         for (var i=0; i<context.incomplete.length; i++) {
            if (context.incomplete[i].list) {
               //console.log("Adding subject "+newSubject+" to list for "+context.incomplete[i].predicate);
               // TODO: it is unclear what to do here
               context.incomplete[i].list.push({ type: RDFaProcessor.objectURI, value: newSubject });
            } else if (context.incomplete[i].forward) {
               //console.log(current.tagName+": completing forward triple "+context.incomplete[i].predicate+" with object="+newSubject);
               this.addTriple(current,context.subject,context.incomplete[i].predicate, { type: RDFaProcessor.objectURI, value: newSubject});
            } else {
               //console.log(current.tagName+": completing reverse triple with object="+context.subject);
               this.addTriple(current,newSubject,context.incomplete[i].predicate,{ type: RDFaProcessor.objectURI, value: context.subject});
            }
         }
      }

      var childContext = null;
      var listSubject = newSubject;
      if (skip) {
         // TODO: should subject be null?
         childContext = this.push(context,context.subject);
         // TODO: should the entObject be passed along?  If not, then intermediary children will keep properties from being associated with incomplete triples.
         // TODO: Verify: if the current baseURI has changed and the parentObject is the parent's base URI, then the baseURI should change
         childContext.parentObject = removeHash(current.parentNode.baseURI)==context.parentObject ? removeHash(current.baseURI) : context.parentObject;
         childContext.incomplete = context.incomplete;
         childContext.language = language;
         childContext.prefixes = prefixes;
         childContext.vocabulary = vocabulary;
      } else {
         childContext = this.push(context,newSubject);
         childContext.parentObject = currentObjectResource ? currentObjectResource : (newSubject ? newSubject : context.subject);
         childContext.prefixes = prefixes;
         childContext.incomplete = incomplete;
         if (currentObjectResource) {
            //console.log("Generating new list mapping for "+currentObjectResource);
            listSubject = currentObjectResource;
            listMapping = {};
            listMappingDifferent = true;
         }
         childContext.listMapping = listMapping;
         childContext.language = language;
         childContext.vocabulary = vocabulary;
      }
      if (listMappingDifferent) {
         //console.log("Pushing list parent "+current.localName);
         queue.unshift({ parent: current, context: context, subject: listSubject, listMapping: listMapping});
      }
      for (var child = current.lastChild; child; child = child.previousSibling) {
         if (child.nodeType==Node.ELEMENT_NODE) {
            //console.log("Pushing child "+child.localName);
            queue.unshift({ current: child, context: childContext});
         }
      }
   }

   for (var i=0; i<this.finishedHandlers.length; i++) {
      this.finishedHandlers[i](node);
   }
}


RDFaProcessor.prototype.push = function(parent,subject) {
   return {
      parent: parent,
      subject: subject ? subject : (parent ? parent.subject : null),
      parentObject: null,
      incomplete: [],
      listMapping: parent ? parent.listMapping : {},
      language: parent ? parent.language : this.language,
      prefixes: parent ? parent.prefixes : this.target.prefixes,
      terms: parent ? parent.terms : this.target.terms,
      vocabulary: parent ? parent.vocabulary : this.vocabulary
   };
};

