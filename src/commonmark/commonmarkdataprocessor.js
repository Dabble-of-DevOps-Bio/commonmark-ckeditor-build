/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module markdown-gfm/commonmarkdataprocessor
 */

/* eslint-env browser */

import HtmlDataProcessor from '@ckeditor/ckeditor5-engine/src/dataprocessor/htmldataprocessor';
import DomConverter from '@ckeditor/ckeditor5-engine/src/view/domconverter';
import {highlightedCodeBlock} from 'turndown-plugin-gfm';
import TurndownService from 'turndown';
import {textNodesPreprocessor, linkPreprocessor} from './utils/preprocessor';
import {removeParagraphsInLists} from './utils/paragraph-in-lists';
import {fixEmptyCodeBlocks} from "./utils/fix-empty-code-blocks";

export const originalSrcAttribute = 'data-original-src';

/**
 * This data processor implementation uses CommonMark as input/output data.
 *
 * @implements module:engine/dataprocessor/dataprocessor~DataProcessor
 */
export default class CommonMarkDataProcessor {
	constructor(document) {
		this._htmlDP = new HtmlDataProcessor(document);
		this._domConverter = new DomConverter(document);
	}

	/**
	 * Converts the provided CommonMark string to view tree.
	 *
	 * @param {String} data A CommonMark string.
	 * @returns {module:engine/view/documentfragment~DocumentFragment} The converted view element.
	 */
	toView( data ) {
		const md = require( 'markdown-it' )( {
			// Output html
			html: true,
			// Use GFM language fence prefix
			langPrefix: 'language-',
		} );

		// Use tasklist plugin
		let taskLists = require('markdown-it-task-lists');
		let parser = md.use(taskLists, {label: true});

		const html = parser.render( data );

		// Convert input HTML data to DOM DocumentFragment.
		const domFragment = this._htmlDP._toDom( html );

		// Fix some CommonMark specifics
		// Paragraphs within list elements (https://community.openproject.com/work_packages/28765)
		removeParagraphsInLists( domFragment );

		// Fix empty code blocks
		fixEmptyCodeBlocks( domFragment );

		// Convert DOM DocumentFragment to view DocumentFragment.
		return this._domConverter.domToView( domFragment );
	}

	/**
	 * Converts the provided {@link module:engine/view/documentfragment~DocumentFragment} to data format &mdash; in this
	 * case to a CommonMark string.
	 *
	 * @param {module:engine/view/documentfragment~DocumentFragment} viewFragment
	 * @returns {String} CommonMark string.
	 */
	toData( viewFragment ) {
		// Convert view DocumentFragment to DOM DocumentFragment.
		const domFragment = this._domConverter.viewToDom( viewFragment, document );

		// Replace leading and trailing nbsp at the end of strong and em tags
		// with single spaces
		textNodesPreprocessor(
			domFragment,
			['strong', 'em', 'span'],
			// Ensure tables are allowed to have HTML contents
			// OP#29457
			['pre', 'code', 'table']
		);

		// Replace link attributes with their computed href attribute
		linkPreprocessor(domFragment);

		// Use Turndown to convert DOM fragment to markdown
		const turndownService = new TurndownService( {
			headingStyle: 'atx',
			codeBlockStyle: 'fenced'
		} );

		turndownService.use([
			highlightedCodeBlock,
		]);

		// Replace todolist with markdown representation
		turndownService.addRule('todolist', {
			filter: function (node) {
				// check if we're a todo list item
				return node.nodeName === 'LI' && node.closest('ul.todo-list');
			},
			replacement: function (content, node, options) {
				// content = content
				// 	.replace(/^\n+/, '') // remove leading newlines
				// 	.replace(/\n+$/, '\n') // replace trailing newlines with just a single one
				// 	.replace(/\n/gm, '\n    '); // indent

				var prefix = options.bulletListMarker + '   ';
				var input = node.querySelector('input[type=checkbox]');
				var tasklist = (input && input.checked) ? '[x] ' : '[ ] ';
				return prefix + tasklist + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
			}
		});

		turndownService.addRule('imageFigure', {
			filter: 'img',
			replacement: function (content, node) {
				return node.parentElement.parentElement.outerHTML;
			}
		});

		// Remove figcaption text, it is processed together with the
		// figure and the image in the imageFigure rule
		turndownService.addRule('figcaption', {
			filter: 'figcaption',
			replacement: function (content, node) {
				return '';
			}
		});

		// Keep HTML tables and remove filler elements
		turndownService.addRule('htmlTables', {
			filter: function (node) {
				const tables = node.getElementsByTagName('table');
				// check if we're a todo list item
				return node.nodeName === 'FIGURE' && tables.length;
			},
			replacement: function (_content, node) {
				// Remove filler nodes
				node.querySelectorAll('td br[data-cke-filler]')
					.forEach((node) => node.remove());

				return node.outerHTML;
			}
		});

		turndownService.addRule('strikethrough', {
			filter: ['del', 's', 'strike'],
			replacement: function (content) {
				return '~~' + content + '~~'
			}
		});

		turndownService.addRule( 'openProjectMacros', {
			filter: [ 'macro' ],
			replacement: ( _content, node ) => {
				node.innerHTML = '';
				var outer = node.outerHTML;
				return outer.replace("</macro>", "\n</macro>")
			}
		});

		turndownService.addRule( 'mentions', {
			filter: (node) => {
				return (
					node.nodeName === 'MENTION' &&
					node.classList.contains('mention')
				)
			},
			replacement: ( _content, node ) => node.outerHTML,
		});

		return turndownService.turndown( domFragment );
	}
}
