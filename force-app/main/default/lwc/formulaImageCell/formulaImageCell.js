import { LightningElement, api } from 'lwc';

export default class FormulaImageCell extends LightningElement {
    @api value;
    @api iconMapping = {};

    get resolvedIcons() {
        if (!this.value || !this.iconMapping) return [];
        const raw = this.iconMapping[this.value];
        if (!raw) return [];
        const icons = Array.isArray(raw) ? raw : [raw];
        return icons.map((iconName, index) => ({
            key: `${iconName}_${index}`,
            iconName,
            alternativeText: this.value,
            title: this.value
        }));
    }

    get hasIcons() {
        return this.resolvedIcons.length > 0;
    }

    get hasValue() {
        return this.value != null && this.value !== '';
    }
}
