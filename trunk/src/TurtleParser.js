TurtleParser.prototype = new URIResolver();
TurtleParser.prototype.constructor=TurtleParser;

function TurtleParser() {
   this.reset();
   this.onError = function(lineNumber,msg) {
      console.log(lineNumber+": "+msg);
   };
}

TurtleParser.wsRE = /^\s+/;
TurtleParser.uriRE = /^\<([^>]*)\>/;
TurtleParser.singleQuoteLiteralRE = /^'([^'\n\r]*)'/;
TurtleParser.doubleQuoteLiteralRE = /^\"([^"\n\r]*)\"/;
TurtleParser.longDoubleQuoteLiteralRE = /^\"\"\"((?:[^"\\]*|\\"|\\|\"(?!\")|\"\"(?!\"))*)\"\"\"/;
TurtleParser.longSingleQuoteLiteralRE = /^'''((?:[^'\\]*|\\'|\\|'(?!')|''(?!'))*)'''/;
TurtleParser.typeRE = /^\^\^/;
TurtleParser.dotRE = /^\./;
TurtleParser.openSquareBracketRE = /^\[/;
TurtleParser.closeSquareBracketRE = /^\]/;
TurtleParser.prefixRE = /^(\w*):/;
TurtleParser.blankNodeLabelRE = /^(_:\w+)/;
TurtleParser.curieRE = /^(\w+:)(\w+)/;
TurtleParser.localNameRE = /^(\w+)/;
TurtleParser.langRE = /^@(\w+)/;
TurtleParser.prefixIDRE = /^@prefix/;
TurtleParser.baseRE = /^@base/;
TurtleParser.sparqlPrefixRE = /^PREFIX/;
TurtleParser.sparqlBaseRE = /^BASE/;
TurtleParser.semicolonRE = /^;/;
TurtleParser.commaRE = /^,/;
TurtleParser.aRE = /^a/;
TurtleParser.openParenRE = /^\(/;
TurtleParser.closeParenRE = /^\)/;
TurtleParser.integerRE = /^([+-]?[0-9]+)/;
TurtleParser.decimalRE = /^([+-]?[0-9]*\.[0-9]+)/;
TurtleParser.doubleRE = /^([+-]?(?:[0-9]+\.[0-9]*[eE][+-]?[0-9]+|\.[0-9]+[eE][+-]?[0-9]+|[0-9]+[eE][+-]?[0-9]+))/;
TurtleParser.booleanRE = /^(true|false)/;

TurtleParser.typeURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
TurtleParser.objectURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
TurtleParser.plainLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
TurtleParser.nilURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";
TurtleParser.firstURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#first";
TurtleParser.restURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";
TurtleParser.xsdStringURI = "http://www.w3.org/2001/XMLSchema#string";
TurtleParser.xsdIntegerURI = "http://www.w3.org/2001/XMLSchema#integer";
TurtleParser.xsdDecimalURI = "http://www.w3.org/2001/XMLSchema#decimal";
TurtleParser.xsdDoubleURI = "http://www.w3.org/2001/XMLSchema#double";
TurtleParser.xsdBooleanURI = "http://www.w3.org/2001/XMLSchema#boolean";

TurtleParser.prototype.reset = function() {
   this.context = {
      curieParser: {
         trim: function(str) {
            return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
         },
         parse: function(value,resolve) {
            value = this.trim(value);
            if (value.charAt(0)=='[' && value.charAt(value.length-1)==']') {
               value = value.substring(1,value.length-1);
            }
            var colon = value.indexOf(":");
            if (colon>=0) {
               var prefix = value.substring(0,colon);
               if (prefix=="") {
                  // default prefix
                  var uri = dataContext.prefixes[""];
                  return uri ? uri+value.substring(colon+1) : null;
               } else if (prefix=="_") {
                  // blank node
                  return "_:"+value.substring(colon+1);
               } else if (DocumentData.NCNAME.test(prefix)) {
                  var uri = dataContext.prefixes[prefix];
                  if (uri) {
                     return uri+value.substring(colon+1);
                  }
               }
            }
   
            return resolve ? dataContext.baseURI.resolve(value) : value;
         }
      },
      graph: {},
      prefixes: {},
      base: null
   };
   this.blankNodeCounter = 0;
   this.errorCount = 0;
   this.lineNumber = 1;
}

