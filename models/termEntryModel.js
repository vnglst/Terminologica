var mongoose = require('mongoose'),
	Schemas = require('./Schemas.js'),
	SubjectField = require('../models/subjectFieldModel'),
	url = require('../lib/url');

var termEntryModel = function() {

	var termEntrySchema = Schemas.termEntrySchema;

	// If PORT varialbe is not set to production, assume development
	if (process.env.PORT != "production") {
		// activate debugging info for database
		// mongoose.set('debug', true);

		// automatically check indexing status database at startup
		termEntrySchema.set('autoIndex', true);
	}

	// Returns an array of TERM OBJECTS for the specified language
	// e.g. getTranslations('de') returns all the german objects
	termEntrySchema.methods.getTranslations = function(language) {
		return this.langSet.filter(function(term) {
			return term.lang === language;
		});
	};

	// Returns an array of German STRINGS for all termEntries in the array
	// e.g. getTranslations(termEntries) returns all the German strings
	termEntrySchema.statics.getGermanTranslations = function(termEntries) {
		var germanTerms = [];
		termEntries.forEach(function(termEntry) {
			var translations = termEntry.getTranslations('de');
			germanTerms = germanTerms.concat(translations);
		});

		return germanTerms.map(function(term) {
			return term.termStr;
		});
	};

	// returns an array of objects
	// with separate arrays for Dutch and German terms
	// for each term entry id
	// subjectfields are also converted to strings + urls
	termEntrySchema.statics.separateLanguages = function(termEntries) {
		return termEntries.map(function(termEntry) {
			// Convert subjectField numbers to array of strings
			var subjectFieldStrs = SubjectField.getSubjectFieldStrs(termEntry.subjectField);
			// Generate URL for these strings
			var subjectFieldsWithURLs = url.encodeSlugArr(subjectFieldStrs);
			return {
				id: termEntry.id,
				subjectFields: subjectFieldsWithURLs,
				de: termEntry.getTranslations('de'),
				nl: termEntry.getTranslations('nl')
			};
		});
	};

	// returns a dictionary entry
	// with an array of Dutch translations
	// complete with id + subjectfields for each translations
	// subjectfields are also converted to strings + urls
	termEntrySchema.statics.getDictionaryEntries = function(termEntries) {
		var arr = termEntrySchema.statics.separateLanguages(termEntries);
		return arr.map(function(termEntry) {
			return {
				id: termEntry.id,
				subjectFields: termEntry.subjectFields,
				termStrArr: termEntry.nl.map(function(e) {
					return e.termStr;
				})
			};
		});
	};

	return mongoose.model('TermEntry', termEntrySchema);
};

module.exports = new termEntryModel();
