// backend/src/utils/formTemplates.js
const formTemplates = {
    newPatientIntake: {
        name: 'New Patient Intake Form',
        description: 'Comprehensive intake form for new patients',
        type: 'intake',
        preview: 'Collects patient demographics, medical history, and insurance information',
        data: {
            sections: [
                {
                    id: 'personal-info',
                    title: 'Personal Information',
                    fields: [
                        {
                            id: 'firstName',
                            type: 'text',
                            label: 'First Name',
                            required: true,
                            placeholder: 'Enter your first name'
                        },
                        {
                            id: 'lastName',
                            type: 'text',
                            label: 'Last Name',
                            required: true,
                            placeholder: 'Enter your last name'
                        },
                        {
                            id: 'dateOfBirth',
                            type: 'date',
                            label: 'Date of Birth',
                            required: true
                        },
                        {
                            id: 'gender',
                            type: 'select',
                            label: 'Gender',
                            required: true,
                            options: [
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' },
                                { value: 'other', label: 'Other' },
                                { value: 'prefer_not_to_say', label: 'Prefer not to say' }
                            ]
                        },
                        {
                            id: 'ssn',
                            type: 'text',
                            label: 'Social Security Number',
                            required: false,
                            mask: '###-##-####',
                            encrypted: true
                        },
                        {
                            id: 'email',
                            type: 'email',
                            label: 'Email Address',
                            required: true,
                            placeholder: 'your@email.com'
                        },
                        {
                            id: 'phone',
                            type: 'phone',
                            label: 'Phone Number',
                            required: true,
                            mask: '(###) ###-####'
                        },
                        {
                            id: 'address',
                            type: 'address',
                            label: 'Home Address',
                            required: true,
                            subfields: ['street', 'city', 'state', 'zip']
                        }
                    ]
                },
                {
                    id: 'emergency-contact',
                    title: 'Emergency Contact',
                    fields: [
                        {
                            id: 'emergencyName',
                            type: 'text',
                            label: 'Emergency Contact Name',
                            required: true
                        },
                        {
                            id: 'emergencyRelationship',
                            type: 'text',
                            label: 'Relationship',
                            required: true
                        },
                        {
                            id: 'emergencyPhone',
                            type: 'phone',
                            label: 'Emergency Contact Phone',
                            required: true,
                            mask: '(###) ###-####'
                        }
                    ]
                },
                {
                    id: 'medical-history',
                    title: 'Medical History',
                    fields: [
                        {
                            id: 'allergies',
                            type: 'textarea',
                            label: 'Known Allergies',
                            placeholder: 'List any allergies to medications, foods, or other substances',
                            required: false
                        },
                        {
                            id: 'currentMedications',
                            type: 'repeater',
                            label: 'Current Medications',
                            fields: [
                                {
                                    id: 'medicationName',
                                    type: 'text',
                                    label: 'Medication Name'
                                },
                                {
                                    id: 'dosage',
                                    type: 'text',
                                    label: 'Dosage'
                                },
                                {
                                    id: 'frequency',
                                    type: 'text',
                                    label: 'Frequency'
                                }
                            ]
                        },
                        {
                            id: 'medicalConditions',
                            type: 'checkbox-group',
                            label: 'Do you have any of the following conditions?',
                            options: [
                                { value: 'diabetes', label: 'Diabetes' },
                                { value: 'hypertension', label: 'High Blood Pressure' },
                                { value: 'heart_disease', label: 'Heart Disease' },
                                { value: 'asthma', label: 'Asthma' },
                                { value: 'cancer', label: 'Cancer' },
                                { value: 'arthritis', label: 'Arthritis' },
                                { value: 'depression', label: 'Depression' },
                                { value: 'anxiety', label: 'Anxiety' }
                            ]
                        },
                        {
                            id: 'otherConditions',
                            type: 'textarea',
                            label: 'Other Medical Conditions',
                            placeholder: 'Please list any other medical conditions',
                            showIf: { field: 'medicalConditions', contains: 'other' }
                        }
                    ]
                },
                {
                    id: 'insurance-info',
                    title: 'Insurance Information',
                    fields: [
                        {
                            id: 'hasInsurance',
                            type: 'radio',
                            label: 'Do you have health insurance?',
                            required: true,
                            options: [
                                { value: 'yes', label: 'Yes' },
                                { value: 'no', label: 'No' }
                            ]
                        },
                        {
                            id: 'insuranceProvider',
                            type: 'text',
                            label: 'Insurance Provider',
                            required: true,
                            showIf: { field: 'hasInsurance', equals: 'yes' }
                        },
                        {
                            id: 'policyNumber',
                            type: 'text',
                            label: 'Policy Number',
                            required: true,
                            showIf: { field: 'hasInsurance', equals: 'yes' }
                        },
                        {
                            id: 'groupNumber',
                            type: 'text',
                            label: 'Group Number',
                            showIf: { field: 'hasInsurance', equals: 'yes' }
                        },
                        {
                            id: 'insuranceCardFront',
                            type: 'file',
                            label: 'Insurance Card (Front)',
                            accept: 'image/*',
                            showIf: { field: 'hasInsurance', equals: 'yes' }
                        },
                        {
                            id: 'insuranceCardBack',
                            type: 'file',
                            label: 'Insurance Card (Back)',
                            accept: 'image/*',
                            showIf: { field: 'hasInsurance', equals: 'yes' }
                        }
                    ]
                }
            ],
            settings: {
                requireSignature: true,
                allowSave: true,
                showProgress: true,
                confirmationMessage: 'Thank you for completing the intake form. We will review your information before your appointment.'
            }
        }
    },
    
    consentToTreat: {
        name: 'Consent to Treatment',
        description: 'General consent form for medical treatment',
        type: 'consent',
        preview: 'Standard consent form for treatment authorization',
        data: {
            sections: [
                {
                    id: 'consent-section',
                    title: 'Consent to Treatment',
                    fields: [
                        {
                            id: 'consentText',
                            type: 'static-text',
                            content: `I hereby give my consent for treatment and services that may be performed during this visit or any future visits. I understand that I may revoke this consent at any time.

I authorize the healthcare providers to perform diagnostic procedures and treatment as may be necessary for my care.

I understand that no guarantee has been made regarding the results of any treatment.

I acknowledge that I have been informed of the risks, benefits, and alternatives to the proposed treatment.`
                        },
                        {
                            id: 'patientName',
                            type: 'text',
                            label: 'Patient Name',
                            required: true
                        },
                        {
                            id: 'consentAgree',
                            type: 'checkbox',
                            label: 'I have read and understand the above consent',
                            required: true
                        },
                        {
                            id: 'signature',
                            type: 'signature',
                            label: 'Patient Signature',
                            required: true
                        },
                        {
                            id: 'signatureDate',
                            type: 'date',
                            label: 'Date',
                            required: true,
                            defaultValue: 'today'
                        }
                    ]
                }
            ],
            settings: {
                requireSignature: true,
                allowSave: false,
                showProgress: false
            }
        }
    },

    hipaaConsent: {
        name: 'HIPAA Privacy Notice',
        description: 'HIPAA privacy practices acknowledgment',
        type: 'consent',
        preview: 'Notice of privacy practices and patient acknowledgment',
        data: {
            sections: [
                {
                    id: 'hipaa-notice',
                    title: 'Notice of Privacy Practices',
                    fields: [
                        {
                            id: 'hipaaText',
                            type: 'static-text',
                            content: `This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.

Our practice is committed to protecting your medical information. We are required by law to maintain the privacy of protected health information and to provide you with this notice of our legal duties and privacy practices.`
                        },
                        {
                            id: 'acknowledgment',
                            type: 'checkbox',
                            label: 'I acknowledge that I have received and reviewed the Notice of Privacy Practices',
                            required: true
                        },
                        {
                            id: 'signature',
                            type: 'signature',
                            label: 'Patient Signature',
                            required: true
                        }
                    ]
                }
            ]
        }
    }
};

module.exports = formTemplates;

// backend/src/utils/fieldValidators.js
const fieldValidators = {
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) || 'Invalid email address';
    },
    
    phone: (value) => {
        const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
        return phoneRegex.test(value) || 'Invalid phone number format';
    },
    
    ssn: (value) => {
        if (!value) return true; // SSN is optional
        const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
        return ssnRegex.test(value) || 'Invalid SSN format';
    },
    
    date: (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) || 'Invalid date';
    },
    
    zip: (value) => {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return zipRegex.test(value) || 'Invalid ZIP code';
    }
};

module.exports = fieldValidators;