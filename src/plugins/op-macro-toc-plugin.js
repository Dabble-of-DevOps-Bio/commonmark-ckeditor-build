// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from '../icons/play.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import { downcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import {upcastElementToElement} from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';

export default class OPMacroTocPlugin extends Plugin {

	static get pluginName() {
		return 'OPMacroToc';
	}


	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;

		// Schema.
		model.schema.register( 'op-macro-toc', {
			allowWhere: '$block',
			isBlock: false,
		    isLimit: false
		});

		conversion.for( 'upcast' )
			.add( upcastElementToElement( {
				view: {
					name: 'macro',
					classes: 'toc'
				},
				model: 'op-macro-toc'
			} ) );


		conversion.for( 'editingDowncast' ).add( downcastElementToElement({
			model: 'op-macro-toc',
			view: (modelElement, viewWriter) => {
				return toWidget(this.createTocViewElement(viewWriter), viewWriter, { label: this.label } )
			}
	    } ));

		conversion.for('dataDowncast').add(downcastElementToElement({
			model: 'op-macro-toc',
			view: (modelElement, viewWriter) => {
				return this.createTocDataElement(viewWriter)
			}
		}));

		editor.ui.componentFactory.add( 'insertToc', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: this.label,
				icon: imageIcon,
				tooltip: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				editor.model.change( writer => {
					const tocElement = writer.createElement( 'op-macro-toc', {});

					// Insert the image in the current selection location.
					editor.model.insertContent( tocElement, editor.model.document.selection );
				} );
			} );

			return view;
		} );
	}

	get label() {
		return window.I18n.t('js.editor.macro.toc');
	}

	createTocViewElement(writer) {
		const that = this;
		return writer.createUIElement( 'div', { class: 'macro -toc' }, function(containerDocument) {
			const containerElement = this.toDomElement(containerDocument);
			containerElement.innerHTML = imageIcon + '<div class="macro--description">' + that.label + '</div>';

			return containerElement;
		} );
	}

	createTocDataElement(writer) {
		return writer.createContainerElement('macro', { class: 'toc' } );
	}

}
