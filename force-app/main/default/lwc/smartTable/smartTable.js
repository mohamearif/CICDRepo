import { LightningElement, api, track } from 'lwc';
import getRecords from '@salesforce/apex/DynamicRecordController.getRecords';

// Maps Salesforce field types returned by Apex to lightning-datatable column types
const FIELD_TYPE_MAP = {
    string:          'text',
    picklist:        'text',
    multipicklist:   'text',
    textarea:        'text',
    id:              'text',
    reference:       'text',
    boolean:         'boolean',
    currency:        'currency',
    date:            'date',
    datetime:        'date',
    double:          'number',
    integer:         'number',
    long:            'number',
    percent:         'percent',
    phone:           'phone',
    url:             'url',
    email:           'email'
};

export default class SmartTable extends LightningElement {
    @api keyField = 'Id';
    @api title = '';

    _objectApiName = 'Account';
    @api
    get objectApiName() {
        return this._objectApiName;
    }
    set objectApiName(value) {
        this._objectApiName = value;
        this._columnsCache = null;
    }

    _fields = [];
    @api
    get fields() {
        return this._fields;
    }
    set fields(value) {
        if (typeof value === 'string') {
            this._fields = value.split(',').map(f => f.trim()).filter(Boolean);
        } else {
            this._fields = Array.isArray(value) ? [...value] : [];
        }
        this._columnsCache = null;
    }

    _filtersString = '';
    @api
    get filters() {
        return this._filtersString;
    }
    set filters(value) {
        if (typeof value === 'string') {
            this._filtersString = value;
        } else if (value && typeof value === 'object') {
            this._filtersString = this._buildFilterString(value);
        } else {
            this._filtersString = '';
        }
    }

    // Optional: fully override auto-generated columns
    _columnsOverride = null;
    @api
    get columns() {
        return this._columnsOverride;
    }
    set columns(value) {
        this._columnsOverride = Array.isArray(value) ? value : null;
    }

    // Per-field type overrides: { FieldApiName: { type, typeAttributes } }
    // Lets callers inject custom column types (e.g. formulaImage) without knowing field labels.
    _columnTypeOverrides = {};
    @api
    get columnTypeOverrides() {
        return this._columnTypeOverrides;
    }
    set columnTypeOverrides(value) {
        this._columnTypeOverrides = (value && typeof value === 'object') ? value : {};
        this._columnsCache = null;
    }

    @track records = [];
    @track isLoading = false;
    @track errorMessage = null;
    @track sortedBy = null;
    @track sortedDirection = 'asc';

    _columnsCache = null;

    connectedCallback() {
        this._loadRecords();
    }

    async _loadRecords() {
        if (!this._objectApiName || this._fields.length === 0) return;

        this.isLoading = true;
        this.errorMessage = null;

        try {
            const result = await getRecords({
                objectApiName: this._objectApiName,
                fields: this._fields,
                whereClause: this._filtersString || ''
            });

            this.records = result.records || [];

            if (!this._columnsOverride && !this._columnsCache) {
                this._columnsCache = this._buildColumns(result.fieldMetadata);
            }
        } catch (error) {
            this.errorMessage =
                (error.body && error.body.message) ||
                error.message ||
                'An unknown error occurred.';
            this.records = [];
        } finally {
            this.isLoading = false;
        }
    }

    _buildColumns(fieldMetadata) {
        if (!fieldMetadata || fieldMetadata.length === 0) return [];

        return fieldMetadata.map(meta => {
            const override = this._columnTypeOverrides[meta.apiName];
            if (override) {
                return {
                    label: meta.label,
                    fieldName: meta.apiName,
                    type: override.type,
                    typeAttributes: override.typeAttributes || {},
                    sortable: true,
                    cellAttributes: { alignment: 'left' }
                };
            }

            return {
                label: meta.label,
                fieldName: meta.apiName,
                type: FIELD_TYPE_MAP[meta.type] || 'text',
                sortable: true,
                cellAttributes: { alignment: 'left' }
            };
        });
    }

    _buildFilterString(filterObj) {
        return Object.entries(filterObj)
            .map(([field, val]) => `${field} = '${String(val).replace(/'/g, "\\'")}'`)
            .join(' AND ');
    }

    get resolvedColumns() {
        return this._columnsOverride || this._columnsCache || [];
    }

    get hasData() {
        return !this.isLoading && !this.errorMessage && this.records.length > 0;
    }

    get isEmpty() {
        return !this.isLoading && !this.errorMessage && this.records.length === 0;
    }

    get hasError() {
        return !!this.errorMessage;
    }

    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;
        this.sortedBy = fieldName;
        this.sortedDirection = sortDirection;
        this.records = [...this.records].sort((a, b) => {
            const valA = a[fieldName] != null ? a[fieldName] : '';
            const valB = b[fieldName] != null ? b[fieldName] : '';
            const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
            return sortDirection === 'asc' ? cmp : -cmp;
        });
    }
}
