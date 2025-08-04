const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FormSubmission = sequelize.define('FormSubmission', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    formId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'form_id'
    },
    patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'patient_id'
    },
    clinicId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'clinic_id'
    },
    submissionData: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        field: 'submission_data'
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'archived'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'form_submissions',
    timestamps: true,
    underscored: true
});

module.exports = FormSubmission;