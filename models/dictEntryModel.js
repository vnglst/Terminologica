var mongoose = require('mongoose'),
	Schemas = require('./Schemas.js'),
	SubjectField = require('../models/subjectFieldModel'),
	url = require('../lib/url');

var resolveSubjectFields = function (dictEntries) {
	// return false if no results
	if (dictEntries.length === 0) return false;
	return dictEntries.map(function (dictEntry) {
		// resolve [12, 44] to ["example subjectField", "second ..."]
		var subjectFieldsAsStrings = SubjectField.toStrArr(dictEntry.subjectFields);
		// convert ["str", "str"] to [{ str, url}, {str, url}]
		var subjectFieldsWithURLs = url.encodeSlugArr(subjectFieldsAsStrings);
		return {
			id: dictEntry.id,
			de: dictEntry.de,
			nl: dictEntry.nl,
			note: dictEntry.note || '',
			subjectFields: subjectFieldsWithURLs
		};
	});
};

var dictEntryModel = function () {
	var dictEntrySchema = Schemas.dictEntrySchema;

	// If PORT varialbe is not set to production, assume development
	if (process.env.PORT != 'production') {
		// activate debugging info for database
		// mongoose.set('debug', true);
		// automatically check indexing status database at startup
		dictEntrySchema.set('autoIndex', true);
	}

	//
	dictEntrySchema.statics.findTranslation = function (sourceWord) {
		return this.find({
				'de': sourceWord
			})
			.limit(10)
			.exec()
			.then(resolveSubjectFields)
			.then(function (dictEntries) {
				return dictEntries;
			});
	};

	//
	dictEntrySchema.statics.getPage = function (number) {
		var resultsPerPage = 100;
		var pageNumber = number;
		return this.find({})
			// .sort('de')
			.skip(resultsPerPage * pageNumber)
			.limit(resultsPerPage)
			.exec()
			.then(resolveSubjectFields)
			.then(function (dictEntries) {
				return dictEntries;
			});
	};

	//
	dictEntrySchema.statics.getTotalPages = function () {
		var resultsPerPage = 100;
		return this.count({})
			.exec()
			.then(function ( count ) {
				return Math.floor( count / resultsPerPage);
			});
	};

	return mongoose.model('DictEntry', dictEntrySchema);
};

module.exports = new dictEntryModel();
