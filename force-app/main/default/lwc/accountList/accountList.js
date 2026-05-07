import { LightningElement } from 'lwc';

const ACCOUNT_SOURCE_ICON_MAP = {
    Web:           'utility:world',
    Email:         'utility:email',
    Phone:         'utility:phone',
    Advertisement: 'utility:ad_set',
    Partner:       'utility:partner_fund',
    Internal:      'utility:company',
    Other:         'utility:help'
};

export default class AccountList extends LightningElement {
    accountFields = ['Name', 'AccountSource', 'Phone', 'Industry'];

    columnTypeOverrides = {
        AccountSource: {
            type: 'formulaImage',
            typeAttributes: { iconMapping: ACCOUNT_SOURCE_ICON_MAP }
        }
    };
}
