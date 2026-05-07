public with sharing class DynamicRecordController {

    public class RecordResult {
        @AuraEnabled public List<FieldMetadata> fieldMetadata { get; set; }
        @AuraEnabled public List<SObject>       records       { get; set; }

        public RecordResult() {
            this.fieldMetadata = new List<FieldMetadata>();
            this.records       = new List<SObject>();
        }
    }

    public class FieldMetadata {
        @AuraEnabled public String apiName { get; set; }
        @AuraEnabled public String label   { get; set; }
        @AuraEnabled public String type    { get; set; }
    }

    @AuraEnabled(cacheable=false)
    public static RecordResult getRecords(
        String       objectApiName,
        List<String> fields,
        String       whereClause
    ) {
        try {
            if (String.isBlank(objectApiName)) {
                throw new AuraHandledException('objectApiName is required.');
            }
            if (fields == null || fields.isEmpty()) {
                throw new AuraHandledException('At least one field is required.');
            }

            // Validate object against Schema — prevents injection via object name
            Schema.SObjectType sObjType = Schema.getGlobalDescribe().get(objectApiName);
            if (sObjType == null) {
                throw new AuraHandledException('Invalid object: ' + objectApiName);
            }
            Schema.DescribeSObjectResult    sObjDescribe = sObjType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap    = sObjDescribe.fields.getMap();

            List<String> safeFields = new List<String>();
            RecordResult result     = new RecordResult();

            for (String rawField : fields) {
                String fieldName = rawField.trim();
                if (String.isBlank(fieldName)) continue;

                // Validate each field against Schema — only Schema-resolved names enter the SOQL string
                Schema.SObjectField sField = fieldMap.get(fieldName.toLowerCase());
                if (sField == null) {
                    throw new AuraHandledException('Invalid field: ' + fieldName + ' on ' + objectApiName);
                }
                Schema.DescribeFieldResult dr = sField.getDescribe();

                FieldMetadata fm = new FieldMetadata();
                fm.apiName = dr.getName();
                fm.label   = dr.getLabel();
                fm.type    = dr.getType().name().toLowerCase();
                result.fieldMetadata.add(fm);

                safeFields.add(dr.getName());
            }

            // Id is always prepended for row keying but kept out of fieldMetadata to avoid an extra column
            if (!safeFields.contains('Id')) {
                safeFields.add(0, 'Id');
            }

            String soql = 'SELECT ' + String.join(safeFields, ', ')
                        + ' FROM '  + sObjDescribe.getName();

            if (!String.isBlank(whereClause)) {
                soql += ' WHERE ' + whereClause;
            }

            soql += ' LIMIT 200';

            result.records = Database.query(soql);
            return result;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Error querying records: ' + e.getMessage());
        }
    }
}