TurtleParser.prototype.getGraph = function() {
   return this.context.graph;
}

TurtleParser.prototype.newBlankNode = function() {
   this.blankNodeCounter++;
   return "_:"+this.blankNodeCounter;
}

TurtleParser.prototype._match = function(re,text) {
   var match = re.exec(text);
   return match ? { text: match[0], remaining: text.substring(match[0].length), values: match.length>1 ? match.splice(1) : null} : null;
}

TurtleParser.prototype._trim = function(text) {
   var match = TurtleParser.wsRE.exec(text);
   if (match) {
      this.lineNumber += (match[0].split(/\n/).length-1);
   }
   return match ? text.substring(match[0].length) : text;
}

TurtleParser.prototype.reportError = function(msg) {
   this.onError(this.lineNumber,msg);
}

TurtleParser.prototype.parse = function(text) {
   while (text.length>0) {
      text = this._trim(text);
      if (text.length>0) {
        text = this.parseStatement(text);
      }
   }
}

TurtleParser.prototype.parseStatement = function(text) {
   var match = this._match(TurtleParser.prefixIDRE,text);
   if (match) {
      // prefix
      var remaining = this._trim(match.remaining);
      match = this.parsePrefixName(remaining);
      if (!match) {
         this.reportError("Cannot parse prefix after @prefix: "+text.substring(20)+"...");
         this.errorCount++;
         return remaining;
      }
      var prefix = match.prefix;
      
      remaining = this._trim(match.remaining);
      match = this.parseIRIReference(remaining);
      if (!match) {
         this.reportError("Cannot parse IRI after @prefix: "+remaining.substring(20)+"...");
         this.errorCount++;
         return remaining;
      }
      this.context.prefixes[prefix] = this.context.base ? this.context.base.resolve(match.iri) : match.iri;
      
      remaining = this._trim(match.remaining);
      match = this._match(TurtleParser.dotRE,remaining);
      if (match) {
         return match.remaining;
      } else {
         this.reportError("Missing end . for @prefix statement.  Found: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
   } 
   match = this._match(TurtleParser.baseRE,text);
   if (match) {
      // base
      var remaining = this._trim(match.remaining);
      match = this.parseIRIReference(remaining);
      if (!match) {
         this.reportError("Cannot parse IRI after @base: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
      this.context.base = this.parseURI(match.iri);
      
      remaining = this._trim(match.remaining);
      match = this._match(TurtleParser.dotRE,remaining);
      if (match) {
         return match.remaining;
      } else {
         this.reportError("Missing end . for @base statement.  Found: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
   }
   match = this._match(TurtleParser.sparqlPrefixRE,text);
   if (match) {
      // sparql prefix
      var remaining = this._trim(match.remaining);
      match = this.parsePrefixName(remaining);
      if (!match) {
         this.reportError("Cannot parse prefix after PREFIX: "+text.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
      var prefix = match.prefix;
      
      remaining = this._trim(match.remaining);
      match = this.parseIRIReference(remaining);
      if (!match) {
         this.reportError("Cannot parse IRI after PREFIX: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
      this.context.prefixes[prefix] = this.context.base ? this.context.base.resolve(match.iri) : match.iri;
      return match.remaining;
   }
   match = this._match(TurtleParser.sparqlBaseRE,text);
   if (match) {
      // sparql base
      var remaining = this._trim(match.remaining);
      match = this.parseIRIReference(remaining);
      if (!match) {
         this.reportError("Cannot parse IRI after BASE: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
      this.context.base = this.parseURI(match.iri);
      
      return match.remaining;      
   }
   
   // triples
   text = this.parseTriples(text);
   text = this._trim(text);
   match = this._match(TurtleParser.dotRE,text);
   if (match) {
      return match.remaining;
   } else {
      this.reportError("Missing end . triples.  Found: "+text.substring(0,20)+"...");
      this.errorCount++;
      return text;
   }
   
}

TurtleParser.prototype.parseTriples = function(text) {

   // TODO:  blankNodePropertyList predicateObjectList?
   // TODO: collection as subject
   var match =  this.parseIRI(text);
   if (!match) {
      match = this.parseBlankNode(text);
   }
   if (!match) {
      // end the parse
      this.reportError("Terminating: Cannot parse at "+text.substring(0,20)+" ...");
      this.errorCount++;
      return "";
   }
   
   return this.parsePredicateObjectList(match.iri,this._trim(match.remaining));
}

TurtleParser.prototype.parsePredicateObjectList = function(subject,text,allowEmpty) {
   var more = true;
   var remaining = null;
   do {
      var match = this.parseIRI(text);
      if (!match) {
         match = this._match(TurtleParser.aRE,text);
         if (match) {
            match.iri = TurtleParser.typeURI;
         }
      }
      if (!match) {   
         if (allowEmpty) {
            return text;
         }
         this.reportError("Terminating: Cannot parse predicate IRI.");
         this.errorCount++;
         return "";
      }
      remaining = this.parseObjectList(subject,match.iri,this._trim(match.remaining));
      match = this._match(TurtleParser.semicolonRE,this._trim(remaining));
      if (match) {
         text = this._trim(match.remaining);
      } else {
         more = false;
      }
   } while (more);
   return remaining;
}

TurtleParser.prototype.parseObjectList = function(subject,predicate,text) {
   var more = true;
   var remaining = null;
   do {
      remaining = this.parseObject(subject,predicate,text);
      match = this._match(TurtleParser.commaRE,this._trim(remaining));
      if (match) {
         text = this._trim(match.remaining);
      } else {
         more = false;
      }
   } while (more);
   return remaining;
}

TurtleParser.prototype.parseObject = function(subject,predicate,text) {
   var match =  this.parseIRI(text);
   if (match) {
      // object reference, generate triple
      this.addTriple(subject,predicate,{ type: TurtleParser.objectURI, value: match.iri});
      return match.remaining;
   }
   match = this._match(TurtleParser.openParenRE,text);
   if (match) {
      // collection
      var collectionSubject = subject;
      var collectionPredicate = predicate;
      var remaining = match.remaining;
      do {
      
         var remaining = this._trim(remaining);
         
         // try closing the collection
         match = this._match(TurtleParser.closeParenRE,remaining);
         if (match) {
            this.addTriple(collectionSubject,collectionSubject==subject ? predicate : TurtleParser.restURI,{ type: TurtleParser.objectURI, value: TurtleParser.nilURI});
            return match.remaining;
         }
         
         var nextSubject = this.newBlankNode();
         // there must be an object
         if (collectionSubject==subject) {
            this.addTriple(subject,predicate,{ type: TurtleParser.objectURI, value: nextSubject});
         } else {
            this.addTriple(collectionSubject,TurtleParser.restURI,{ type: TurtleParser.objectURI, value: nextSubject});
         }
         collectionSubject = nextSubject;
         collectionPredicate = TurtleParser.firstURI;
         var remaining = this.parseObject(collectionSubject,collectionPredicate,remaining);
      } while (remaining.length>0);
   }
   match = this._match(TurtleParser.openSquareBracketRE,text);
   if (match) {
      var newSubject = this.newBlankNode();
      this.addTriple(subject,predicate,{ type: TurtleParser.objectURI, value: newSubject});
      var remaining = this.parsePredicateObjectList(newSubject,this._trim(match.remaining),true);
      remaining = this._trim(remaining);
      match = this._match(TurtleParser.closeSquareBracketRE,remaining);
      if (match) {
         return match.remaining;
      } else {
         this.reportError("Missing close square bracket ']' for blank node "+newSubject+" predicate object list");
         this.errorCount++;
         return remaining;
      }
   }
   var match = this.parseLiteral(text);
   if (match) {
      this.addTriple(subject,predicate,{ type: match.type ? match.type : TurtleParser.plainLiteralURI, value: match.literal, language: match.language});
      return match.remaining;
   }
   this.reportError("Terminating: Cannot parse literal at "+text.substring(0,20));
   this.errorCount++;
   return "";
}

TurtleParser.prototype.parseBlankNode = function(text) {

   var match = this._match(TurtleParser.blankNodeLabelRE,text);
   if (match) {
      match.iri = match.values[0];
      return match;
   }
   match =  this._match(TurtleParser.openSquareBracketRE,text);
   if (match) {
      remaining = this._trim(match.remaining);
      match =  this._match(TurtleParser.closeSquareBracketRE,remaining);
      if (match) {
         match.iri = this.newBlankNode();
         return match;
      } else {
         this.reportError("Missing close square bracket ']': "+remaining.substring(0,20)+" ...");
         this.errorCount++;
         // attempt to recover
         return { iri: this.newBlankNode(), remaining: remaining };
      }
   }
   return null;
}

TurtleParser.prototype.parsePrefixName = function(text) {
   var match = this._match(TurtleParser.prefixRE,text);
   if (match) {
      match.prefix = match.values[0];
   }
   return match;
}

TurtleParser.prototype.parseIRIReference = function(text) {
   var match = this._match(TurtleParser.uriRE,text);
   if (match) {
      match.iri = match.values[0];
   }
   return match;
}

TurtleParser.prototype.parseIRI = function(text) {
   var match = this._match(TurtleParser.uriRE,text);
   if (match) {
      match.iri = this.context.base ? this.context.base.resolve(match.values[0]) : match.values[0];
      return match;
   }
   match = this._match(TurtleParser.prefixRE,text);
   if (match) {
      var prefix = match.values[0];
      var ns = prefix=="_" ? "_:" : this.context.prefixes[prefix];
      if (!ns) {
         this.reportError("No prefix mapping for "+prefix);
         this.errorCount++;
         return null;
      }
      var remaining = match.remaining;
      match = this._match(TurtleParser.localNameRE,remaining);
      if (match) {
         match.iri = ns+match.values[0];
         return match;
      } else {
         return ns;
      }
   }
   return null;
}

TurtleParser.prototype.parseLiteral = function(text) {
   var match = this._match(TurtleParser.longDoubleQuoteLiteralRE,text);
   if (!match) {
      match = this._match(TurtleParser.longSingleQuoteLiteralRE,text);
   }
   if (!match) {
      match = this._match(TurtleParser.singleQuoteLiteralRE,text);
   }
   if (!match) {
      match = this._match(TurtleParser.doubleQuoteLiteralRE,text);
   }
   
   if (match) {
      var literal = match.values[0];
      var remaining = match.remaining;
      match = this._match(TurtleParser.langRE,remaining);
      if (match) {
         match.literal = literal;
         match.language = match.values[0];
         return match;
      }
      match = this._match(TurtleParser.typeRE,remaining);
      if (match) {
         var remaining = match.remaining;
         match = this.parseIRI(remaining);
         if (match) {
            match.literal = literal;
            match.type = match.iri;
            return match;
         } else {
            this.reportError("Missing type URI after ^^");
            this.errorCount++;
            return { literal: literal, remaining: remaining}
         }
      }
      return { literal: literal, remaining: remaining};
   }
   
   match = this._match(TurtleParser.doubleRE,text);
   if (match) {
      match.literal = match.values[0];
      match.type = TurtleParser.xsdDoubleURI;
      return match;
   }
   
   match = this._match(TurtleParser.decimalRE,text);
   if (match) {
      match.literal = match.values[0];
      match.type = TurtleParser.xsdDecimalURI;
      return match;
   }
   match = this._match(TurtleParser.integerRE,text);
   if (match) {
      match.literal = match.values[0];
      match.type = TurtleParser.xsdIntegerURI;
      return match;
   }
   match = this._match(TurtleParser.booleanRE,text);
   if (match) {
      match.literal = match.values[0];
      match.type = TurtleParser.xsdBooleanURI;
      return match;
   }
   return null;
   
}

TurtleParser.prototype.newSubject = function(subject) {
   var snode = this.context.graph[subject];
   if (!snode) {
      snode = new RDFaSubject(this.context,subject);
      this.context.graph[subject] = snode;
   }
   return snode;
}


TurtleParser.prototype.addTriple = function(subject,predicate,object) {
   //console.log("Triple: "+subject+" "+predicate+" "+JSON.stringify(object));
   var snode = this.newSubject(subject);
   var pnode = snode.predicates[predicate];
   if (!pnode) {
      pnode = new RDFaPredicate(predicate);
      snode.predicates[predicate] = pnode;
   }
   pnode.objects.push(object);   
   if (predicate==TurtleParser.typeURI) {
      snode.types.push(object.value);
   }
}