import LightningDatatable from 'lightning/datatable';
import formulaImageCellTemplate from './formulaImageCellTemplate.html';

// Extends lightning-datatable to register the formulaImage custom column type.
// customTypes only works via class inheritance — passing it as a prop on a wrapper is silently ignored.
export default class ExtDatatable extends LightningDatatable {
    static customTypes = {
        formulaImage: {
            template: formulaImageCellTemplate,
            typeAttributes: ['iconMapping']
        }
    };
}
